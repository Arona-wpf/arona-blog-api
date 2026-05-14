import {
  Inject,
  Logger,
  OnWSConnection,
  OnWSDisConnection,
  OnWSMessage,
  WSController,
} from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';
import { Context } from '@midwayjs/ws';

import { LogTypeEnum } from '@/definition/enums/log.enum';
import { SubscribeLogDto, UnsubscribeLogDto } from '@/dto/log.dto';
import { IUserSession } from '@/interface';
import { LogService } from '@/service/log.service';

/**
 * 日志WebSocket控制器
 * 处理日志实时订阅和推送
 */
@WSController('/ws/log')
export class LogWsController {
  @Inject()
  logService: LogService;

  @Logger('wsLogger')
  wsLogger: ILogger;

  /**
   * WebSocket 连接建立时的处理
   */
  @OnWSConnection()
  async onConnection(ctx: Context) {
    // 从 request 中获取 upgrade 阶段附加的用户信息
    const user: IUserSession['user'] = ctx.request['wsUser'];

    if (!user) {
      this.wsLogger.error(
        '[LogWsController] Connection error: missing user information'
      );
      ctx.close(1008, 'Unauthorized');
      return;
    }

    // 存储用户信息到 ctx
    ctx.user = user;

    this.wsLogger.info(
      `[LogWsController] Log WebSocket connected, user: ${user.account}`
    );
  }

  /**
   * 处理订阅日志请求
   * 事件名: log:subscribe
   */
  @OnWSMessage('log:subscribe')
  async onSubscribe(ctx: Context, data: SubscribeLogDto) {
    const user = ctx.user;

    if (!user) {
      ctx.send(
        JSON.stringify({
          event: 'log:error',
          data: { message: 'Unauthorized' },
        })
      );
      return;
    }

    try {
      // 验证日志文件是否存在
      const files = this.logService.getLogFileList(data.type);
      const targetFile = files.find(f => f.filename === data.filename);

      if (!targetFile) {
        ctx.send(
          JSON.stringify({
            event: 'log:error',
            data: { message: 'Log file not found', type: data.type },
          })
        );
        return;
      }

      // 订阅日志
      const success = this.logService.subscribe(user.account, data);

      if (success) {
        // 发送订阅成功确认
        ctx.send(
          JSON.stringify({
            event: 'log:subscribed',
            data: {
              type: data.type,
              filename: data.filename,
              message: 'Successfully subscribed to log',
            },
          })
        );

        // 立即发送当前日志的最后 N 行（让用户看到上下文）
        const result = this.logService.readLogContent(data.filename, 0, 100);
        if (result.lines.length > 0) {
          ctx.send(
            JSON.stringify({
              event: 'log:init',
              data: {
                type: data.type,
                lines: result.lines,
                totalLines: result.totalLines,
              },
            })
          );
        }
      }
    } catch (error) {
      this.wsLogger.error(`[LogWsController] Subscribe error: ${error}`);
      ctx.send(
        JSON.stringify({
          event: 'log:error',
          data: { message: 'Failed to subscribe to log' },
        })
      );
    }
  }

  /**
   * 处理取消订阅日志请求
   * 事件名: log:unsubscribe
   */
  @OnWSMessage('log:unsubscribe')
  async onUnsubscribe(ctx: Context, data: UnsubscribeLogDto) {
    const user = ctx.user;

    if (!user) {
      return;
    }

    try {
      this.logService.unsubscribe(user.account, data.type);

      ctx.send(
        JSON.stringify({
          event: 'log:unsubscribed',
          data: {
            type: data.type,
            message: 'Successfully unsubscribed from log',
          },
        })
      );
    } catch (error) {
      this.wsLogger.error(`[LogWsController] Unsubscribe error: ${error}`);
    }
  }

  /**
   * 处理获取日志类型列表请求
   * 事件名: log:getTypes
   */
  @OnWSMessage('log:getTypes')
  async onGetTypes(ctx: Context) {
    const types = this.logService.getLogTypes();

    ctx.send(
      JSON.stringify({
        event: 'log:types',
        data: types,
      })
    );
  }

  /**
   * 处理获取日志文件列表请求
   * 事件名: log:getFiles
   */
  @OnWSMessage('log:getFiles')
  async onGetFiles(ctx: Context, data: { type: LogTypeEnum }) {
    const files = this.logService.getLogFileList(data.type);

    ctx.send(
      JSON.stringify({
        event: 'log:files',
        data: {
          type: data.type,
          files,
        },
      })
    );
  }

  /**
   * WebSocket 连接断开时的处理
   */
  @OnWSDisConnection()
  async onDisConnection(ctx: Context, code: number, reason: string) {
    const user = ctx.user;

    if (user) {
      // 清理该用户的所有订阅
      const subscriptions = this.logService.getUserSubscriptions(user.account);
      for (const type of subscriptions) {
        this.logService.unsubscribe(user.account, type);
      }

      this.wsLogger.info(
        `[LogWsController] Log WebSocket disconnected, user: ${user.account}, code: ${code}, reason: ${reason}`
      );
    }
  }
}
