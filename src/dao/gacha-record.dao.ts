import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { GachaRecordEntity } from '@/entity/gacha-record.entity';

import { BaseDao } from './base.dao';

@Provide()
export class GachaRecordDao extends BaseDao<GachaRecordEntity> {
  @InjectEntityModel(GachaRecordEntity)
  gachaRecordEntity: ReturnModelType<typeof GachaRecordEntity>;

  protected get model(): ReturnModelType<typeof GachaRecordEntity> {
    return this.gachaRecordEntity;
  }

  constructor() {
    super('GachaRecord');
  }

  async findOne(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.gachaRecordEntity
        .findOne(queryCondition)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[GachaRecordDao] findOne error', error);
      throw error;
    }
  }

  async findById(id: string, select?: string) {
    try {
      return await this.gachaRecordEntity.findById(id).select(select).lean();
    } catch (error) {
      this.logger.error('[GachaRecordDao] findById error', error);
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
      return await this.gachaRecordEntity
        .find(queryCondition)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[GachaRecordDao] findMany error', error);
      throw error;
    }
  }
}
