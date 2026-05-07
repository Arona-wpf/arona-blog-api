import { Logger, Singleton } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';
import COS from 'cos-nodejs-sdk-v5';

interface CosInstanceRecord {
  instance: COS;
  expiredTime: number; // Unix 秒
}

/**
 * COS 实例管理器（单例）
 * 按账号复用 COS 客户端实例，避免每次请求都重新初始化。
 * 内置过期自动清理机制。
 */
@Singleton()
export class CosInstanceManager {
  private pool: Map<string, CosInstanceRecord> = new Map();

  @Logger()
  logger: ILogger;

  /**
   * 获取指定账号的 COS 实例
   * 如果实例已过期或不存在，返回 null
   */
  get(account: string): COS | null {
    const record = this.pool.get(account);
    if (!record) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (record.expiredTime <= now) {
      // 实例已过期，清理
      this.remove(account);
      return null;
    }

    return record.instance;
  }

  /**
   * 注册新的 COS 实例
   * @param account 账号
   * @param instance COS 客户端实例
   * @param expiredTime 过期时间（Unix 秒，与 STS 凭证 expiredTime 一致）
   */
  set(account: string, instance: COS, expiredTime: number) {
    // 提前清除旧记录
    this.remove(account);

    this.pool.set(account, { instance, expiredTime });
    this.logger?.info(
      `[CosInstanceManager] registered, account: ${account}, expiredAt: ${new Date(
        expiredTime * 1000
      ).toISOString()}`
    );
  }

  /**
   * 移除指定账号的实例
   */
  remove(account: string) {
    this.pool.delete(account);
    this.logger?.info(
      `[CosInstanceManager] removed expired instance, account: ${account}`
    );
  }

  /**
   * 清理所有过期实例
   * @returns 清理数量
   */
  cleanExpired(): number {
    const now = Math.floor(Date.now() / 1000);
    let count = 0;

    for (const [account, record] of this.pool) {
      if (record.expiredTime <= now) {
        this.pool.delete(account);
        count++;
      }
    }

    if (count > 0) {
      this.logger?.info(
        `[CosInstanceManager] cleaned ${count} expired instance(s)`
      );
    }

    return count;
  }

  /**
   * 获取当前池中实例数量
   */
  get size(): number {
    return this.pool.size;
  }
}
