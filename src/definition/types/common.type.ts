import { GenderEnum } from '../enums/common.enum';

// 性别类型
export type GenderType = (typeof GenderEnum)[keyof typeof GenderEnum];
