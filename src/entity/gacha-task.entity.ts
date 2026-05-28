import { index, modelOptions, prop } from '@typegoose/typegoose';

import { GachaTaskStatusEnum } from '@/definition/enums/gacha.enum';
import { GachaTaskStatusType } from '@/definition/types/gacha.type';
import { GameType } from '@/definition/types/gacha.type';
import { randomId } from '@/utils/common';

@index({ game_type: 1, uid: 1, created_at: -1 }, { background: true })
@index({ status: 1, created_at: -1 }, { background: true })
@modelOptions({
  schemaOptions: { collection: 'gacha_task' },
})
// 祈愿分析任务表
export class GachaTaskEntity {
  @prop({ type: String, default: randomId })
  _id?: string;

  @prop({ type: String, required: true })
  game_type: GameType; // 游戏类型

  @prop({ type: String, required: true })
  uid: string; // 游戏UID

  @prop({ type: String, required: true })
  gacha_url: string; // 祈愿URL（用于后台执行）

  @prop({ type: String })
  gacha_config_id?: string; // 祈愿配置ID（用于关联配置及异步更新图鉴）

  @prop({
    type: String,
    required: true,
    default: GachaTaskStatusEnum.PENDING,
  })
  status: GachaTaskStatusType; // 任务状态

  @prop({ type: String })
  server_region?: string; // 服务器区域（后台填充）

  @prop({ type: Number })
  total_records?: number; // 新增记录数（结果）

  @prop({ type: String })
  error_message?: string; // 错误信息（失败时）

  @prop({ type: Number, default: Date.now })
  created_at: number; // 创建时间

  @prop({ type: Number, default: Date.now })
  updated_at: number; // 更新时间
}
