import { Controller, Get, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { MinioService } from '@/service/minio.service';

@Controller('/minio')
export class PubV1MinioController {
  @Inject()
  ctx: Context;

  @Inject()
  minioService: MinioService;

  @Get('/*')
  async getCdnFile() {
    // 从 ctx 获取 origin
    const origin = this.ctx.header.origin || this.ctx.header.host || '';

    // 从路径中提取 object_name（去掉 /minio 前缀）
    const fullPath = this.ctx.path;
    const minioPrefix = '/minio/';
    if (!fullPath.startsWith(minioPrefix)) {
      throw BUSINESS_ERROR_CONSTANT.MINIO_OBJECT_NAME_NOT_FOUND();
    }

    const objectName = fullPath.slice(minioPrefix.length);

    // 获取 MinIO 文件 URL 并重定向
    const url = await this.minioService.getDownloadUrl(origin, objectName);

    return {
      data: null,
      group: 'minio',
      msg: null,
      redirect: url,
    };
  }
}
