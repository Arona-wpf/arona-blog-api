/**
 * config.json 类型定义
 * 用于 Midway.js 项目配置
 */

export interface ConfigJson {
  cdn: {
    prefix: {
      file: string;
      media: string;
    };
    allowedOrigins: string[];
  };
  cos: {
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
  };
  gacha: {
    [key: string]: {
      api_domain: {
        cn: string;
        global: string;
      };
    };
  };
  koa: {
    keys: string[];
  };
  minio: {
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    region: string;
    endpoint: string;
  };
  mongo: {
    user: string;
    'user-dev': string;
    pass: string;
    host: string;
    port: number;
    db: string;
    'db-dev': string;
  };
  redis: {
    host: string;
    port: number;
    password: string;
    'session-db': number;
    'captcha-db': number;
  };
  upload: {
    fileSize: string;
    fileTypeLimit: string[];
  };
}

declare const config: ConfigJson;
export default config;
