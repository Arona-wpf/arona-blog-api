import { PermissionEntity } from '@/entity/permission.entity';

// 用户角色项
export interface IUserRoleItem {
  _id: string;
  name: string;
  code: string;
  api_permissions: PermissionEntity[];
  menu_permissions: PermissionEntity[];
}

// 用户角色和权限
export interface IUserWithRolesAndPermissions {
  _id: string;
  account: string;
  nickname: string;
  birthday: string;
  gender: string;
  email: string;
  roles: IUserRoleItem[];
}
