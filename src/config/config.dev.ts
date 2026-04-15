import { MidwayConfig } from '@midwayjs/core';

import * as BasicConfig from '@/config/config.json';

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
} as MidwayConfig;
