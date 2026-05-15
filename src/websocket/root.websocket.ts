import {
  Inject,
  Logger,
  OnWSConnection,
  OnWSDisConnection,
  WSController,
} from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';
import { Context } from '@midwayjs/ws';

import { IUserSession } from '@/interface';
import { WsConnectionManager } from '@/manage/ws-connection.manage';

@WSController('/ws')
export class WsController {
  @Inject()
  wsConnectionManager: WsConnectionManager;

  @Logger('wsLogger')
  wsLogger: ILogger;

  /**
   * WebSocket 连接建立时的处理
   * 鉴权已在 upgrade 阶段完成，这里只需注册连接
   */
  @OnWSConnection()
  async onConnection(ctx: Context) {
    // 从 request 中获取 upgrade 阶段附加的用户信息
    const user: IUserSession['user'] = ctx.request['wsUser'];

    if (!user) {
      // 正常情况下不会发生，因为 upgrade 阶段已经鉴权
      this.wsLogger.error(
        '[WsController] Connection establishment error: missing user information'
      );
      ctx.close(1008, 'Unauthorized');
      return;
    }

    // 将用户信息存储到 ctx 中供后续使用
    ctx.user = user;

    // 注册连接到管理器
    this.wsConnectionManager.register(ctx, user);

    this.wsLogger.info(
      `[WsController] WebSocket connection established successfully, user: ${user.account}`
    );
  }

  /**
   * WebSocket 连接断开时的处理
   * 从连接管理器中移除该连接
   */
  @OnWSDisConnection()
  async onDisConnection(ctx: Context, code: number, reason: string) {
    const user = ctx.user;

    // 从连接管理器中移除
    this.wsConnectionManager.unregister(ctx);

    const userAccount = user?.account || 'unknown';
    this.wsLogger.info(
      `[WsController] WebSocket disconnected, user: ${userAccount}, code: ${code}, reason: ${reason}`
    );
  }
}
