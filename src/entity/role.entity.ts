import { modelOptions, prop } from '@typegoose/typegoose';

import { randomId } from '@/utils/common';

@modelOptions({
  schemaOptions: { collection: 'role' },
})
// 角色表
export class RoleEntity {
  @prop({ type: String, default: randomId })
  _id?: string;

  @prop({ type: String, unique: true })
  name: string; // 角色名称

  @prop({ type: String, unique: true })
  code: string; // 角色代码

  @prop({ type: () => [String], default: () => [] })
  api_permissions: string[]; // 接口权限列表

  @prop({ type: () => [String], default: () => [] })
  menu_permissions: string[]; // 菜单权限列表

  @prop({ type: Number, default: Date.now })
  created_at: number; // 创建时间

  @prop({ type: Number, default: Date.now })
  updated_at: number; // 更新时间
}
