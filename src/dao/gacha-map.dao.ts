import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { GachaMapEntity } from '@/entity/gacha-map.entity';

import { BaseDao } from './base.dao';

@Provide()
export class GachaMapDao extends BaseDao<GachaMapEntity> {
  @InjectEntityModel(GachaMapEntity)
  gachaMapEntity: ReturnModelType<typeof GachaMapEntity>;

  protected get model(): ReturnModelType<typeof GachaMapEntity> {
    return this.gachaMapEntity;
  }

  constructor() {
    super('GachaMap');
  }

  async findOne(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.gachaMapEntity
        .findOne(queryCondition)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[GachaMapDao] findOne error', error);
      throw error;
    }
  }

  async findById(id: string, select?: string) {
    try {
      return await this.gachaMapEntity.findById(id).select(select).lean();
    } catch (error) {
      this.logger.error('[GachaMapDao] findById error', error);
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
      return await this.gachaMapEntity
        .find(queryCondition)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[GachaMapDao] findMany error', error);
      throw error;
    }
  }
}
