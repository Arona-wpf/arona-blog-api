import { Inject, Provide } from '@midwayjs/core';

import { ConfigDao } from '@/dao/config.dao';
import { CreateConfigDto } from '@/dto/config.dto';
import { ConfigEntity } from '@/entity/config.entity';

import { CounterService } from './counter.service';

@Provide()
export class ConfigService {
  @Inject()
  configDao: ConfigDao;

  @Inject()
  counterService: CounterService;

  /**
   * 创建系统配置项
   * @param data 配置创建参数
   * @returns 新建后的配置实体
   */
  async createConfig(data: CreateConfigDto) {
    const configSeq = await this.counterService.getEntityNextSequence('config');

    const configEntity = new ConfigEntity();
    Object.assign(configEntity, data);
    configEntity.seq = configSeq;

    return this.configDao.createOne(configEntity);
  }
}
