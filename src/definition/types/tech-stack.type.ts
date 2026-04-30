import { TechStackTypeEnum } from '../enums/tech-stack.enum';

// 技术栈类型
export type TechStackType =
  (typeof TechStackTypeEnum)[keyof typeof TechStackTypeEnum];
