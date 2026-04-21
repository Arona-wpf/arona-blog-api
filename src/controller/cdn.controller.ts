import { Controller, Get, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { CdnService } from '@/service/cdn.service';
import { MinioService } from '@/service/minio.service';

@Controller('/cdn')
export class PubV1CdnController {
  @Inject()
  ctx: Context;

  @Inject()
  cdnService: CdnService;

  @Inject()
  minioService: MinioService;

  @Get('/*')
  async getCdnFile() {
    // 从 ctx 获取 origin
    const origin = this.ctx.header.origin || this.ctx.header.host || '';

    // 从路径中提取 object_name（去掉 /cdn 前缀）
    const fullPath = this.ctx.path;
    const cdnPrefix = '/cdn/';
    if (!fullPath.startsWith(cdnPrefix)) {
      throw BUSINESS_ERROR_CONSTANT.CDN_OBJECT_NAME_NOT_FOUND();
    }

    const objectName = fullPath.slice(cdnPrefix.length);

    // 获取 CDN 文件 URL 并重定向
    const url = await this.cdnService.getCdnFileUrl(
      origin,
      objectName,
      this.minioService
    );

    return {
      data: null,
      group: 'cdn',
      msg: null,
      redirect: url,
    };
  }
}
