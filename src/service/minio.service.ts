import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
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

import { FileType } from '@/definition/types/file.type';
import { IMinioConfig } from '@/interface';

@Provide()
@Singleton()
export class MinioService {
  @Config('minio')
  minioConfig: IMinioConfig;

  private client: S3Client;

  private bucket: string;

  /**
   * 初始化 MinIO 客户端并确保 bucket 存在
   */
  @Init()
  async init() {
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
    const key = `${type}/${dayjs().format('YYYY-MM')}/${nanoid(16)}${extname(
      file.filename
    )}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: createReadStream(file.data),
        ContentType: file.mimeType,
      })
    );

    const url = await this.getDownloadUrl(key);
    return {
      bucket: this.bucket,
      object_name: key,
      url,
    };
  }

  /**
   * 获取文件下载信息
   * @param objectName 对象名称
   * @param expiresIn 链接过期秒数
   * @returns 包含桶名、对象名和下载地址
   */
  async downloadFile(objectName: string, expiresIn?: number) {
    const url = await this.getDownloadUrl(objectName, expiresIn);
    return {
      bucket: this.bucket,
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
   * 获取普通预览下载链接
   * @param objectName 对象名称
   * @param expiresIn 链接过期秒数
   * @returns 预签名访问链接
   */
  async getDownloadUrl(objectName: string, expiresIn = 10 * 60) {
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
