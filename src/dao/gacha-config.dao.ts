import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { GachaConfigEntity } from '@/entity/gacha-config.entity';

import { BaseDao } from './base.dao';

@Provide()
export class GachaConfigDao extends BaseDao<GachaConfigEntity> {
  @InjectEntityModel(GachaConfigEntity)
  gachaConfigEntity: ReturnModelType<typeof GachaConfigEntity>;

  protected get model(): ReturnModelType<typeof GachaConfigEntity> {
    return this.gachaConfigEntity;
  }

  constructor() {
    super('GachaConfig');
  }

  async findOne(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.gachaConfigEntity
        .findOne(queryCondition)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[GachaConfigDao] findOne error', error);
      throw error;
    }
  }

  async findById(id: string, select?: string) {
    try {
      return await this.gachaConfigEntity.findById(id).select(select).lean();
    } catch (error) {
      this.logger.error('[GachaConfigDao] findById error', error);
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
      return await this.gachaConfigEntity
        .find(queryCondition)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[GachaConfigDao] findMany error', error);
      throw error;
    }
  }
}
