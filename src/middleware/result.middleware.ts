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

      // 允许控制器自行写入响应（如 redirect/stream/file download）
      if (ctx.body !== undefined || ctx.status !== 404) {
        return;
      }

      const { data, group, msg } = result || {};
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
