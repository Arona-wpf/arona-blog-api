import { Catch } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import { BusinessError } from '@/class/error/business.error';
import { ResultHelper } from '@/helper/result.helper';

@Catch(BusinessError)
export class BusinessErrorFilter {
  async catch(err: BusinessError, ctx: Context) {
    const resultHelper = await ctx.requestContext.getAsync(ResultHelper);
    const result = resultHelper.translateBusinessErrorResult(err);
    ctx.status = 200;
    ctx.body = result;
    return;
  }
}
