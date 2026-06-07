import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { GachaAtlasEntity } from '@/entity/gacha-atlas.entity';

import { BaseDao } from './base.dao';

@Provide()
export class GachaAtlasDao extends BaseDao<GachaAtlasEntity> {
  @InjectEntityModel(GachaAtlasEntity)
  gachaAtlasEntity: ReturnModelType<typeof GachaAtlasEntity>;

  protected get model(): ReturnModelType<typeof GachaAtlasEntity> {
    return this.gachaAtlasEntity;
  }

  constructor() {
    super('GachaAtlas');
  }

  async findOne(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.gachaAtlasEntity
        .findOne(queryCondition)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[GachaAtlasDao] findOne error', error);
      throw error;
    }
  }

  async findById(id: string, select?: string) {
    try {
      return await this.gachaAtlasEntity.findById(id).select(select).lean();
    } catch (error) {
      this.logger.error('[GachaAtlasDao] findById error', error);
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
      return await this.gachaAtlasEntity
        .find(queryCondition)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[GachaAtlasDao] findMany error', error);
      throw error;
    }
  }

  async findAll(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.gachaAtlasEntity
        .find(queryCondition)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[GachaAtlasDao] findAll error', error);
      throw error;
    }
  }

  /**
   * 批量写入操作
   */
  async bulkWrite(operations: any[]) {
    try {
      return await this.gachaAtlasEntity.bulkWrite(operations);
    } catch (error) {
      this.logger.error('[GachaAtlasDao] bulkWrite error', error);
      throw error;
    }
  }
}
