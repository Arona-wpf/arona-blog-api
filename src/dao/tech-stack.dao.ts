import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { TechStackEntity } from '@/entity/tech-stack.entity';

import { BaseDao } from './base.dao';

@Provide()
export class TechStackDao extends BaseDao<TechStackEntity> {
  @InjectEntityModel(TechStackEntity)
  techStackEntity: ReturnModelType<typeof TechStackEntity>;

  protected get model(): ReturnModelType<typeof TechStackEntity> {
    return this.techStackEntity;
  }

  constructor() {
    super('TechStack');
  }

  async findOne(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.techStackEntity
        .findOne(queryCondition)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[TechStackDao] findOne error', error);
      throw error;
    }
  }

  async findById(id: string, select?: string) {
    try {
      return await this.techStackEntity.findById(id).select(select).lean();
    } catch (error) {
      this.logger.error('[TechStackDao] findById error', error);
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
      return await this.techStackEntity
        .find(queryCondition)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[TechStackDao] findMany error', error);
      throw error;
    }
  }
}
