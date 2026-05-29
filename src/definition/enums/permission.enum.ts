/**
 * 权限动作枚举。
 */
export enum PermissionActionEnum {
  CREATE = 'create',
  DELETE = 'delete',
  UPDATE = 'update',
  VIEW = 'view',
}

/**
 * 权限资源分组枚举。
 */
export enum PermissionGroupEnum {
  USER = 'user',
  ROLE = 'role',
  PERMISSION = 'permission',
  LOG = 'log', // 日志管理权限组
}

/**
 * 权限条目类型枚举。
 */
export enum PermissionTypeEnum {
  API = 'api',
  MENU = 'menu',
}
