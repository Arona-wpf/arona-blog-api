import { IMiddleware, Logger, Middleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { ILogger } from '@midwayjs/logger';

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
      const locale = parseCookiesValue(cookies, 'locale') ?? 'en_US';
      try {
        ctx.state.locale = locale;
        ctx.session.locale = locale;
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
