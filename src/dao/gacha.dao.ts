import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { GachaEntity } from '@/entity/gacha.entity';

import { BaseDao } from './base.dao';

@Provide()
export class GachaDao extends BaseDao<GachaEntity> {
  @InjectEntityModel(GachaEntity)
  gachaEntity: ReturnModelType<typeof GachaEntity>;

  protected get model(): ReturnModelType<typeof GachaEntity> {
    return this.gachaEntity;
  }

  constructor() {
    super('Gacha');
  }

  async findOne(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.gachaEntity
        .findOne(queryCondition)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[GachaDao] findOne error', error);
      throw error;
    }
  }

  async findById(id: string, select?: string) {
    try {
      return await this.gachaEntity.findById(id).select(select).lean();
    } catch (error) {
      this.logger.error('[GachaDao] findById error', error);
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
      return await this.gachaEntity
        .find(queryCondition)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[GachaDao] findMany error', error);
      throw error;
    }
  }
}
