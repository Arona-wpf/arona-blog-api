import { modelOptions, prop } from '@typegoose/typegoose';

import { GenderType } from '@/definition/types/common.type';
import { randomId } from '@/utils/common';

@modelOptions({
  schemaOptions: { collection: 'user' },
})
// 用户表
export class UserEntity {
  @prop({ type: String, default: randomId })
  _id?: string;

  @prop({ type: String, unique: true })
  account: string; // 账号

  @prop({ type: String, required: true })
  password: string; // 密码

  @prop({ type: String, required: true, unique: true })
  salt: string; // 盐

  @prop({ type: String, unique: true })
  nickname: string; // 昵称

  @prop({ type: String, default: '' })
  avatar: string; // 头像

  @prop({ type: String, required: true })
  birthday: string; // 性别

  @prop({ type: String, required: true })
  gender: GenderType; // 性别

  @prop({ type: String, required: true, unique: true })
  email: string; // 邮箱

  @prop({ type: () => [String], default: () => [] })
  roles: string[]; // 角色列表

  @prop({ type: Number, default: Date.now })
  created_at: number; // 创建时间

  @prop({ type: Number, default: Date.now })
  updated_at: number; // 更新时间
}
