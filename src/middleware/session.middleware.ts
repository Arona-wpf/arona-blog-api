import { IMiddleware, Logger, Middleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { ILogger } from '@midwayjs/logger';

import { ResultHelper } from '@/helper/result.helper';
import { IUserSession } from '@/interface';
import { randomId } from '@/utils/common';

@Middleware()
export class SessionMiddleware implements IMiddleware<Context, NextFunction> {
  @Logger()
  logger: ILogger;

  static getName(): string {
    return 'session';
  }

  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const resultHelper = await ctx.requestContext.getAsync(ResultHelper);
      try {
        // 公共api不进行session校验
        if (ctx.path.startsWith('/public-api')) {
          await next();
          return;
        }

        const session = ctx.session as unknown as IUserSession;
        if (!session?.user?.account) {
          ctx.status = 401;
          ctx.body = {
            code: 401,
            msg: resultHelper.translate('not.login'),
            success: false,
          };
          return;
        }

        await next();
      } finally {
        if (!ctx.session?.user && !ctx.session?.tmpId) {
          ctx.session.tmpId = randomId();
        }
      }
    };
  }
}
