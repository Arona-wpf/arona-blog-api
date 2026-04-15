import { modelOptions, prop } from '@typegoose/typegoose';

import { randomId } from '@/utils/common';

@modelOptions({
  schemaOptions: { collection: 'config' },
})
// 配置表
export class ConfigEntity {
  @prop({ type: String, default: randomId })
  _id?: string;

  @prop({ type: Number })
  seq?: number;

  @prop({ type: String, required: true, unique: true })
  name: string; // 配置名称

  @prop({ type: String, required: true, unique: true })
  key: string; // 配置key

  @prop({ type: String, required: true })
  value: string; // 配置value

  @prop({ type: String, default: '' })
  description: string; // 配置描述

  @prop({ type: String })
  creator: string; // 创建人account

  @prop({ type: String })
  updator: string; // 更新人account

  @prop({ type: Number, default: Date.now })
  created_at: number; // 创建时间

  @prop({ type: Number, default: Date.now })
  updated_at: number; // 更新时间
}
