import { Provide, Singleton } from '@midwayjs/core';

/**
 * 用户会话映射管理器
 * 维护 account 与 sessionId 的双向索引，用于顶号处理
 */
@Provide()
@Singleton()
export class UserSessionManager {
  /**
   * account -> sessionId
   */
  private accountSessionMap: Map<string, string> = new Map();

  /**
   * sessionId -> account
   */
  private sessionAccountMap: Map<string, string> = new Map();

  /**
   * 绑定用户与会话
   */
  bind(account: string, sessionId: string): void {
    const oldSessionId = this.accountSessionMap.get(account);
    if (oldSessionId && oldSessionId !== sessionId) {
      this.sessionAccountMap.delete(oldSessionId);
    }

    const oldAccount = this.sessionAccountMap.get(sessionId);
    if (oldAccount && oldAccount !== account) {
      this.accountSessionMap.delete(oldAccount);
    }

    this.accountSessionMap.set(account, sessionId);
    this.sessionAccountMap.set(sessionId, account);
  }

  /**
   * 获取用户当前会话ID
   */
  getSessionId(account: string): string | undefined {
    return this.accountSessionMap.get(account);
  }

  /**
   * 按账号解绑会话
   */
  unbindByAccount(account: string, expectedSessionId?: string): void {
    const sessionId = this.accountSessionMap.get(account);
    if (!sessionId) return;

    // 仅在指定会话匹配时解绑，避免误删新会话
    if (expectedSessionId && sessionId !== expectedSessionId) {
      return;
    }

    this.accountSessionMap.delete(account);
    this.sessionAccountMap.delete(sessionId);
  }

  /**
   * 按会话ID解绑
   */
  unbindBySessionId(sessionId: string): void {
    const account = this.sessionAccountMap.get(sessionId);
    if (!account) return;

    this.sessionAccountMap.delete(sessionId);
    this.accountSessionMap.delete(account);
  }
}
