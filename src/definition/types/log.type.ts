import { LogTypeEnum } from '../enums/log.enum';

/**
 * 日志文件信息
 */
export interface LogFileInfo {
  filename: string; // 文件名
  size: number; // 文件大小（字节）
  modifiedTime: string; // 最后修改时间
  isHistory: boolean; // 是否是历史日志（带日期后缀）
  date?: string; // 日志日期（历史日志才有，格式 YYYY-MM-DD）
}

/**
 * 日志订阅者信息（内部使用）
 */
export interface LogSubscriber {
  account: string; // 用户账号
  type: LogTypeEnum; // 日志类型
  filename: string; // 当前监听的文件名
  lastPosition: number; // 最后读取位置（字节）
}
