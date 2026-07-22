import { modelOptions, prop } from '@typegoose/typegoose';

import {
  PermissionActionType,
  PermissionGroupType,
  PermissionType,
} from '@/definition/types/permission.type';
import { randomId } from '@/utils/common';

@modelOptions({
  schemaOptions: { collection: 'permission' },
})
// 权限表
export class PermissionEntity {
  @prop({ type: String, default: randomId })
  _id?: string;

  @prop({ type: String, unique: true })
  name: string; // 权限名称

  @prop({ type: String, required: true })
  group: PermissionGroupType; // 权限组

  @prop({ type: String, required: true })
  type: PermissionType; // 权限类型

  @prop({ type: String, unique: true })
  code: string; // 权限代码

  @prop({ type: String, required: true })
  action: PermissionActionType; // 权限动作

  @prop({ type: Number, default: Date.now })
  created_at: number; // 创建时间

  @prop({ type: Number, default: Date.now })
  updated_at: number; // 更新时间
}
