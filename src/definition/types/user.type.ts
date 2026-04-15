import { PermissionEntity } from '@/entity/permission.entity';

export interface IUserRoleItem {
  _id: string;
  name: string;
  code: string;
  api_permissions: PermissionEntity[];
  menu_permissions: PermissionEntity[];
}

export interface IUserWithRolesAndPermissions {
  _id: string;
  account: string;
  nickname: string;
  birthday: string;
  gender: string;
  email: string;
  roles: IUserRoleItem[];
}
