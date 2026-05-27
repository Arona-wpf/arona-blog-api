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

  /**
   * 查询所有记录（不分页）
   */
  async findAll(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.gachaRecordEntity
        .find(queryCondition)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[GachaRecordDao] findAll error', error);
      throw error;
    }
  }

  /**
   * 按gacha_type分组查询记录
   */
  async findGroupedByGachaType(
    queryCondition: Record<string, any>
  ): Promise<Record<string, GachaRecordEntity[]>> {
    try {
      const records = await this.gachaRecordEntity
        .find(queryCondition)
        .sort({ gacha_time: -1 })
        .lean();

      const grouped: Record<string, GachaRecordEntity[]> = {};
      for (const record of records) {
        const gachaType = record.gacha_type;
        if (!grouped[gachaType]) {
          grouped[gachaType] = [];
        }
        grouped[gachaType].push(record);
      }

      return grouped;
    } catch (error) {
      this.logger.error('[GachaRecordDao] findGroupedByGachaType error', error);
      throw error;
    }
  }
}
