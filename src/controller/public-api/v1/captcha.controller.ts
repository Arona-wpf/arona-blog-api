import { CaptchaService } from '@midwayjs/captcha';
import {
  Body,
  Config,
  Controller,
  Inject,
  Post,
  Session,
} from '@midwayjs/core';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { RedisStorageEnum } from '@/definition/enums/common.enum';
import { GenerateCaptchaDto, VerifyCaptchaDto } from '@/dto/captcha.dto';
import { RedisHelper } from '@/helper/redis.helper';
import { ResultHelper } from '@/helper/result.helper';
import { I18nConfig, IUserSession } from '@/interface';
import { sendEmailWithTemplate } from '@/utils/email';

@Controller('/public-api/v1/captcha')
export class PubV1CaptchaController {
  @Config('i18n')
  i18nConfig: I18nConfig;

  @Inject()
  captchaService: CaptchaService;

  @Inject()
  redisHelper: RedisHelper;

  @Inject()
  resultHelper: ResultHelper;

  @Post('/generate')
  async generateCaptcha(
    @Body() body: GenerateCaptchaDto,
    @Session() session: IUserSession
  ) {
    // 生成验证码
    const { text } = await this.captchaService.text();
    const cacheId = await this.captchaService.set(text);

    // 设置超时时间（30秒），如果超过30秒，则抛出验证码发送超时错误
    const timeoutPromise = new Promise<boolean>((resolve, reject) => {
      setTimeout(() => {
        reject(BUSINESS_ERROR_CONSTANT.CAPTCHA_SEND_TIMEOUT());
      }, 30 * 1000);
    });

    // 获取国际化语言
    const locale = session.locale ?? this.i18nConfig.defaultLocale;
    const templateLang = locale.startsWith('zh') ? 'zh' : 'en';
    // 获取邮件模板相对路径
    const templateRelativePath = `email/${templateLang}/${body.type}.html`;
    // 发送邮件
    const sendResult = await Promise.race([
      sendEmailWithTemplate(
        body.email,
        this.resultHelper.translate(
          `captcha.email.${body.type}.title`,
          'captcha'
        ),
        templateRelativePath,
        {
          username: body.email.split('@')[0] || body.email,
          expiration: 10,
          code: text,
        }
      ),
      timeoutPromise,
    ]);
    // 如果邮件发送成功，则将验证码缓存到 Redis
    if (sendResult) {
      const redis = await this.redisHelper.getRedisInstance(
        RedisStorageEnum.CAPTCHA
      );

      const cacheKey = `${RedisStorageEnum.CAPTCHA}:${session.tmpId}:${body.type}`;
      const cacheValue = {
        cacheId,
        text,
      };
      redis.setex(cacheKey, 10 * 60, JSON.stringify(cacheValue));
    }
    return {
      data: { cache_id: cacheId, expiration: 10 * 60 },
      group: 'captcha',
      msg: 'captcha.send.success',
    };
  }

  @Post('/verify')
  async verifyCaptcha(
    @Body() body: VerifyCaptchaDto,
    @Session() session: IUserSession
  ) {
    // 获取 Redis 实例
    const redis = await this.redisHelper.getRedisInstance(
      RedisStorageEnum.CAPTCHA
    );
    // 获取缓存键
    const cacheKey = `${RedisStorageEnum.CAPTCHA}:${session.tmpId}:${body.type}`;
    // 获取缓存值
    const cacheValueString = await redis.get(cacheKey);
    // 如果缓存值不存在，则抛出验证码不存在错误
    if (!cacheValueString) {
      throw BUSINESS_ERROR_CONSTANT.CAPTCHA_VERIFY_NOT_FOUND();
    }

    // 解析缓存值
    const { cache_id, text } = JSON.parse(cacheValueString);
    // 如果缓存 ID 不匹配，则抛出验证码不存在错误
    if (cache_id !== body.cache_id) {
      throw BUSINESS_ERROR_CONSTANT.CAPTCHA_VERIFY_NOT_FOUND();
    }
    // 如果验证码不匹配，则抛出验证码错误
    if (text !== body.captcha) {
      throw BUSINESS_ERROR_CONSTANT.CAPTCHA_VERIFY_FAILED();
    }

    // 更新缓存值
    const cacheValue = {
      cache_id,
      text,
      verified: true,
    };
    // 更新缓存值
    redis.set(cacheKey, JSON.stringify(cacheValue), 'KEEPTTL');

    return {
      data: null,
      group: 'captcha',
      msg: 'captcha.verify.success',
    };
  }
}
