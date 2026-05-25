import { index, modelOptions, prop } from '@typegoose/typegoose';

import { GameType } from '@/definition/types/gacha.type';
import { randomId } from '@/utils/common';

@index({ account: 1, game_type: 1, game_uid: 1 }, { background: true })
@modelOptions({
  schemaOptions: { collection: 'gacha_config' },
})
// 祈愿配置表（存储用户的祈愿URL配置）
export class GachaConfigEntity {
  @prop({ type: String, default: randomId })
  _id?: string;

  @prop({ type: String, required: true })
  account: string; // 用户账号

  @prop({ type: String, required: true })
  game_type: GameType; // 游戏类型

  @prop({ type: String, required: true })
  region: string; // 服务器区域

  @prop({ type: String, required: true })
  game_uid: string; // 游戏UID

  @prop({ type: String, required: true })
  game_nickname: string; // 游戏昵称

  @prop({ type: String, default: '' })
  gacha_url: string; // 祈愿URL

  @prop({ type: Number, default: Date.now })
  created_at: number; // 创建时间

  @prop({ type: Number, default: Date.now })
  updated_at: number; // 更新时间
}
