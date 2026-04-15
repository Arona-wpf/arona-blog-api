import { Catch, httpError, Logger, MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { ILogger } from '@midwayjs/logger';

import { ResultHelper } from '@/helper/result.helper';

@Catch(httpError.NotFoundError)
export class NotFoundFilter {
  @Logger()
  logger: ILogger;

  async catch(err: MidwayHttpError, ctx: Context) {
    const resultHelper = await ctx.requestContext.getAsync(ResultHelper);
    this.logger.error(
      '%s\n%s',
      resultHelper.translate('request.path.not.found'),
      err.stack
    );
    ctx.status = 404;
    return {
      code: 404,
      message: resultHelper.translate('path.not.found'),
      success: false,
    };
  }
}
