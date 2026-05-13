import { index, modelOptions, prop } from '@typegoose/typegoose';

import {
  GameType,
  GachaItemType,
  GenshinImpactGachaItemElementType,
  GenshinImpactGachaItemWeaponType,
  HonkaiStarRailGachaItemCombatType,
  HonkaiStarRailGachaItemPathType,
  ZenlessZoneZeroGachaItemAttributeType,
  ZenlessZoneZeroGachaItemSpecialtyType,
} from '@/definition/types/gacha.type';
import { randomId } from '@/utils/common';

@index({ game_type: 1, content_id: 1 }, { background: true, unique: true })
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

  @prop({ type: Number, required: true })
  content_id: number; // 米游社百科内容ID

  @prop({ type: String, default: '' })
  item_id: string; // 游戏内物品ID（暂时为空，后续同步）

  @prop({ type: String, required: true })
  item_name: string; // 物品名称

  @prop({ type: String, required: true })
  item_type: GachaItemType; // 物品类型

  @prop({ type: String, default: '' })
  rank_type: string; // 物品星级

  @prop({ type: String, default: '' })
  icon_url: string; // 物品图标URL

  @prop({ type: String })
  character_element?: GenshinImpactGachaItemElementType; // 原神 元素类型

  @prop({ type: String })
  weapon_type?: GenshinImpactGachaItemWeaponType; // 原神 武器类型

  @prop({ type: String })
  path?: HonkaiStarRailGachaItemPathType; // 崩坏：星穹铁道 命途类型

  @prop({ type: String })
  combat_type?: HonkaiStarRailGachaItemCombatType; // 崩坏：星穹铁道 属性类型

  @prop({ type: String })
  attribute?: ZenlessZoneZeroGachaItemAttributeType; // 绝区零 属性类型

  @prop({ type: String })
  specialty?: ZenlessZoneZeroGachaItemSpecialtyType; // 绝区零 特性类型

  @prop({ type: Number, default: Date.now })
  created_at: number; // 创建时间

  @prop({ type: Number, default: Date.now })
  updated_at: number; // 更新时间
}
