import { randomInt } from 'crypto';
import { isEmpty } from 'lodash';
import { nanoid } from 'nanoid';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';

/**
 * 检查数据是否为空
 * @param data 数据
 * @returns 是否为空
 */
export function checkEmpty(data: any): boolean {
  return (
    data === null || // 检查 null 和 undefined
    data === undefined ||
    (typeof data === 'string' && data.trim() === '') || // 检查空字符串
    (Array.isArray(data) && isEmpty(data)) || // 检查空数组
    (typeof data === 'object' && isEmpty(data))
  ); // 检查空对象
}

/**
 * 延迟函数
 * @param ms 延迟时间（毫秒）
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 提取错误消息字符串
 * @param error 未知错误对象
 * @returns 错误信息
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * 解析 cookie 字符串
 * @param cookieStr cookie 字符串
 * @returns 解析后的 cookie 对象
 */
export function parseCookie(cookieStr: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieStr) return cookies;

  cookieStr.split(';').forEach(cookie => {
    const parts = cookie.trim().split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookies[key] = value;
    }
  });

  return cookies;
}

/**
 * 从 cookies 中解析指定 key 的值
 * @param cookies cookies
 * @param key 指定 key
 * @returns 指定 key 的值
 */
export function parseCookiesValue(
  cookies: string | undefined,
  key: string
): string | null {
  try {
    if (!cookies || !key) return null;

    const parts = cookies.split(';');
    for (const part of parts) {
      const [rawName, ...rest] = part.split('=');
      const name = rawName?.trim();
      if (name === key) {
        const value = rest.join('=');
        const decoded = decodeURIComponent((value || '').trim());
        // 去除可能的签名前缀 "s:" 或 引号
        const cleaned = decoded.replace(/^s:/, '').replace(/^"|"$/g, '');
        return cleaned;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 生成随机验证码
 * @param size 长度
 * @returns 随机验证码
 */
export function randomCode(size: number): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + size);
}

/**
 * 生成随机密码
 * @param size 长度
 * @returns 随机密码
 */
export function randomPassword(size = 8): string {
  // 确保至少8位（同时也能保证可包含多类字符）
  size = Math.max(8, size);

  // 明确的字符集合：小写 / 大写 / 数字 / 符号
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{};:,.?';
  const all = lower + upper + digits + symbols;

  // 先各取一个，确保“包含大小写”和“字符集合(数字/符号)”
  const passwordChars: string[] = [
    lower.charAt(randomInt(0, lower.length)),
    upper.charAt(randomInt(0, upper.length)),
    digits.charAt(randomInt(0, digits.length)),
    symbols.charAt(randomInt(0, symbols.length)),
  ];

  // 再用安全随机源补足剩余长度
  for (let i = passwordChars.length; i < size; i++) {
    passwordChars.push(all.charAt(randomInt(0, all.length)));
  }

  // Fisher-Yates 洗牌：避免前面固定顺序导致的可预测性
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
}

/**
 * 生成随机字符串ID
 * @returns 随机字符串ID
 */
export function randomId(): string {
  return nanoid();
}

/**
 * 替换URL域名
 * @param url 原始URL
 * @param replace 替换域名（如 https://cdn.arona-blog.com）
 * @returns 新URL
 */
export function replaceUrl(url: string, replace: string) {
  // 移除开头的@符号（如果存在）
  const cleanUrl = url.startsWith('@') ? url.substring(1) : url;

  try {
    // 解析URL
    const urlObj = new URL(cleanUrl);
    const replaceObj = new URL(replace);

    // 替换域名，保持原有的路径、查询参数和哈希
    replaceObj.pathname = urlObj.pathname;
    replaceObj.search = urlObj.search;
    replaceObj.hash = urlObj.hash;

    return replaceObj.toString();
  } catch {
    // URL解析失败，抛出通用业务错误
    throw BUSINESS_ERROR_CONSTANT.URL_REPLACE_FAILED();
  }
}
