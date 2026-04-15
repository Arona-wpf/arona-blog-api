import { RuleType } from '@midwayjs/validate';

import { ValidationError } from '@/class/error/validation.error';

/**
 * 创建字符串规则类型
 * @param field 字段code
 * @param required 是否必填
 * @param group 国际化分组
 * @param options 配置项
 * @returns 字符串规则
 */
export const createStringRuleType = (
  field: string,
  required: boolean,
  group = 'default',
  options?: {
    min?: number; // 最小长度
    max?: number; // 最大长度
    email?: boolean; // 是否校验邮箱格式
    pattern?: RegExp; // 正则校验
    enum?: string[]; // 枚举校验
  }
) => {
  let rule = RuleType.string();
  if (required) {
    rule = rule.required();
  } else {
    rule = rule.allow('').allow(null).optional();
  }

  if (options) {
    if (options.min) {
      rule = rule.min(options.min);
    }
    if (options.max) {
      rule = rule.max(options.max);
    }
    if (options.email) {
      rule = rule.email();
    }
    if (options.pattern) {
      rule = rule.pattern(options.pattern);
    }
    if (options.enum) {
      rule = rule.valid(...options.enum);
    }
  }

  return rule.error(errors => {
    throw new ValidationError(
      'param.validate.failed',
      errors.map(err => ({ code: err.code, local: err.local })),
      field,
      group
    );
  });
};

/**
 * 创建数字规则类型
 * @param field 字段code
 * @param required 是否必填
 * @param group 国际化分组
 * @param options 配置项
 * @returns 数字规则
 */
export const createNumberRuleType = (
  field: string,
  required: boolean,
  group = 'default',
  options?: {
    min?: number; // 最小值
    max?: number; // 最大值
    integer?: boolean; // 是否整数
    enum?: number[]; // 枚举校验
  }
) => {
  let rule = RuleType.number();
  if (required) {
    rule = rule.required();
  } else {
    rule = rule.allow(null).optional();
  }

  if (options) {
    if (options.min) {
      rule = rule.min(options.min);
    }
    if (options.max) {
      rule = rule.max(options.max);
    }
    if (options.integer) {
      rule = rule.integer();
    }
    if (options.enum) {
      rule = rule.valid(...options.enum);
    }
  }

  return rule.error(errors => {
    throw new ValidationError(
      'param.validate.failed',
      errors.map(err => ({ code: err.code, local: err.local })),
      field,
      group
    );
  });
};

/**
 * 创建布尔规则类型
 * @param field 字段code
 * @param required 是否必填
 * @param group 国际化分组
 * @param options 配置项
 * @returns 数字规则
 */
export const createBooleanRuleType = (
  field: string,
  required: boolean,
  group = 'default'
) => {
  let rule = RuleType.boolean();
  if (required) {
    rule = rule.required();
  } else {
    rule = rule.allow(null).optional();
  }

  return rule.error(errors => {
    throw new ValidationError(
      'param.validate.failed',
      errors.map(err => ({ code: err.code, local: err.local })),
      field,
      group
    );
  });
};

/**
 * 创建数组规则类型
 * @param field 字段code
 * @param required 是否必填
 * @param group 国际化分组
 * @param options 配置项
 * @returns 数字规则
 */
export const createArrayRuleType = (
  field: string,
  required: boolean,
  group = 'default',
  itemRuleType: RuleType.Schema,
  options?: {
    min?: number;
    max?: number;
  }
) => {
  let rule = RuleType.array();
  if (required) {
    rule = rule.required().items(itemRuleType);
  } else {
    rule = rule.allow(null).optional();
  }

  if (options) {
    if (options.min) {
      rule = rule.min(options.min);
    }
    if (options.max) {
      rule = rule.max(options.max);
    }
  }

  return rule.error(errors => {
    throw new ValidationError(
      'param.validate.failed',
      errors.map(err => ({ code: err.code, local: err.local })),
      field,
      group
    );
  });
};
