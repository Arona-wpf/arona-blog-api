import { Rule } from '@midwayjs/validate';

import { GenderEnum } from '@/definition/enums/common.enum';
import { GenderType } from '@/definition/types/common.type';

import { createStringRuleType } from '.';

export class RegisterDto {
  @Rule(createStringRuleType('user.account', true, 'user', { min: 3, max: 20 }))
  account: string;

  @Rule(
    createStringRuleType('user.password', true, 'user', { min: 8, max: 30 })
  )
  password: string;

  @Rule(createStringRuleType('user.nickname', true, 'user', { max: 20 }))
  nickname: string;

  @Rule(createStringRuleType('user.birthday', true, 'user'))
  birthday: string;

  @Rule(
    createStringRuleType('user.gender', true, 'user', {
      enum: Object.values(GenderEnum),
    })
  )
  gender: GenderType;

  @Rule(createStringRuleType('user.email', true, 'user', { email: true }))
  email: string;

  @Rule(createStringRuleType('captcha.cache_id', true, 'captcha', { max: 32 }))
  cache_id: string;
}
