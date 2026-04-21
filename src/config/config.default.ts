import { createRedisStore } from '@midwayjs/cache-manager';
import { FORMAT, MidwayAppInfo, MidwayConfig } from '@midwayjs/core';
import { LoggerInfo } from '@midwayjs/logger';
import { tmpdir } from 'os';
import { join } from 'path';

import * as BasicConfig from '@/config/config.json';
import { LocaleEnum, RedisStorageEnum } from '@/definition/enums/common.enum';
import { en_US } from '@/locale/en';
import { zh_CN } from '@/locale/zh';

const config = (appInfo: MidwayAppInfo): MidwayConfig => {
  const pkg = appInfo.pkg;

  const baseDir = appInfo.baseDir;
  const logDir = join(baseDir, 'logs');
  const tmpDir = join(tmpdir(), 'arona-blog');

  return {
    // 缓存管理器
    cacheManager: {
      clients: {
        default: {
          store: createRedisStore('default'),
          options: {
            ttl: 10 * 60, // 10分钟
          },
        },
      },
    },

    // 验证码
    captcha: {
      text: {
        size: 6,
        type: 'number',
      },
      expirationTime: 10 * 60, // 10分钟
      idPrefix: 'arona-blog-captcha-',
    },

    // CDN
    cdn: {
      prefix: {
        file: BasicConfig.cdn.prefix.file,
        media: BasicConfig.cdn.prefix.media,
      },
      allowedOrigins: BasicConfig.cdn.allowedOrigins,
    },

    // 腾讯云COS存储桶
    cos: {
      allowActions: BasicConfig.cos.allowActions,
      bucket: BasicConfig.cos.bucket,
      durationSeconds: BasicConfig.cos.durationSeconds,
      endPoint: BasicConfig.cos.endPoint,
      policyVersion: BasicConfig.cos.policyVersion,
      prefix: {
        root: BasicConfig.cos.prefix.root,
        private: BasicConfig.cos.prefix.private,
        public: BasicConfig.cos.prefix.public,
      },
      region: BasicConfig.cos.region,
      secretId: BasicConfig.cos.secretId,
      secretKey: BasicConfig.cos.secretKey,
    },

    // 国际化
    i18n: {
      defaultLocale: LocaleEnum.ZH_CN,
      localsField: 'i18n',
      localeTable: {
        en_US,
        zh_CN,
      },
      resolver: {
        cookieField: {
          fieldName: 'locale',
          cookieDomain: 'arona-blog.com',
          cookieMaxAge: FORMAT.MS.ONE_YEAR,
        },
      },
      writeCookie: true,
    },

    // koa
    koa: {
      keys: BasicConfig.koa.keys,
      hostname: '0.0.0.0',
      port: 22333,
      proxy: true,
    },

    // 日志
    midwayLogger: {
      default: {
        dir: logDir,
        maxSize: null,
        level: 'info',
        consoleLevel: 'info',
        transports: {
          console: {
            autoColors: true,
            level: 'info',
          },
        },
        format: (info: LoggerInfo) => {
          return `[${info.timestamp}] [${info.LEVEL}] [${pkg.name}] [${info.pid}] ${info.message}`;
        },
      },
      clients: {
        coreLogger: {
          fileLogName: `${pkg.name}-core.log`,
          errorLogName: `${pkg.name}-error.log`,
        },
        appLogger: {
          fileLogName: `${pkg.name}-app.log`,
          errorLogName: `${pkg.name}-error.log`,
        },
      },
    },

    // 数据库
    mongoose: {
      dataSource: {
        'arona-blog': {
          uri: `mongodb://${BasicConfig.mongo.host}:${BasicConfig.mongo.port}/${BasicConfig.mongo.db}`,
          options: {
            user: BasicConfig.mongo.user,
            pass: BasicConfig.mongo.pass,
          },
          // 关联实体
          entities: ['entity'], // 扫描entity目录下的实体
        },
      },
    },

    // redis
    redis: {
      clients: {
        [RedisStorageEnum.SESSION]: {
          host: BasicConfig.redis.host,
          port: BasicConfig.redis.port,
          password: BasicConfig.redis.password,
          db: BasicConfig.redis['session-db'],
        },
        [RedisStorageEnum.CAPTCHA]: {
          host: BasicConfig.redis.host,
          port: BasicConfig.redis.port,
          password: BasicConfig.redis.password,
          db: BasicConfig.redis['captcha-db'],
        },
        [RedisStorageEnum.COS]: {
          host: BasicConfig.redis.host,
          port: BasicConfig.redis.port,
          password: BasicConfig.redis.password,
          db: BasicConfig.redis['cos-db'],
        },
      },
    },

    // session
    session: {
      renew: true,
      key: `${pkg.name}.sid`,
      prefix: `${pkg.name}.sess:`,
      rolling: true,
      maxAge: 12 * 60 * 60 * 1000, // 12小时
    },

    // minio 文件存储
    minio: {
      accessKeyId: BasicConfig.minio.accessKeyId,
      secretAccessKey: BasicConfig.minio.secretAccessKey,
      bucket: BasicConfig.minio.bucket,
      region: BasicConfig.minio.region,
      endpoint: BasicConfig.minio.endpoint,
    },

    // 上传
    upload: {
      mode: 'file', // 默认为file，即上传到服务器临时目录，可以配置为 stream
      fileSize: BasicConfig.upload.fileSize, // 最大上传文件大小，当前为 10mb
      whitelist: BasicConfig.upload.fileTypeLimit, // 文件扩展名白名单
      tmpdir: tmpDir, // 上传的文件临时存储路径
      cleanTimeout: 10 * 60 * 1000, // 上传的文件在临时目录中多久之后自动删除，当前为 10分钟
      base64: false, // 设置原始body是否是base64格式，默认为false
    },

    // 验证
    validate: {
      validationOptions: {
        allowUnknown: true, // validate 允许出现未定义字段
      },
    },
  };
};

export default config;
