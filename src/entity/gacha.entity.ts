import { modelOptions, prop } from '@typegoose/typegoose';

import { randomId } from '@/utils/common';
import { GameType } from '@/definition/types/gacha.type';

@modelOptions({
  schemaOptions: { collection: 'gacha' },
})
// 祈愿表
export class GachaEntity {
  @prop({ type: String, default: randomId })
  _id?: string;

  @prop({ type: String, required: true })
  game_type: GameType; // 游戏类型

  @prop({ type: String, required: true })
  uid: string; // 用户ID

  @prop({ type: String, required: true, unique: true })
  gacha_id: string; // 祈愿ID

  @prop({ type: String, required: true })
  gacha_type: string; // 祈愿类型

  @prop({ type: Date, required: true })
  gacha_time: Date; // 祈愿时间

  @prop({ type: String, required: true })
  item_id: string; // 物品ID

  @prop({ type: String, required: true })
  item_type: string; // 物品类型

  @prop({ type: String, required: true })
  item_name: string; // 物品名称

  @prop({ type: Number, required: true })
  rank_type: number; // 物品星级

  @prop({ type: Number, default: Date.now })
  created_at: number; // 创建时间

  @prop({ type: Number, default: Date.now })
  updated_at: number; // 更新时间
}
