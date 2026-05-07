import { HttpServiceFactory } from '@midwayjs/axios';
import { Inject, Logger, Provide, Singleton } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';

@Provide()
@Singleton()
export class AxiosHelper {
  @Logger()
  logger: ILogger;

  @Inject()
  httpServiceFactory: HttpServiceFactory;

  /**
   * 获取 Axios 实例
   * @param name 实例名称
   * @returns Axios 实例
   */
  async getAxiosInstance(name: string) {
    const axiosInstance = this.httpServiceFactory.get(name);
    if (!axiosInstance) {
      this.logger.error(`[AxiosHelper] Axios instance ${name} not found`);
      throw BUSINESS_ERROR_CONSTANT.AXIOS_INSTANCE_NOT_FOUND({ name });
    }
    return axiosInstance;
  }
}
