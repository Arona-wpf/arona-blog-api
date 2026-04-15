import {
  PermissionActionEnum,
  PermissionGroupEnum,
  PermissionTypeEnum,
} from '../enums/permission.enum';

// 权限动作类型
export type PermissionActionType =
  (typeof PermissionActionEnum)[keyof typeof PermissionActionEnum];

// 权限组类型
export type PermissionGroupType =
  (typeof PermissionGroupEnum)[keyof typeof PermissionGroupEnum];

// 权限类型
export type PermissionType =
  (typeof PermissionTypeEnum)[keyof typeof PermissionTypeEnum];
