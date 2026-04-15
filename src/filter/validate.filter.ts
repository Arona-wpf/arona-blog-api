import { Catch } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import { ValidationError } from '@/class/error/validation.error';
import { ResultHelper } from '@/helper/result.helper';

@Catch(ValidationError)
export class ValidateErrorFilter {
  async catch(err: ValidationError, ctx: Context) {
    const resultHelper = await ctx.requestContext.getAsync(ResultHelper);
    const result = resultHelper.translateValidateErrorResult(err);
    ctx.status = 422;
    ctx.body = result;
    return;
  }
}
