import { ISession } from '@midwayjs/session';

/**
 * CDN配置
 * @param prefix 前缀
 * @param allowedOrigins 允许的来源域名列表
 */
export interface ICDNConfig {
  prefix: {
    file: string;
    media: string;
  };
  allowedOrigins: string[];
}

/**
 * 邮箱配置
 * @param host 邮箱服务器地址
 * @param port 邮箱服务器端口
 * @param secure 是否使用安全连接
 * @param auth 邮箱认证信息
 * @param user 邮箱用户名
 * @param pass 邮箱密码
 */
export interface IEmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * 用户Session
 * @param locale 国际化
 * @param user 当前登录账号
 * @param tmpId 临时访问ID
 */
export interface IUserSession extends ISession {
  locale: string;
  user?: {
    _id: string;
    account: string;
    nickname: string;
    avatar?: string;
    birthday: string;
    gender: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
  guest?: {
    tmpId: string;
    account?: string;
    email?: string;
  };
}

/**
 * 腾讯云COS存储桶配置
 * @param allowActions 允许的动作
 * @param bucket 存储桶名
 * @param durationSeconds 授权时长
 * @param endPoint 认证地址
 * @param policyVersion 策略版本
 * @param prefix 路径前缀
 * @param region 存储桶地域
 * @param secretId 密钥 ID
 * @param secretKey 密钥 Key
 */
export interface ICosConfig {
  allowActions: string[];
  bucket: string;
  durationSeconds: number;
  endPoint: string;
  policyVersion: string;
  prefix: {
    root: string;
    private: string;
    public: string;
  };
  region: string;
  secretId: string;
  secretKey: string;
}

/**
 * MinIO 配置
 * @param accessKeyId 访问密钥ID
 * @param secretAccessKey 访问密钥
 * @param bucket 存储桶
 * @param region 区域
 * @param endpoint 端点
 */
export interface IMinioConfig {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
  endpoint: string;
  allowedOrigins: string[];
}

/**
 * 国际化配置
 * @param defaultLocale 默认语言
 * @param localsField 本地化字段
 * @param localeTable 语言表
 * @param resolver 解析器
 * @param writeCookie 是否写入cookie
 */
export interface I18nConfig {
  defaultLocale: string;
  localsField: string;
  localeTable: Record<string, any>;
  resolver: {
    cookieField: {
      fieldName: string;
      cookieDomain: string;
      cookieMaxAge: number;
    };
  };
  writeCookie: boolean;
}

/**
 * 米哈游祈愿配置
 */
export interface IMihoyoGachaConfig {
  [key: string]: {
    api_domain: {
      cn: string;
      global: string;
    };
  };
}

/**
 * 米游社API配置
 * @param api_domain API域名
 * @param api_path API路径
 */
export interface ISyncGachaAtlasConfig {
  api_domain: string;
  api_path: {
    genshin_impact: {
      character: string;
      weapon: string;
    };
    honkai_star_rail: {
      all: string;
    };
    zenless_zone_zero: {
      all: string;
    };
  };
}
