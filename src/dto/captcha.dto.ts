import { Rule } from '@midwayjs/validate';

import { CaptchaTypeEnum } from '@/definition/enums/captcha.enum';
import { CaptchaType } from '@/definition/types/captcha.type';

import { createStringRuleType } from '.';

export class GenerateCaptchaDto {
  @Rule(createStringRuleType('captcha.email', true, 'captcha', { email: true }))
  email: string;

  @Rule(
    createStringRuleType('captcha.type', true, 'captcha', {
      enum: Object.values(CaptchaTypeEnum),
    })
  )
  type: CaptchaType;
}

export class VerifyCaptchaDto {
  @Rule(createStringRuleType('captcha.email', true, 'captcha', { email: true }))
  email: string;

  @Rule(
    createStringRuleType('captcha.type', true, 'captcha', {
      enum: Object.values(CaptchaTypeEnum),
    })
  )
  type: CaptchaType;

  @Rule(createStringRuleType('captcha.cache_id', true, 'captcha', { max: 32 }))
  cache_id: string;

  @Rule(createStringRuleType('captcha.captcha', true, 'captcha', { max: 6 }))
  captcha: string;
}
