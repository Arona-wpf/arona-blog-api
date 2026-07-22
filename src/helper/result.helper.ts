import { Inject, Logger, Provide } from '@midwayjs/core';
import { MidwayI18nService } from '@midwayjs/i18n';
import { Context } from '@midwayjs/koa';
import { ILogger } from '@midwayjs/logger';

import { BusinessError } from '@/class/error/business.error';
import { ValidationError } from '@/class/error/validation.error';

@Provide()
export class ResultHelper {
  @Inject()
  ctx: Context;

  @Inject()
  i18nService: MidwayI18nService;

  @Logger()
  logger: ILogger;

  /**
   * 国际化翻译
   * @param localeCode 国际化代码
   * @param group 国际化分组
   * @param args 文本模板参数
   * @returns
   */
  translate(
    localeCode: string,
    group = 'default',
    args?: Record<string, string>
  ) {
    return this.i18nService.translate(localeCode, {
      args,
      group,
      locale: this.ctx.state.locale,
    });
  }

  /**
   * 使用国际化翻译 业务抛错时返回的错误信息
   * @param err 业务错误信息类型
   * @returns Result
   */
  translateBusinessErrorResult(err: BusinessError) {
    const { statusCode, message, args } = err;
    return {
      code: statusCode,
      msg: this.i18nService.translate(message, {
        args,
        group: 'error',
        locale: this.ctx.state.locale,
      }),
      success: false,
    };
  }

  /**
   * 使用国际化翻译 校验抛错时返回的错误信息
   * @param err 校验错误信息类型
   * @returns Result
   */
  translateValidateErrorResult(err: ValidationError) {
    const { checkResult, message, field, group } = err;

    if (!field) {
      return {
        code: 422,
        msg: '',
        success: false,
      };
    }

    const fieldLabel = this.i18nService.translate(field, {
      group,
      locale: this.ctx.state.locale,
    });
    const checkMessage = checkResult?.map(check => {
      return this.i18nService
        .translate(check.code, {
          group: 'validate',
          locale: this.ctx.state.locale,
        })
        .replaceAll('{{#label}}', '')
        .replace(/{{#(.*?)}}/g, (fullKey: string, key: string) => {
          const value = check.local[key];
          return value !== undefined ? String(value) : fullKey;
        });
    });

    const errorMergeMessage =
      this.i18nService.translate(message, {
        args: {
          parameter: fieldLabel,
        },
        locale: this.ctx.state.locale,
      }) +
      ':' +
      checkMessage;
    this.logger.error(errorMergeMessage);
    return {
      code: 422,
      msg: errorMergeMessage,
      success: false,
    };
  }
}
