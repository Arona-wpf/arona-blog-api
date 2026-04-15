import { Rule } from '@midwayjs/validate';

import {
  PermissionActionEnum,
  PermissionGroupEnum,
  PermissionTypeEnum,
} from '@/definition/enums/permission.enum';
import {
  PermissionActionType,
  PermissionGroupType,
  PermissionType,
} from '@/definition/types/permission.type';

import { PageDto } from './page.dto';
import { createStringRuleType } from '.';

export class CreatePermissionDto {
  @Rule(
    createStringRuleType('permission.name', true, 'permission', { max: 20 })
  )
  name: string;

  @Rule(
    createStringRuleType('permission.group', true, 'permission', {
      enum: Object.values(PermissionGroupEnum),
    })
  )
  group: PermissionGroupType;

  @Rule(
    createStringRuleType('permission.type', true, 'permission', {
      enum: Object.values(PermissionTypeEnum),
    })
  )
  type: PermissionType;

  @Rule(
    createStringRuleType('permission.code', true, 'permission', {
      max: 50,
      pattern: /^[a-z]+(:[a-z]+)*$/,
    })
  )
  code: string;

  @Rule(
    createStringRuleType('permission.action', true, 'permission', {
      enum: Object.values(PermissionActionEnum),
    })
  )
  action: PermissionActionType;
}

export class DeletePermissionDto {
  @Rule(createStringRuleType('permission._id', true, 'permission'))
  _id: string;
}

export class GetPermissionListDto extends PageDto {
  @Rule(
    createStringRuleType('permission.group', false, 'permission', {
      enum: Object.values(PermissionGroupEnum),
    })
  )
  group: PermissionGroupType;

  @Rule(
    createStringRuleType('permission.type', false, 'permission', {
      enum: Object.values(PermissionTypeEnum),
    })
  )
  type: PermissionType;

  @Rule(
    createStringRuleType('permission.code', false, 'permission', {
      max: 50,
      pattern: /^[a-z]+(:[a-z]+)*$/,
    })
  )
  code: string;

  @Rule(
    createStringRuleType('permission.action', false, 'permission', {
      enum: Object.values(PermissionActionEnum),
    })
  )
  action: PermissionActionType;
}
