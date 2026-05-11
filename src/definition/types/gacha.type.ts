import {
  GachaItemTypeEnum,
  GachaTaskStatusEnum,
  GameTypeEnum,
} from '../enums/gacha.enum';

// 抽卡类型
export type GameType = (typeof GameTypeEnum)[keyof typeof GameTypeEnum];

// 抽卡物品类型
export type GachaItemType =
  (typeof GachaItemTypeEnum)[keyof typeof GachaItemTypeEnum];

// 祈愿任务状态
export type GachaTaskStatusType =
  (typeof GachaTaskStatusEnum)[keyof typeof GachaTaskStatusEnum];

// 米哈游祈愿配置
export interface MihoyoGachaConfig {
  [GameTypeEnum.GENSHIN_IMPACT]: {
    cn: string;
    global: string;
  };
  [GameTypeEnum.HONKAI_STAR_RAIL]: {
    cn: string;
    global: string;
  };
  [GameTypeEnum.ZENLESS_ZONE_ZERO]: {
    cn: string;
    global: string;
  };
}

export interface IMihoyoGachaLogFetchData {
  retcode: number; // 0表示成功 其他表示失败
  message: string; // 提示信息
  data: {
    page: string;
    size: string;
    list: IMihoyoGachaLogItem[];
    region: string;
    region_time_zone: number;
  };
}

export interface IMihoyoGachaLogItem {
  uid: string; // 游戏uid
  gacha_id: string; // 祈愿ID
  gacha_type: string; // 祈愿类型
  item_id: string; // 物品ID
  count: string; // 物品数量
  time: string; // 祈愿时间
  name: string; // 物品名称
  lang: string; // 语言
  item_type: string; // 物品类型
  rank_type: string; // 物品星级
  id: string; // 记录ID
}
