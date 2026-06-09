import { Inject, Provide } from '@midwayjs/core';

import { ConfigDao } from '@/dao/config.dao';
import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
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
   * @param account 创建人account
   * @returns 新建后的配置实体
   */
  async createConfig(data: CreateConfigDto, account: string) {
    const configSeq = await this.counterService.getEntityNextSequence('config');

    const configEntity = new ConfigEntity();
    Object.assign(configEntity, data);
    configEntity.value = data.value ?? '';
    configEntity.description = data.description ?? '';
    configEntity.creator = account;
    configEntity.updator = account;
    configEntity.seq = configSeq;

    return this.configDao.createOne(configEntity);
  }

  /**
   * 根据配置key获取配置
   * @param key 配置key
   * @returns 配置实体
   */
  async getConfigByKey(key: string) {
    const config = await this.configDao.findOne({ key });
    return config;
  }

  /**
   * 获取按 key 首段分组的配置列表
   * @returns 以 key 第一个点号前片段为组名的配置对象
   */
  /**
   * 按 key 设置配置 value
   * @param key 配置 key
   * @param value 配置 value
   * @param account 更新人 account
   */
  async setConfigByKey(key: string, value: string, account: string) {
    const config = await this.configDao.findOne({ key });
    if (!config) {
      throw BUSINESS_ERROR_CONSTANT.CONFIG_NOT_FOUND();
    }

    return this.configDao.findOneAndUpdate(
      { key },
      { value, updator: account }
    );
  }

  async getGroupedConfigList() {
    const configList = await this.configDao.findAll({}, undefined, { seq: 1 });
    const grouped: Record<string, ConfigEntity[]> = {};

    for (const config of configList) {
      const groupKey = config.key.split('.')[0];
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(config);
    }

    return grouped;
  }
}
