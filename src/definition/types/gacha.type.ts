import { GameTypeEnum } from '../enums/gacha.enum';

// 抽卡类型
export type GameType = (typeof GameTypeEnum)[keyof typeof GameTypeEnum];

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
