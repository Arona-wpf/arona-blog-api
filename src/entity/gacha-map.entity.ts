import { index, modelOptions, prop } from '@typegoose/typegoose';

import { GameType, GachaItemType } from '@/definition/types/gacha.type';
import { randomId } from '@/utils/common';

@index({ game_type: 1, item_id: 1 }, { background: true })
@index({ game_type: 1, item_name: 1 }, { background: true })
@modelOptions({
  schemaOptions: { collection: 'gacha_map' },
})
// 祈愿物品映射表
export class GachaMapEntity {
  @prop({ type: String, default: randomId })
  _id?: string;

  @prop({ type: String, required: true })
  game_type: GameType; // 游戏类型

  @prop({ type: String, required: true })
  item_id: string; // 物品ID

  @prop({ type: String, required: true })
  item_name: string; // 物品名称

  @prop({ type: String, required: true })
  item_type: GachaItemType; // 物品类型

  @prop({ type: String, required: true })
  rank_type: string; // 物品星级

  @prop({ type: Number, default: Date.now })
  created_at: number; // 创建时间

  @prop({ type: Number, default: Date.now })
  updated_at: number; // 更新时间
}
