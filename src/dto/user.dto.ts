import { Rule, RuleType } from '@midwayjs/validate';

import { GenderEnum } from '@/definition/enums/common.enum';
import { GenderType } from '@/definition/types/common.type';

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

export class UpdateProfileDto {
  @Rule(createStringRuleType('user.nickname', false, 'user', { max: 20 }))
  nickname?: string;

  @Rule(createStringRuleType('user.avatar', false, 'user'))
  avatar?: string;

  @Rule(
    createStringRuleType('user.gender', false, 'user', {
      enum: Object.values(GenderEnum),
    })
  )
  gender?: string;

  @Rule(createStringRuleType('user.birthday', false, 'user'))
  birthday?: string;
}

export class ChangePasswordDto {
  @Rule(createStringRuleType('user.oldPassword', true, 'user'))
  old_password: string;

  @Rule(
    createStringRuleType('user.newPassword', true, 'user', { min: 8, max: 30 })
  )
  new_password: string;

  @Rule(createStringRuleType('user.confirmPassword', true, 'user'))
  confirm_password: string;
}

export class ResetPasswordDto {
  @Rule(createStringRuleType('user.cacheId', true, 'user'))
  cache_id: string;

  @Rule(
    createStringRuleType('user.password', true, 'user', { min: 8, max: 30 })
  )
  password: string;

  @Rule(createStringRuleType('user.confirmPassword', true, 'user'))
  confirm_password: string;
}

export class CreateUserDto {
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

  @Rule(
    createArrayRuleType('user.roles', false, 'user', RuleType.string(), {
      min: 0,
    })
  )
  roles?: string[];
}

export class UpdateUserDto {
  @Rule(createStringRuleType('user._id', true, 'user'))
  _id: string;

  @Rule(createStringRuleType('user.nickname', false, 'user', { max: 20 }))
  nickname?: string;

  @Rule(createStringRuleType('user.email', false, 'user', { email: true }))
  email?: string;

  @Rule(createStringRuleType('user.birthday', false, 'user'))
  birthday?: string;

  @Rule(
    createStringRuleType('user.gender', false, 'user', {
      enum: Object.values(GenderEnum),
    })
  )
  gender?: GenderType;

  @Rule(
    createStringRuleType('user.password', false, 'user', { min: 8, max: 30 })
  )
  password?: string;

  @Rule(
    createArrayRuleType('user.roles', false, 'user', RuleType.string(), {
      min: 0,
    })
  )
  roles?: string[];
}

export class DeleteUserDto {
  @Rule(createStringRuleType('user._id', true, 'user'))
  _id: string;
}
