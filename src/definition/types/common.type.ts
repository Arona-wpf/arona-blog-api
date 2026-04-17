import { GenderEnum, LocaleEnum } from '../enums/common.enum';

// 性别类型
export type GenderType = (typeof GenderEnum)[keyof typeof GenderEnum];

// 国际化类型
export type LocaleType = (typeof LocaleEnum)[keyof typeof LocaleEnum];
