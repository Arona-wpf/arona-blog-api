import { Provide, Singleton } from '@midwayjs/core';
import { Context } from '@midwayjs/ws';

import { IUserSession } from '@/interface';

/**
 * WebSocket 连接管理器
 * 维护用户账号与 WebSocket 连接的绑定关系，支持单播
 */
@Provide()
@Singleton()
export class WsConnectionManager {
  /**
   * 用户账号 -> WebSocket Context 的映射
   * 一个用户可能有多个连接（多设备登录）
   */
  private userConnections: Map<string, Set<Context>> = new Map();

  /**
   * WebSocket Context -> 用户信息的反向映射
   */
  private connectionUser: Map<Context, IUserSession['user']> = new Map();

  /**
   * 注册连接
   * @param ctx WebSocket Context
   * @param user 用户信息
   */
  register(ctx: Context, user: IUserSession['user']): void {
    const account = user.account;

    // 建立正向映射
    if (!this.userConnections.has(account)) {
      this.userConnections.set(account, new Set());
    }
    this.userConnections.get(account).add(ctx);

    // 建立反向映射
    this.connectionUser.set(ctx, user);
  }

  /**
   * 移除连接
   * @param ctx WebSocket Context
   */
  unregister(ctx: Context): void {
    const user = this.connectionUser.get(ctx);
    if (!user) return;

    const account = user.account;

    // 移除正向映射
    const connections = this.userConnections.get(account);
    if (connections) {
      connections.delete(ctx);
      // 如果该用户没有任何连接了，移除整个条目
      if (connections.size === 0) {
        this.userConnections.delete(account);
      }
    }

    // 移除反向映射
    this.connectionUser.delete(ctx);
  }

  /**
   * 获取指定用户的所有连接
   * @param account 用户账号
   */
  getConnections(account: string): Set<Context> | undefined {
    return this.userConnections.get(account);
  }

  /**
   * 获取连接对应的用户信息
   * @param ctx WebSocket Context
   */
  getUser(ctx: Context): IUserSession['user'] | undefined {
    return this.connectionUser.get(ctx);
  }

  /**
   * 单播：向指定用户发送消息
   * @param account 用户账号
   * @param event 事件名称
   * @param data 数据
   */
  sendToUser(account: string, event: string, data: any): void {
    const connections = this.userConnections.get(account);
    if (!connections || connections.size === 0) return;

    const message = JSON.stringify({ event, data });
    for (const ctx of connections) {
      // 检查连接是否仍然活跃
      if (ctx.readyState === 1) {
        ctx.send(message);
      }
    }
  }

  /**
   * 广播：向所有连接发送消息
   * @param event 事件名称
   * @param data 数据
   * @param excludeAccount 排除的用户账号（可选）
   */
  broadcast(event: string, data: any, excludeAccount?: string): void {
    const message = JSON.stringify({ event, data });

    for (const [account, connections] of this.userConnections) {
      if (excludeAccount && account === excludeAccount) continue;

      for (const ctx of connections) {
        if (ctx.readyState === 1) {
          ctx.send(message);
        }
      }
    }
  }

  /**
   * 获取当前在线用户数量
   */
  getOnlineUserCount(): number {
    return this.userConnections.size;
  }

  /**
   * 获取当前总连接数量
   */
  getTotalConnectionCount(): number {
    let count = 0;
    for (const connections of this.userConnections.values()) {
      count += connections.size;
    }
    return count;
  }

  /**
   * 获取所有在线用户账号列表
   */
  getOnlineAccounts(): string[] {
    return Array.from(this.userConnections.keys());
  }

  /**
   * 检查用户是否在线
   * @param account 用户账号
   */
  isUserOnline(account: string): boolean {
    const connections = this.userConnections.get(account);
    return connections !== undefined && connections.size > 0;
  }
}
