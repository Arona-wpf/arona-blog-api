import * as axios from '@midwayjs/axios';
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
import * as Typegoose from '@typegoose/typegoose';
import redisStore from 'koa-redis';
import { join } from 'path';

import * as upload from '@/component/upload.component';
import {
  PERMISSION_KEY,
  registerPermissionMethod,
} from '@/decorator/permission.decorator';
import { RedisStorageEnum } from '@/definition/enums/common.enum';
import { BusinessErrorFilter } from '@/filter/business-error.filter';
import { DefaultErrorFilter } from '@/filter/default.filter';
import { NotFoundFilter } from '@/filter/not-found.filter';
import { ValidateErrorFilter } from '@/filter/validate.filter';
import { RouterHelper } from '@/helper/router.helper';
import { LoggerMiddleware } from '@/middleware/logger.middleware';
import { ResultMiddleware } from '@/middleware/result.middleware';
import { SessionMiddleware } from '@/middleware/session.middleware';

@Configuration({
  imports: [
    koa,
    axios,
    cacheManager,
    captcha,
    redis,
    typegoose,
    upload,
    validate,
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
  midwayDecoratorService: MidwayDecoratorService;

  @Logger()
  logger: ILogger;

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
  }
}
