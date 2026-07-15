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

  /**
   * HTTP 头部使用 Latin-1 编码传输
   * 当 nginx 设置 UTF-8 编码的中文时，需要重新解码
   */
  private decodeHeader(value: string | undefined): string {
    if (!value) return '';
    return Buffer.from(value, 'latin1').toString('utf8');
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
        let realIpCountry: string;
        let isp = '';

        if (
          realIp.startsWith('127.') ||
          realIp.startsWith('172.') ||
          realIp.startsWith('192.') ||
          realIp.startsWith('10.')
        ) {
          realIpCountry = 'Reserved Address';
        } else {
          const countryName = this.decodeHeader(
            ctx.request.header['x-geo-country'] as string
          );
          const provinceName = this.decodeHeader(
            ctx.request.header['x-geo-province'] as string
          );
          const cityName = this.decodeHeader(
            ctx.request.header['x-geo-city'] as string
          );
          isp = this.decodeHeader(ctx.request.header['x-geo-isp'] as string);

          const locationParts = [countryName, provinceName, cityName].filter(
            Boolean
          );
          realIpCountry =
            locationParts.join(' ') ||
            (ctx.request.header['EO-Client-IPCountry'] as string) ||
            '';
        }

        this.logger.info(
          `[${ctx.path}] ${ctx.method} ${realIp} ${realIpCountry}${isp ? ` [${isp}]` : ''} ${responseTime}ms, full region: ${ctx.request.header['x-geo-region']}`
        );
      }
    };
  }
}
