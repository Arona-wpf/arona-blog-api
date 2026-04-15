import { modelOptions, prop } from '@typegoose/typegoose';

import { randomId } from '@/utils/common';

@modelOptions({
  schemaOptions: { collection: 'counter' },
})
// 计数表
export class CounterEntity {
  @prop({ type: String, default: randomId })
  _id?: string;

  @prop({ type: String, required: true, unique: true })
  entity_name: string; // 实体名称

  @prop({ type: Number, required: true })
  current_seq: number; // 当前序列

  @prop({ type: Number, default: Date.now })
  created_at: number; // 创建时间

  @prop({ type: Number, default: Date.now })
  updated_at: number; // 更新时间
}
