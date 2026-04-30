import { modelOptions, prop } from '@typegoose/typegoose';

import { TechStackTypeEnum } from '@/definition/enums/tech-stack.enum';
import { TechStackType } from '@/definition/types/tech-stack.type';
import { randomId } from '@/utils/common';

@modelOptions({
  schemaOptions: { collection: 'tech_stack' },
})
// 技术栈配置表
export class TechStackEntity {
  @prop({ type: String, default: randomId })
  _id?: string;

  @prop({ type: Number })
  seq?: number;

  @prop({ type: String, required: true, enum: Object.values(TechStackTypeEnum) })
  type: TechStackType; // 技术栈类型：前端/后端

  @prop({ type: String, required: true })
  name: string; // 技术名称

  @prop({ type: String, required: true })
  version: string; // 版本号

  @prop({ type: String, required: true })
  descriptionKey: string; // 国际化描述key

  @prop({ type: String })
  creator: string; // 创建人account

  @prop({ type: String })
  updator: string; // 更新人account

  @prop({ type: Number, default: Date.now })
  created_at: number; // 创建时间

  @prop({ type: Number, default: Date.now })
  updated_at: number; // 更新时间
}
