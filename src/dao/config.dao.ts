import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { ConfigEntity } from '@/entity/config.entity';

import { BaseDao } from './base.dao';

@Provide()
export class ConfigDao extends BaseDao<ConfigEntity> {
  @InjectEntityModel(ConfigEntity)
  configEntity: ReturnModelType<typeof ConfigEntity>;

  protected get model(): ReturnModelType<typeof ConfigEntity> {
    return this.configEntity;
  }

  constructor() {
    super('Config');
  }

  async findOne(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.configEntity
        .findOne(queryCondition)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[ConfigDao] findOne error', error);
      throw error;
    }
  }

  async findById(id: string, select?: string) {
    try {
      return await this.configEntity.findById(id).select(select).lean();
    } catch (error) {
      this.logger.error('[ConfigDao] findById error', error);
      throw error;
    }
  }

  async findMany(
    queryCondition: Record<string, any>,
    currentPage: number,
    pageSize: number,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.configEntity
        .find(queryCondition)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[ConfigDao] findMany error', error);
      throw error;
    }
  }

  async findAll(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.configEntity
        .find(queryCondition)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[ConfigDao] findAll error', error);
      throw error;
    }
  }
}
