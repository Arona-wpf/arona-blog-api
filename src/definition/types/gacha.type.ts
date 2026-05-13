import {
  GachaItemTypeEnum,
  GachaTaskStatusEnum,
  GameTypeEnum,
  GenshinImpactGachaItemElementEnum,
  GenshinImpactGachaItemWeaponTypeEnum,
  HonkaiStarRailGachaItemCombatTypeEnum,
  HonkaiStarRailGachaItemPathEnum,
  ZenlessZoneZeroGachaItemAttributeEnum,
  ZenlessZoneZeroGachaItemSpecialtyEnum,
} from '../enums/gacha.enum';

// 抽卡类型
export type GameType = (typeof GameTypeEnum)[keyof typeof GameTypeEnum];

// 抽卡物品类型
export type GachaItemType =
  (typeof GachaItemTypeEnum)[keyof typeof GachaItemTypeEnum];

// 祈愿任务状态
export type GachaTaskStatusType =
  (typeof GachaTaskStatusEnum)[keyof typeof GachaTaskStatusEnum];

// 原神 元素类型
export type GenshinImpactGachaItemElementType =
  (typeof GenshinImpactGachaItemElementEnum)[keyof typeof GenshinImpactGachaItemElementEnum];

// 原神 武器类型
export type GenshinImpactGachaItemWeaponType =
  (typeof GenshinImpactGachaItemWeaponTypeEnum)[keyof typeof GenshinImpactGachaItemWeaponTypeEnum];

// 崩坏：星穹铁道 属性类型
export type HonkaiStarRailGachaItemCombatType =
  (typeof HonkaiStarRailGachaItemCombatTypeEnum)[keyof typeof HonkaiStarRailGachaItemCombatTypeEnum];

// 崩坏：星穹铁道 命途类型
export type HonkaiStarRailGachaItemPathType =
  (typeof HonkaiStarRailGachaItemPathEnum)[keyof typeof HonkaiStarRailGachaItemPathEnum];

// 绝区零 属性类型
export type ZenlessZoneZeroGachaItemAttributeType =
  (typeof ZenlessZoneZeroGachaItemAttributeEnum)[keyof typeof ZenlessZoneZeroGachaItemAttributeEnum];

// 绝区零 特性类型
export type ZenlessZoneZeroGachaItemSpecialtyType =
  (typeof ZenlessZoneZeroGachaItemSpecialtyEnum)[keyof typeof ZenlessZoneZeroGachaItemSpecialtyEnum];

/**
 * 米游社祈愿记录接口返回数据结构
 */
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

/**
 * 祈愿记录条目
 */
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

/**
 * 米游社百科接口返回数据结构
 */
export interface IMiyousheGenshinImpactWikiResponse {
  retcode: number;
  message: string;
  data: {
    list: IMiyousheGenshinImpactWikiCategory[];
  };
}

/**
 * 米游社百科分类
 */
export interface IMiyousheGenshinImpactWikiCategory {
  id: number;
  name: string;
  list: IMiyousheGenshinImpactWikiItem[];
}

/**
 * 米游社百科物品条目
 */
export interface IMiyousheGenshinImpactWikiItem {
  content_id: number;
  title: string;
  ext: string;
  icon: string;
  summary: string;
}
