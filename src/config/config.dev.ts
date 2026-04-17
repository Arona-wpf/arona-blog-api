import { FORMAT, MidwayConfig } from '@midwayjs/core';

import * as BasicConfig from '@/config/config.json';
import { LocaleEnum } from '@/definition/enums/common.enum';
import { en_US } from '@/locale/en';
import { zh_CN } from '@/locale/zh';

export default {
  // 数据库
  mongoose: {
    dataSource: {
      'arona-blog': {
        uri: `mongodb://${BasicConfig.mongo.host}:${BasicConfig.mongo.port}/${BasicConfig.mongo['db-dev']}`,
        options: {
          user: BasicConfig.mongo['user-dev'],
          pass: BasicConfig.mongo.pass,
        },
        // 关联实体
        entities: ['entity'], // 扫描entity目录下的实体
      },
    },
  },

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
        cookieDomain: 'localhost',
        cookieMaxAge: FORMAT.MS.ONE_YEAR,
      },
    },
    writeCookie: true,
  },
} as MidwayConfig;
