import { Config, Init, Provide, Singleton } from '@midwayjs/core';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { ICDNConfig } from '@/interface';
import { MinioService } from '@/service/minio.service';

@Provide()
@Singleton()
export class CdnService {
  @Config('cdn')
  cdnConfig: ICDNConfig;

  private allowedOrigins: string[];

  @Init()
  async init() {
    this.allowedOrigins = this.cdnConfig.allowedOrigins;
  }

  /**
   * 校验 Origin 是否允许访问
   * @param origin 请求来源
   */
  isOriginAllowed(origin: string): boolean {
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
   * 获取 CDN 文件访问 URL
   * @param origin 请求来源
   * @param objectName 对象名称
   * @param minioService Minio 服务实例
   */
  async getCdnFileUrl(
    origin: string,
    objectName: string,
    minioService: MinioService
  ): Promise<string> {
    // 校验 Origin
    if (!this.isOriginAllowed(origin)) {
      throw BUSINESS_ERROR_CONSTANT.CDN_ORIGIN_NOT_ALLOWED();
    }

    // 校验 objectName
    if (!objectName) {
      throw BUSINESS_ERROR_CONSTANT.CDN_OBJECT_NAME_NOT_FOUND();
    }

    // 从 Minio 获取预签名 URL
    try {
      return await minioService.getDownloadUrl(objectName, 60 * 60); // 1小时有效期
    } catch {
      throw BUSINESS_ERROR_CONSTANT.CDN_GET_URL_FAILED();
    }
  }
}
