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
        // 公共api/minio 不进行session校验
        if (
          ctx.path.startsWith('/public-api') ||
          ctx.path.startsWith('/minio')
        ) {
          await next();
          return;
        }
        // 获取 session 对象
        const session = ctx.session as unknown as IUserSession;
        if (!session?.user?.account) {
          if (!session?.guest?.tmpId) {
            this.logger.warn(
              'Session exists but no user or guest info found, initializing guest session. current path: %s',
              ctx.path
            );
            // 如果 session 中没有 user 和 guest 对象，初始化 guest 对象
            session.guest = {
              tmpId: randomId(),
            };
          }
          ctx.status = 401;
          ctx.body = {
            code: 401,
            msg: resultHelper.translate('not.login'),
            success: false,
          };
          return;
        }
        // 如果 session 中有 user 对象，继续处理请求
        await next();
      } catch (error) {
        this.logger.error('SessionMiddleware error: ', error);
        ctx.status = 500;
        ctx.body = {
          code: 500,
          msg: resultHelper.translate('internal.server.error'),
          success: false,
        };
      }
    };
  }
}
