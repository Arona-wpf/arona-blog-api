import { GameTypeEnum } from '../enums/gacha.enum';

// 抽卡类型
export type GameType = (typeof GameTypeEnum)[keyof typeof GameTypeEnum];
