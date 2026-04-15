import { CaptchaTypeEnum } from '../enums/captcha.enum';

// 验证码类型
export type CaptchaType =
  (typeof CaptchaTypeEnum)[keyof typeof CaptchaTypeEnum];
