import { Rule, RuleType } from '@midwayjs/validate';

import { PageDto } from './page.dto';
import {
  createArrayRuleType,
  createNumberRuleType,
  createStringRuleType,
} from '.';

export class CreateRoleDto {
  @Rule(createStringRuleType('role.name', true, 'role', { max: 20 }))
  name: string;

  @Rule(
    createStringRuleType('role.code', true, 'role', {
      max: 50,
      pattern: /^[a-z]+(:[a-z]+)*$/,
    })
  )
  code: string;

  @Rule(
    createArrayRuleType(
      'role.api_permissions',
      false,
      'role',
      RuleType.string()
    )
  )
  api_permissions?: string[];

  @Rule(
    createArrayRuleType(
      'role.menu_permissions',
      false,
      'role',
      RuleType.string()
    )
  )
  menu_permissions?: string[];
}

export class DeleteRoleDto {
  @Rule(createStringRuleType('role._id', true, 'role'))
  _id: string;
}

export class UpdateRoleDto {
  @Rule(createStringRuleType('role._id', true, 'role'))
  _id: string;

  @Rule(
    createArrayRuleType(
      'role.api_permissions',
      false,
      'role',
      RuleType.string()
    )
  )
  api_permissions?: string[];

  @Rule(
    createArrayRuleType(
      'role.menu_permissions',
      false,
      'role',
      RuleType.string()
    )
  )
  menu_permissions?: string[];
}

export class GetRoleListDto extends PageDto {
  @Rule(
    createStringRuleType('role.code', false, 'role', {
      max: 50,
      pattern: /^[a-z]+(:[a-z]+)*$/,
    })
  )
  code?: string;

  @Rule(
    createNumberRuleType('common.start_at', false, 'common', {
      max: new Date().valueOf(),
    })
  )
  start_at?: number;

  @Rule(
    createNumberRuleType('common.end_at', false, 'common', {
      max: new Date().valueOf(),
    })
  )
  end_at?: number;
}
