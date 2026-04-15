import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { CounterEntity } from '@/entity/counter.entity';

import { BaseDao } from './base.dao';

@Provide()
export class CounterDao extends BaseDao<CounterEntity> {
  @InjectEntityModel(CounterEntity)
  counterEntity: ReturnModelType<typeof CounterEntity>;

  protected get model(): ReturnModelType<typeof CounterEntity> {
    return this.counterEntity;
  }

  constructor() {
    super('Counter');
  }

  async findOne(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.counterEntity
        .findOne(queryCondition)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[CounterDao] findOne error', error);
      throw error;
    }
  }

  async findById(id: string, select?: string) {
    try {
      return await this.counterEntity.findById(id).select(select).lean();
    } catch (error) {
      this.logger.error('[CounterDao] findById error', error);
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
      return await this.counterEntity
        .find(queryCondition)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[CounterDao] findMany error', error);
      throw error;
    }
  }
}
