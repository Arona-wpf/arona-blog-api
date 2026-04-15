import { Catch, Logger } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { ILogger } from '@midwayjs/logger';

import { ResultHelper } from '@/helper/result.helper';

@Catch()
export class DefaultErrorFilter {
  @Logger()
  logger: ILogger;

  async catch(err: Error, ctx: Context) {
    const resultHelper = await ctx.requestContext.getAsync(ResultHelper);

    this.logger.error(
      '%s\n%s',
      resultHelper.translate('internal.server.error'),
      err.stack
    );
    ctx.status = 500;
    return {
      code: 500,
      message: resultHelper.translate('internal.server.error'),
      success: false,
    };
  }
}
