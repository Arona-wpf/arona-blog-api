import { Config, Inject, Logger, Provide } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { ILogger } from '@midwayjs/logger';
import COS from 'cos-nodejs-sdk-v5';
import * as STS from 'qcloud-cos-sts';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { RedisStorageEnum } from '@/definition/enums/common.enum';
import { CosBucketOperateObjectEnum } from '@/definition/enums/cos.enum';
import {
  CosBucketOperateObjectType,
  ICredentialData,
} from '@/definition/types/cos.type';
import { UserEntity } from '@/entity/user.entity';
import { RedisHelper } from '@/helper/redis.helper';
import { ICDNConfig, ICosConfig } from '@/interface';
import { CosInstanceManager } from '@/manage/cos-instance.manage';

@Provide()
export class CosService {
  @Config('cdn')
  cdnConfig: ICDNConfig;

  @Config('cos')
  cosConfig: ICosConfig;

  @Logger()
  logger: ILogger;

  @Inject()
  ctx: Context;

  @Inject()
  redisHelper: RedisHelper;

  @Inject()
  private instanceManager: CosInstanceManager;

  // ==================== 凭证管理 ====================

  /**
   * 获取 COS 临时凭证
   * @param user 申请账号
   * @param isAdmin 是否管理员
   */
  async getCosCredential(
    user: UserEntity,
    isAdmin: boolean
  ): Promise<ICredentialData> {
    const account = user.account;

    // 尝试从 Redis 缓存中读取已有凭证
    const redisService = await this.redisHelper.getRedisInstance(
      RedisStorageEnum.SCRIPT
    );
    const token = await redisService.get(
      `${RedisStorageEnum.SCRIPT}.token:${account}`
    );
    if (token) {
      return JSON.parse(token);
    }

    // 解析 bucket 配置
    const appId = this.cosConfig.bucket.substr(
      1 + this.cosConfig.bucket.lastIndexOf('-')
    );
    const shortBucketName = this.cosConfig.bucket.substr(
      0,
      this.cosConfig.bucket.lastIndexOf('-')
    );
    const publicAllowPrefix = this.cosConfig.prefix.public + account + '/*';
    const privateAllowPrefix = this.cosConfig.prefix.private + account + '/*';

    // 根据角色构建资源权限列表
    const cosPolicyResourceList: string[] = [];
    if (isAdmin) {
      // 管理员：整个桶的资源权限
      const adminPolicyResource =
        'qcs::cos:' +
        this.cosConfig.region +
        ':uid/' +
        appId +
        ':prefix//' +
        appId +
        '/' +
        shortBucketName +
        '/*';
      cosPolicyResourceList.push(adminPolicyResource);
    } else {
      // 普通用户：仅个人私有文件夹
      const privatePolicyResource =
        'qcs::cos:' +
        this.cosConfig.region +
        ':uid/' +
        appId +
        ':prefix//' +
        appId +
        '/' +
        shortBucketName +
        '/' +
        privateAllowPrefix;
      cosPolicyResourceList.push(privatePolicyResource);

      // 普通用户：个人公开文件夹
      const publicPolicyResource =
        'qcs::cos:' +
        this.cosConfig.region +
        ':uid/' +
        appId +
        ':prefix//' +
        appId +
        '/' +
        shortBucketName +
        '/' +
        publicAllowPrefix;
      cosPolicyResourceList.push(publicPolicyResource);
    }

    return new Promise<ICredentialData>((resolve, reject) => {
      STS.getCredential(
        {
          secretId: this.cosConfig.secretId,
          secretKey: this.cosConfig.secretKey,
          durationSeconds: this.cosConfig.durationSeconds,
          endpoint: this.cosConfig.endPoint,
          policy: {
            version: this.cosConfig.policyVersion,
            statement: [
              {
                action: this.cosConfig.allowActions,
                effect: 'allow',
                principal: {
                  qcs: [
                    `qcs::cam::uin/${this.cosConfig.secretId}:uin/${this.cosConfig.secretId}`,
                  ],
                },
                resource: cosPolicyResourceList,
              },
            ],
          },
        },
        (err, result) => {
          if (err) {
            this.logger.error(
              `[CosService] getCosTempToken failed, account: ${account}, reason: ${JSON.stringify(err)}`
            );
            reject(BUSINESS_ERROR_CONSTANT.COS_CREDENTIAL_FETCH_FAILED());
          } else if (result.credentials) {
            this.logger.info(
              `[CosService] getCosTempToken success, account: ${account}`
            );
            const resolveResult = {
              ...result,
              config: {
                bucket: this.cosConfig.bucket,
                region: this.cosConfig.region,
              },
            };
            // 缓存到 Redis
            redisService.setex(
              `${RedisStorageEnum.SCRIPT}.token:${account}`,
              this.cosConfig.durationSeconds,
              JSON.stringify(resolveResult)
            );
            resolve(resolveResult);
          } else {
            this.logger.error(
              `[CosService] getCosTempToken failed, account: ${account}, reason: ${JSON.stringify(
                result
              )}`
            );
            reject(BUSINESS_ERROR_CONSTANT.COS_CREDENTIAL_FETCH_FAILED());
          }
        }
      );
    });
  }

  // ==================== COS 实例管理 ====================

  /**
   * 获取或创建指定用户的 COS 实例
   * 优先从管理器池中复用，过期则重新初始化并注册
   */
  async getCosInstance(user: UserEntity, isAdmin: boolean): Promise<COS> {
    const account = user.account;

    // 尝试从池中获取已有实例
    const cached = this.instanceManager.get(account);
    if (cached) {
      return cached;
    }

    // 获取临时凭证
    const credential = await this.getCosCredential(user, isAdmin);

    // 创建 COS 客户端
    const cosInstance = new COS({
      getAuthorization: (options, callback) => {
        callback({
          TmpSecretId: credential.credentials.tmpSecretId,
          TmpSecretKey: credential.credentials.tmpSecretKey,
          SecurityToken: credential.credentials.sessionToken,
          StartTime: credential.startTime,
          ExpiredTime: credential.expiredTime,
        });
      },
    });

    // 注册到管理器（使用 STS 凭证的过期时间）
    this.instanceManager.set(account, cosInstance, credential.expiredTime);

    return cosInstance;
  }

  /**
   * 手动清理所有过期实例
   */
  cleanExpiredInstances(): number {
    return this.instanceManager.cleanExpired();
  }

  // ==================== 文件操作 ====================

  /**
   * 检查对象是否存在
   * @param user 用户实体
   * @param isAdmin 是否管理员
   * @param objectKey 对象 key
   * @returns 是否存在
   */
  async doesObjectExist(
    user: UserEntity,
    isAdmin: boolean,
    objectKey: string
  ): Promise<boolean> {
    const account = user.account;
    const cosInstance = await this.getCosInstance(user, isAdmin);

    return new Promise<boolean>((resolve, reject) => {
      cosInstance.headObject(
        {
          Bucket: this.cosConfig.bucket,
          Region: this.cosConfig.region,
          Key: objectKey,
        },
        err => {
          if (err) {
            if (err.statusCode === 404) {
              resolve(false);
            } else {
              this.logger.warn(
                `[CosService] doesObjectExist failed, account: ${account}, objectKey: ${objectKey}, statusCode: ${err.statusCode}`
              );
              reject(BUSINESS_ERROR_CONSTANT.COS_OBJECT_NO_ACCESS());
            }
          } else {
            resolve(true);
          }
        }
      );
    });
  }

  /**
   * 获取对象的签名 URL
   * @param user 用户实体
   * @param isAdmin 是否管理员
   * @param objectKey 对象 key
   * @param expires 链接有效期（秒），默认取配置 durationSeconds
   * @returns CDN 签名 URL
   */
  async getObjectUrlWithSignature(
    user: UserEntity,
    isAdmin: boolean,
    objectKey: string,
    expires?: number
  ): Promise<string> {
    const cosInstance = await this.getCosInstance(user, isAdmin);

    return new Promise<string>((resolve, reject) => {
      cosInstance.getObjectUrl(
        {
          Bucket: this.cosConfig.bucket,
          Region: this.cosConfig.region,
          Key: objectKey,
          Sign: true,
          Expires: expires ?? this.cosConfig.durationSeconds,
          Domain: this.cdnConfig.domain,
        },
        (err, data) => {
          if (err) {
            this.logger.error(
              `[CosService] getObjectUrlWithSignature failed, account: ${user.account}, objectKey: ${objectKey}, err: ${err.message}`
            );
            reject(BUSINESS_ERROR_CONSTANT.COS_GET_URL_FAILED());
          } else if (!data.Url) {
            this.logger.error(
              `[CosService] getObjectUrlWithSignature: empty URL returned, account: ${user.account}, objectKey: ${objectKey}`
            );
            reject(BUSINESS_ERROR_CONSTANT.COS_GET_URL_FAILED());
          } else {
            // 返回 自定义域名的签名 URL
            resolve(data.Url);
          }
        }
      );
    });
  }

  // ==================== 存储桶操作 ====================

  /**
   * 获取存储桶目录数据
   * @param user 用户实体
   * @param isAdmin 是否管理员
   * @param prefix 路径前缀匹配
   * @param deep 是否深层递归查询
   * @returns 指定路径下的文件目录数据
   */
  async getBucketData(
    user: UserEntity,
    isAdmin: boolean,
    prefix?: string,
    deep = false
  ): Promise<COS.GetBucketResult> {
    const cosInstance = await this.getCosInstance(user, isAdmin);

    return new Promise<COS.GetBucketResult>((resolve, reject) => {
      cosInstance.getBucket(
        {
          Bucket: this.cosConfig.bucket,
          Region: this.cosConfig.region,
          Prefix: prefix,
          Delimiter: deep ? undefined : '/',
        },
        (err, data) => {
          if (err) {
            this.logger.error(
              `[CosService] getBucketData failed, account: ${user.account}, prefix: ${prefix}, err: ${err.message}`
            );
            reject(BUSINESS_ERROR_CONSTANT.COS_GET_BUCKET_DATA_FAILED());
          } else if (data.statusCode === 200) {
            this.logger.info(
              `[CosService] getBucketData success, account: ${user.account}`
            );
            resolve(data);
          } else {
            this.logger.error(
              `[CosService] getBucketData failed, account: ${user.account}, statusCode: ${data.statusCode}`
            );
            reject(BUSINESS_ERROR_CONSTANT.COS_GET_BUCKET_DATA_FAILED());
          }
        }
      );
    });
  }

  /**
   * 创建文件夹（空对象模拟目录）
   * @param user 用户实体
   * @param isAdmin 是否管理员
   * @param objectKey 目录的对象键
   * @returns putObject 接口返回值
   */
  async createFolder(
    user: UserEntity,
    isAdmin: boolean,
    objectKey: string
  ): Promise<COS.PutObjectResult> {
    const account = user.account;
    const cosInstance = await this.getCosInstance(user, isAdmin);

    // 检查是否已存在同名对象
    const exists = await this.doesObjectExist(user, isAdmin, objectKey);
    if (exists) {
      throw BUSINESS_ERROR_CONSTANT.COS_OBJECT_HAS_EXISTS();
    }

    return new Promise<COS.PutObjectResult>((resolve, reject) => {
      cosInstance.putObject(
        {
          Bucket: this.cosConfig.bucket,
          Region: this.cosConfig.region,
          Key: objectKey,
          Body: '',
        },
        (err, data) => {
          if (err) {
            this.logger.error(
              `[CosService] createFolder failed, account: ${account}, key: ${objectKey}, err: ${err.message}`
            );
            reject(BUSINESS_ERROR_CONSTANT.COS_CREATE_FOLDER_FAILED());
          } else if (data.statusCode === 200) {
            this.logger.info(
              `[CosService] createFolder success, account: ${account}, key: ${objectKey}`
            );
            resolve(data);
          } else {
            this.logger.error(
              `[CosService] createFolder failed, account: ${account}, statusCode: ${data.statusCode}`
            );
            reject(BUSINESS_ERROR_CONSTANT.COS_CREATE_FOLDER_FAILED());
          }
        }
      );
    });
  }

  /**
   * 删除对象（含文件夹）
   * @param user 用户实体
   * @param isAdmin 是否管理员
   * @param type 类型：folder-文件夹, file-文件对象
   * @param objectKey 对象 key
   * @returns deleteObject 接口返回值
   */
  async deleteObject(
    user: UserEntity,
    isAdmin: boolean,
    type: CosBucketOperateObjectType,
    objectKey: string
  ): Promise<COS.DeleteObjectResult | null> {
    const account = user.account;
    const cosInstance = await this.getCosInstance(user, isAdmin);

    // 检查对象是否存在
    const exists = await this.doesObjectExist(user, isAdmin, objectKey);
    if (!exists) {
      this.logger.warn(
        `[CosService] deleteObject: object not found, account: ${account}, key: ${objectKey}`
      );
      return null;
    }

    // 文件夹删除：需先检查是否为空
    if (type === CosBucketOperateObjectEnum.FOLDER) {
      // 获取文件夹下的内容
      const bucketData = await this.getBucketData(
        user,
        isAdmin,
        objectKey,
        true
      );

      // 如果包含子文件夹或文件（>=2 因为文件夹目录本身算一个空对象），拒绝删除
      if (
        bucketData.CommonPrefixes?.length ||
        bucketData.Contents?.length >= 2
      ) {
        throw BUSINESS_ERROR_CONSTANT.COS_FOLDER_HAS_OBJECT();
      }
    }

    return new Promise<COS.DeleteObjectResult>((resolve, reject) => {
      cosInstance.deleteObject(
        {
          Bucket: this.cosConfig.bucket,
          Region: this.cosConfig.region,
          Key: objectKey,
        },
        (err, data) => {
          if (err) {
            this.logger.error(
              `[CosService] deleteObject failed, account: ${account}, key: ${objectKey}, err: ${err.message}`
            );
            reject(BUSINESS_ERROR_CONSTANT.COS_DELETE_FILE_FAILED());
          } else if (data.statusCode === 204) {
            this.logger.info(
              `[CosService] deleteObject success, account: ${account}, key: ${objectKey}`
            );
            resolve(data);
          } else {
            this.logger.error(
              `[CosService] deleteObject failed, account: ${account}, statusCode: ${data.statusCode}`
            );
            reject(BUSINESS_ERROR_CONSTANT.COS_DELETE_FOLDER_FAILED());
          }
        }
      );
    });
  }
}
