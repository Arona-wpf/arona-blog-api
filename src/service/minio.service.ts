import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Config, Init, Provide, Singleton } from '@midwayjs/core';
import { UploadFileInfo } from '@midwayjs/upload';
import dayjs from 'dayjs';
import { createReadStream } from 'fs';
import { nanoid } from 'nanoid';
import { basename, extname } from 'path';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { FileType } from '@/definition/types/file.type';
import { IMinioConfig } from '@/interface';

@Provide()
@Singleton()
export class MinioService {
  @Config('minio')
  minioConfig: IMinioConfig;

  private client: S3Client;

  private bucket: string;

  private allowedOrigins: string[];

  /**
   * 初始化 MinIO 客户端并确保 bucket 存在
   */
  @Init()
  async init() {
    // 初始化 allowedOrigins
    this.allowedOrigins = this.minioConfig.allowedOrigins;

    const { accessKeyId, secretAccessKey, bucket, region, endpoint } =
      this.minioConfig;

    this.bucket = bucket;
    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    await this.ensureBucket();
  }

  /**
   * 校验 Origin 是否允许访问
   * @param origin 请求来源
   */
  private isOriginAllowed(origin: string): boolean {
    if (!origin) return false;

    // 解析 origin，提取 hostname
    let hostname: string;
    try {
      // 如果 origin 是完整 URL，解析出 hostname
      if (origin.startsWith('http://') || origin.startsWith('https://')) {
        const url = new URL(origin);
        hostname = url.hostname;
      } else {
        // 如果只是 hostname（来自 host header），直接使用
        hostname = origin.split(':')[0]; // 去掉端口
      }
    } catch {
      hostname = origin.split(':')[0];
    }

    // 检查是否在允许列表中
    return this.allowedOrigins.some(allowed => {
      // 支持通配符匹配（如 *.arona-blog.com）
      if (allowed.startsWith('*.')) {
        const baseDomain = allowed.slice(2);
        return hostname === baseDomain || hostname.endsWith('.' + baseDomain);
      }
      return hostname === allowed;
    });
  }

  /**
   * 检查 bucket 是否存在，不存在则自动创建
   */
  private async ensureBucket() {
    try {
      await this.client.send(
        new HeadBucketCommand({
          Bucket: this.bucket,
        })
      );
    } catch {
      await this.client.send(
        new CreateBucketCommand({
          Bucket: this.bucket,
        })
      );
    }
  }

  /**
   * 上传文件到对象存储并返回访问信息
   * @param file 上传文件信息
   * @param type 文件业务类型
   * @returns 包含桶名、对象名和下载地址
   */
  async uploadFile(file: UploadFileInfo<string>, type: FileType) {
    const objectKey = `${type}/${dayjs().format('YYYY-MM')}/${nanoid(16)}${extname(
      file.filename
    )}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: createReadStream(file.data),
        ContentType: file.mimeType,
      })
    );

    return this.getAttachmentDownloadUrl(
      objectKey,
      10 * 60,
      objectKey.split('/').pop()
    );
  }

  /**
   * 上传 buffer 到对象存储
   * @param buffer 文件内容
   * @param objectKey 对象路径（如 temp/gacha/xxx.json）
   * @param contentType MIME 类型
   * @returns 预签名下载链接
   */
  async uploadBuffer(buffer: Buffer, objectKey: string, contentType: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return this.getAttachmentDownloadUrl(
      objectKey,
      10 * 60,
      objectKey.split('/').pop()
    );
  }

  /**
   * 获取文件下载信息
   * @param origin 请求来源
   * @param objectName 对象名称
   * @param expiresIn 链接过期秒数
   * @returns 包含对象名和下载地址
   */
  async downloadFile(origin: string, objectName: string, expiresIn?: number) {
    const url = await this.getDownloadUrl(origin, objectName, expiresIn);
    return {
      object_name: objectName,
      url,
    };
  }

  /**
   * 获取附件下载链接（带下载文件名）
   * @param objectName 对象名称
   * @param expiresIn 链接过期秒数(默认1小时)
   * @param fileName 下载文件名
   * @returns 预签名下载链接
   */
  async getAttachmentDownloadUrl(
    objectName: string,
    expiresIn = 60 * 60,
    fileName?: string
  ) {
    const safeFileName = fileName?.trim() || basename(objectName);
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectName,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(
          safeFileName
        )}"`,
      }),
      {
        expiresIn,
      }
    );
  }

  /**
   * 检查对象是否存在
   * @param objectName 对象名称
   */
  async objectExists(objectName: string) {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: objectName,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取普通预览下载链接
   * @param origin 请求来源
   * @param objectName 对象名称
   * @param expiresIn 链接过期秒数
   * @returns 预签名访问链接
   */
  async getDownloadUrl(
    origin: string,
    objectName: string,
    expiresIn = 10 * 60
  ) {
    // 校验 Origin
    if (!this.isOriginAllowed(origin)) {
      throw BUSINESS_ERROR_CONSTANT.MINIO_ORIGIN_NOT_ALLOWED();
    }

    // 校验 objectName
    if (!objectName) {
      throw BUSINESS_ERROR_CONSTANT.MINIO_OBJECT_NAME_NOT_FOUND();
    }

    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectName,
      }),
      {
        expiresIn,
      }
    );
  }
}
