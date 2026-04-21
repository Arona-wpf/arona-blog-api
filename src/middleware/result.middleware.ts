import { IMiddleware, Middleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';

import { ResultHelper } from '@/helper/result.helper';

@Middleware()
export class ResultMiddleware implements IMiddleware<Context, NextFunction> {
  static getName(): string {
    return 'result';
  }

  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const resultHelper = await ctx.requestContext.getAsync(ResultHelper);
      const result = await next();

      const { data, group, msg, redirect } = result || {};
      if (redirect) {
        ctx.redirect(redirect);
        return;
      }
      // 如果redirect为空，则返回正常结果
      ctx.status = 200;
      ctx.body = {
        code: 0,
        data,
        msg: resultHelper.translate(msg ?? 'ok', group),
        success: true,
      };
    };
  }
}
