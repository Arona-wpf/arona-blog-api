import { Inject, Logger, Provide, Singleton } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';
import { RedisServiceFactory } from '@midwayjs/redis';

@Provide()
@Singleton()
export class RedisHelper {
  @Logger()
  logger: ILogger;

  @Inject()
  redisServiceFactory: RedisServiceFactory;

  /**
   * 获取 Redis 服务
   * @param name 服务名称
   * @returns Redis 服务
   */
  async getRedisInstance(name: string) {
    const redisInstance = this.redisServiceFactory.get(name);
    if (!redisInstance) {
      this.logger.error(`[RedisHelper] Redis instance ${name} not found`);
      throw new Error(`Redis instance ${name} not found`);
    }
    return redisInstance;
  }
}
