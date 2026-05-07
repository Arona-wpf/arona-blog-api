import { Inject, Logger, Provide, Singleton } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';
import { RedisServiceFactory } from '@midwayjs/redis';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';

@Provide()
@Singleton()
export class RedisHelper {
  @Logger()
  logger: ILogger;

  @Inject()
  redisServiceFactory: RedisServiceFactory;

  /**
   * 获取 Redis 实例
   * @param name 实例名称
   * @returns Redis 实例
   */
  async getRedisInstance(name: string) {
    const redisInstance = this.redisServiceFactory.get(name);
    if (!redisInstance) {
      this.logger.error(`[RedisHelper] Redis instance ${name} not found`);
      throw BUSINESS_ERROR_CONSTANT.REDIS_INSTANCE_NOT_FOUND({ name });
    }
    return redisInstance;
  }
}
