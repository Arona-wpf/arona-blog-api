// 权限动作枚举
export enum PermissionActionEnum {
  CREATE = 'create',
  DELETE = 'delete',
  UPDATE = 'update',
  VIEW = 'view',
}

// 权限组枚举
export enum PermissionGroupEnum {
  USER = 'user',
  ROLE = 'role',
  PERMISSION = 'permission',
}

// 权限类型枚举
export enum PermissionTypeEnum {
  API = 'api',
  MENU = 'menu',
}
