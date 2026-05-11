import { Rule } from '@midwayjs/validate';

import { createStringRuleType } from '.';

export class LoginDto {
  @Rule(
    createStringRuleType('user.account', false, 'user', { min: 3, max: 20 })
  )
  account?: string;

  @Rule(
    createStringRuleType('user.password', false, 'user', { min: 8, max: 30 })
  )
  password?: string;

  @Rule(createStringRuleType('user.email', false, 'user', { max: 100 }))
  email?: string;

  @Rule(createStringRuleType('captcha.cache_id', false, 'captcha', { max: 32 }))
  cache_id?: string;
}
