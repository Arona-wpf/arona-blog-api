/**
 * WebSocket 用户信息
 */
export interface WsUserInfo {
  _id: string;
  account: string;
  nickname: string;
  avatar?: string;
  birthday: string;
  gender: string;
  email: string;
  roles: string[];
  permissions: string[];
  locale: string; // 用户当前语言设置
}

/**
 * WebSocket 消息事件类型
 */
export interface WsMessageEvent {
  event: string;
  data: unknown;
}

/**
 * 事件解析结果
 */
export interface EventParseResult {
  module: string;
  action: string;
}

/**
 * Locale 更新数据
 */
export interface LocaleUpdateData {
  locale: string;
}
