import { Rule, RuleType } from '@midwayjs/validate';

import { PageDto } from './page.dto';
import { createArrayRuleType, createStringRuleType } from '.';

export class GetUserListDto extends PageDto {
  @Rule(
    createStringRuleType('user.account', false, 'user', { min: 3, max: 20 })
  )
  account?: string;

  @Rule(createStringRuleType('user.nickname', false, 'user', { max: 20 }))
  nickname?: string;

  @Rule(createStringRuleType('user.email', false, 'user', { email: true }))
  email?: string;

  @Rule(createStringRuleType('role._id', false, 'role'))
  role_id?: string;
}

export class UpdateUserRolesDto {
  @Rule(createStringRuleType('user._id', true, 'user'))
  _id: string;

  @Rule(
    createArrayRuleType('user.roles', true, 'user', RuleType.string(), {
      min: 1,
    })
  )
  roles: string[];
}
