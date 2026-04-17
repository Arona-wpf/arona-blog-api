import { IMiddleware, Logger, Middleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { ILogger } from '@midwayjs/logger';

import { LocaleEnum } from '@/definition/enums/common.enum';
import { parseCookiesValue } from '@/utils/common';

@Middleware()
export class LoggerMiddleware implements IMiddleware<Context, NextFunction> {
  @Logger()
  logger: ILogger;

  static getName(): string {
    return 'logger';
  }

  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const start: number = new Date().valueOf();
      const cookies = ctx.request.headers.cookie;
      let locale = parseCookiesValue(cookies, 'locale') ?? LocaleEnum.ZH_CN;
      if (
        ctx.request.query.locale &&
        typeof ctx.request.query.locale === 'string'
      ) {
        locale = ctx.request.query.locale;
      }
      try {
        ctx.state.locale = locale;
        await next();
      } finally {
        const responseTime: number = new Date().valueOf() - start;

        const realIp = (ctx.request.header['EO-Client-IP'] as string) || ctx.ip;
        let realIpCountry = '';
        if (
          realIp.startsWith('127.') ||
          realIp.startsWith('172.') ||
          realIp.startsWith('192.') ||
          realIp.startsWith('10.')
        ) {
          realIpCountry = 'Reserved Address';
        }

        if (ctx.request.header['EO-Client-IPCountry']) {
          realIpCountry = ctx.request.header['EO-Client-IPCountry'] as string;
        }

        this.logger.info(
          `[${ctx.path}] ${ctx.method} ${realIp} ${realIpCountry} ${responseTime}ms`
        );
      }
    };
  }
}
