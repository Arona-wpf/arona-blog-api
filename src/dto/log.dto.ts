import { Rule } from '@midwayjs/validate';

import { LogTypeEnum } from '@/definition/enums/log.enum';
import { createNumberRuleType, createStringRuleType } from '@/dto/index';

/**
 * 获取日志类型列表
 */
export class GetLogTypeListDto {}

/**
 * 获取日志文件列表
 */
export class GetLogFileListDto {
  @Rule(
    createStringRuleType('log.type', true, 'log', {
      enum: Object.values(LogTypeEnum),
    })
  )
  type: LogTypeEnum;
}

/**
 * 获取日志内容
 */
export class GetLogContentDto {
  @Rule(
    createStringRuleType('log.type', true, 'log', {
      enum: Object.values(LogTypeEnum),
    })
  )
  type: LogTypeEnum;

  @Rule(createStringRuleType('log.filename', true, 'log', { max: 100 }))
  filename: string;

  @Rule(
    createNumberRuleType('log.startLine', false, 'log', {
      min: 0,
      integer: true,
    })
  )
  startLine?: number;

  @Rule(
    createNumberRuleType('log.limit', false, 'log', {
      min: 1,
      max: 10000,
      integer: true,
    })
  )
  limit?: number;
}

/**
 * WebSocket订阅日志
 */
export class SubscribeLogDto {
  @Rule(
    createStringRuleType('log.type', true, 'log', {
      enum: Object.values(LogTypeEnum),
    })
  )
  type: LogTypeEnum;

  @Rule(createStringRuleType('log.filename', true, 'log', { max: 100 }))
  filename: string;
}

/**
 * WebSocket取消订阅日志
 */
export class UnsubscribeLogDto {
  @Rule(
    createStringRuleType('log.type', true, 'log', {
      enum: Object.values(LogTypeEnum),
    })
  )
  type: LogTypeEnum;
}
