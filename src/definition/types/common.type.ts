import { GenderEnum, LocaleEnum } from '../enums/common.enum';

/**
 * 用户性别类型。
 */
export type GenderType = (typeof GenderEnum)[keyof typeof GenderEnum];

/**
 * 系统语言区域类型。
 */
export type LocaleType = (typeof LocaleEnum)[keyof typeof LocaleEnum];
