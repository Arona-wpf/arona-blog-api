import * as axios from '@midwayjs/axios';
import * as bullmq from '@midwayjs/bullmq';
import * as cacheManager from '@midwayjs/cache-manager';
import * as captcha from '@midwayjs/captcha';
import {
  App,
  Configuration,
  IMidwayContainer,
  Inject,
  Logger,
  MidwayDecoratorService,
} from '@midwayjs/core';
import * as info from '@midwayjs/info';
import * as koa from '@midwayjs/koa';
import { ILogger } from '@midwayjs/logger';
import * as redis from '@midwayjs/redis';
import { RedisServiceFactory } from '@midwayjs/redis';
import * as session from '@midwayjs/session';
import * as typegoose from '@midwayjs/typegoose';
import * as validate from '@midwayjs/validate';
import * as ws from '@midwayjs/ws';
import { Framework } from '@midwayjs/ws';
import * as Typegoose from '@typegoose/typegoose';
import type { IncomingMessage } from 'http';
import redisStore from 'koa-redis';
import { join } from 'path';

import * as upload from '@/component/upload.component';
import {
  PERMISSION_KEY,
  registerPermissionMethod,
} from '@/decorator/permission.decorator';
import { RedisStorageEnum } from '@/definition/enums/common.enum';
import { WsUserInfo } from '@/definition/types/websocket.type';
import { BusinessErrorFilter } from '@/filter/business-error.filter';
import { DefaultErrorFilter } from '@/filter/default.filter';
import { NotFoundFilter } from '@/filter/not-found.filter';
import { ValidateErrorFilter } from '@/filter/validate.filter';
import { RouterHelper } from '@/helper/router.helper';
import { IUserSession } from '@/interface';
import { LoggerMiddleware } from '@/middleware/logger.middleware';
import { ResultMiddleware } from '@/middleware/result.middleware';
import { SessionMiddleware } from '@/middleware/session.middleware';
import { parseCookie } from '@/utils/common';

@Configuration({
  imports: [
    koa,
    axios,
    cacheManager,
    captcha,
    redis,
    bullmq,
    typegoose,
    upload,
    validate,
    ws,
    {
      component: info,
      enabledEnvironment: ['local'],
    },
  ],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration {
  @App('koa')
  app: koa.Application;

  @Inject()
  wsFramework: Framework;

  @Inject()
  midwayDecoratorService: MidwayDecoratorService;

  @Inject()
  redisServiceFactory: RedisServiceFactory;

  @Logger('wsLogger')
  wsLogger: ILogger;

  async onConfigLoad() {
    Typegoose.setGlobalOptions({
      schemaOptions: {
        timestamps: {
          createdAt: 'created_at',
          updatedAt: 'updated_at',
          currentTime: () => new Date(),
        },
        versionKey: false,
      },
      options: {
        allowMixed: Typegoose.Severity.ERROR,
      },
    });
  }

  async onReady(container: IMidwayContainer) {
    // 触发自动实例化，执行init
    const redisServiceFactory = await container.getAsync(RedisServiceFactory);
    const redisService = redisServiceFactory.get(RedisStorageEnum.SESSION);
    if (!redisService) {
      throw new Error('redisService is not found');
    }

    const sessionStoreManager = await container.getAsync(
      session.SessionStoreManager
    );
    // 设置redis为sessionStore
    sessionStoreManager.setSessionStore(
      redisStore({
        client: redisService, // redisService继承ioredis
      })
    );
    // 执行路由表初始化
    await container.getAsync(RouterHelper);
    this.app.useMiddleware([
      LoggerMiddleware,
      ResultMiddleware,
      SessionMiddleware,
    ]);
    this.app.useFilter([
      ValidateErrorFilter,
      BusinessErrorFilter,
      NotFoundFilter,
      DefaultErrorFilter,
    ]);
    // 执行权限校验初始化
    this.midwayDecoratorService.registerMethodHandler(
      PERMISSION_KEY,
      options => {
        return registerPermissionMethod(options);
      }
    );

    // WebSocket 升级鉴权（连接建立前）
    this.wsFramework.onWebSocketUpgrade(async request => {
      try {
        const wsRequest = request as IncomingMessage & { wsUser?: WsUserInfo };
        const cookieHeader = wsRequest.headers.cookie;

        if (!cookieHeader) {
          this.wsLogger.warn(
            '[WS Upgrade] Authentication failed: missing cookie'
          );
          return false;
        }

        // 解析 cookie
        const cookies = parseCookie(cookieHeader);
        const sessionId = cookies['arona-blog-api.sid'];
        const localeCookie = cookies['locale'];

        if (!sessionId) {
          this.wsLogger.warn(
            '[WS Upgrade] Authentication failed: missing session ID'
          );
          return false;
        }

        // 从 Redis 获取 session 数据
        const redisService = this.redisServiceFactory.get(
          RedisStorageEnum.SESSION
        );
        if (!redisService) {
          this.wsLogger.error(
            '[WS Upgrade] Redis session service is unavailable'
          );
          return false;
        }

        const sessionData = await redisService.get(sessionId);

        if (!sessionData) {
          this.wsLogger.warn(
            '[WS Upgrade] Authentication failed: session not found or expired'
          );
          return false;
        }

        // 解析 session 数据
        const session: IUserSession = JSON.parse(sessionData);

        if (!session?.user?.account) {
          this.wsLogger.warn(
            '[WS Upgrade] Authentication failed: user is not logged in'
          );
          return false;
        }

        // 将用户信息和 locale 附加到 request 对象上
        wsRequest.wsUser = {
          ...session.user,
          locale: localeCookie || session.locale || 'zh-cn',
        };

        this.wsLogger.info(
          `[WS Upgrade] Authentication succeeded: user ${session.user.account}, locale ${wsRequest.wsUser.locale}`
        );
        return true;
      } catch (error) {
        this.wsLogger.error('[WS Upgrade] Authentication error:', error);
        return false;
      }
    });
  }
}
