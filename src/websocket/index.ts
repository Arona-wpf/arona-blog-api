import {
  Inject,
  Logger,
  OnWSConnection,
  OnWSDisConnection,
  OnWSMessage,
  WSController,
} from '@midwayjs/core';
import { MidwayI18nService } from '@midwayjs/i18n';
import { ILogger } from '@midwayjs/logger';
import { Context } from '@midwayjs/ws';

import { LocaleEnum } from '@/definition/enums/common.enum';
import {
  EventParseResult,
  LocaleUpdateData,
  WsMessageEvent,
} from '@/definition/types/websocket.type';
import { SubscribeLogDto, UnsubscribeLogDto } from '@/dto/log.dto';
import { WsConnectionManager } from '@/manage/ws-connection.manage';
import { LogService } from '@/service/log.service';

@WSController('/ws')
export class WsController {
  @Inject()
  ctx: Context;

  @Inject()
  logService: LogService;

  @Inject()
  wsConnectionManager: WsConnectionManager;

  @Inject()
  i18nService: MidwayI18nService;

  @Logger('wsLogger')
  wsLogger: ILogger;

  /**
   * WebSocket 连接建立时的处理
   */
  @OnWSConnection()
  async onConnection(ctx: Context) {
    const user = ctx.request.wsUser;

    if (!user) {
      this.wsLogger.error(
        '[WsController] Connection error: missing user information'
      );
      ctx.close(1008, 'Unauthorized');
      return;
    }

    ctx.user = user;
    this.wsConnectionManager.register(ctx, user);

    this.wsLogger.info(
      `[WsController] WebSocket connected, user: ${user.account}, locale: ${user.locale}`
    );
  }

  /**
   * 消息分发处理器
   * 所有 WebSocket 消息都通过这里接收并分发
   */
  @OnWSMessage('message')
  async onMessage(data: Buffer) {
    try {
      const rawData = data.toString();
      const message: WsMessageEvent = JSON.parse(rawData);

      // 解析事件：module:action
      const parseResult = this.parseEvent(message.event);
      if (!parseResult) {
        return {
          event: 'error',
          data: { message: this.t('log.ws.invalid.event') },
        };
      }

      this.wsLogger.info(
        `[WsController] Message from ${this.ctx.user?.account}: module=${parseResult.module}, action=${parseResult.action}`
      );

      // 根据模块分发
      return this.dispatchToModule(parseResult, message.data);
    } catch (error) {
      this.wsLogger.error(`[WsController] Message parse error: ${error}`);
      return {
        event: 'error',
        data: { message: this.t('log.ws.invalid.message') },
      };
    }
  }

  /**
   * 解析事件字符串
   * @param event 事件名，格式为 module:action
   * @returns 解析结果或 null
   */
  private parseEvent(event: string): EventParseResult | null {
    const parts = event.split(':');
    if (parts.length !== 2) {
      return null;
    }
    return {
      module: parts[0],
      action: parts[1],
    };
  }

  /**
   * 分发到对应模块处理
   */
  private dispatchToModule(parseResult: EventParseResult, data: unknown) {
    switch (parseResult.module) {
      case 'log':
        return this.handleLogModule(parseResult.action, data);

      case 'locale':
        return this.handleLocaleModule(parseResult.action, data);

      default:
        this.wsLogger.warn(
          `[WsController] Unknown module: ${parseResult.module}`
        );
        return {
          event: 'error',
          data: { message: this.t('log.ws.unknown.module') },
        };
    }
  }

  /**
   * 处理 log 模块的事件
   */
  private handleLogModule(action: string, data: unknown) {
    switch (action) {
      case 'subscribe':
        return this.handleLogSubscribe(data as SubscribeLogDto);

      case 'unsubscribe':
        return this.handleLogUnsubscribe(data as UnsubscribeLogDto);

      default:
        this.wsLogger.warn(`[WsController] Unknown log action: ${action}`);
        return {
          event: 'log:error',
          data: { message: this.t('log.ws.unknown.action') },
        };
    }
  }

  /**
   * 处理 locale 模块的事件
   */
  private handleLocaleModule(action: string, data: unknown) {
    switch (action) {
      case 'update':
        return this.handleLocaleUpdate(data as LocaleUpdateData);

      default:
        this.wsLogger.warn(`[WsController] Unknown locale action: ${action}`);
        return {
          event: 'error',
          data: { message: this.t('log.ws.unknown.action') },
        };
    }
  }

  /**
   * 处理日志订阅
   */
  private handleLogSubscribe(data: SubscribeLogDto) {
    const user = this.ctx.user;

    if (!user) {
      return {
        event: 'log:error',
        data: { message: this.t('log.ws.unauthorized') },
      };
    }

    try {
      const files = this.logService.getLogFileList(data.type);
      const targetFile = files.find(f => f.filename === data.filename);

      if (!targetFile) {
        return {
          event: 'log:error',
          data: {
            message: this.t('log.ws.file.notfound'),
            type: data.type,
          },
        };
      }

      // subscribe 返回实际监听的文件名
      const actualFilename = this.logService.subscribe(user.account, data);

      if (actualFilename) {
        // 发送订阅成功确认（使用实际监听的文件名）
        this.ctx.send(
          JSON.stringify({
            event: 'log:subscribed',
            data: {
              type: data.type,
              filename: actualFilename,
              message: this.t('log.ws.subscribe.success'),
            },
          })
        );

        // 从实际监听的文件读取当前日志内容
        const result = this.logService.readLogContent(actualFilename, 0, 100);
        if (result.lines.length > 0) {
          return {
            event: 'log:init',
            data: {
              type: data.type,
              lines: result.lines,
              totalLines: result.totalLines,
            },
          };
        }
      }
    } catch (error) {
      this.wsLogger.error(`[WsController] Log subscribe error: ${error}`);
      return {
        event: 'log:error',
        data: { message: this.t('log.ws.subscribe.failed') },
      };
    }
  }

  /**
   * 处理日志取消订阅
   */
  private handleLogUnsubscribe(data: UnsubscribeLogDto) {
    const user = this.ctx.user;

    if (!user) {
      return;
    }

    try {
      this.logService.unsubscribe(user.account, data.type);

      return {
        event: 'log:unsubscribed',
        data: {
          type: data.type,
          message: this.t('log.ws.unsubscribe.success'),
        },
      };
    } catch (error) {
      this.wsLogger.error(`[WsController] Log unsubscribe error: ${error}`);
    }
  }

  /**
   * 处理 locale 更新
   */
  private handleLocaleUpdate(data: LocaleUpdateData) {
    const user = this.ctx.user;

    if (!user) {
      return;
    }

    // 验证 locale 值
    const validLocales = Object.values(LocaleEnum);
    if (!validLocales.includes(data.locale as LocaleEnum)) {
      return {
        event: 'error',
        data: { message: `Invalid locale: ${data.locale}` },
      };
    }

    // 更新用户 locale
    user.locale = data.locale;

    return {
      event: 'locale:updated',
      data: {
        locale: data.locale,
        message: this.t('log.ws.locale.updated'),
      },
    };
  }

  /**
   * 国际化翻译
   */
  private t(key: string): string {
    const locale = this.ctx.user?.locale || LocaleEnum.ZH_CN;
    return this.i18nService.translate(key, { locale, group: 'log' });
  }

  /**
   * WebSocket 连接断开时的处理
   */
  @OnWSDisConnection()
  async onDisConnection(ctx: Context, code: number, reason: string) {
    const user = ctx.user;

    this.wsConnectionManager.unregister(ctx);

    if (user) {
      // 清理该用户的所有日志订阅
      const subscriptions = this.logService.getUserSubscriptions(user.account);
      for (const type of subscriptions) {
        this.logService.unsubscribe(user.account, type);
      }

      this.wsLogger.info(
        `[WsController] WebSocket disconnected, user: ${user.account}, code: ${code}, reason: ${reason}`
      );
    }
  }
}
