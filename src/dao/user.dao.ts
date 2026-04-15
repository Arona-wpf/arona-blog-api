import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { UserEntity } from '@/entity/user.entity';

import { BaseDao } from './base.dao';

@Provide()
export class UserDao extends BaseDao<UserEntity> {
  @InjectEntityModel(UserEntity)
  userEntity: ReturnModelType<typeof UserEntity>;

  protected get model(): ReturnModelType<typeof UserEntity> {
    return this.userEntity;
  }

  constructor() {
    super('User');
  }

  async findOne(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.userEntity
        .findOne(queryCondition)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[UserDao] findOne error', error);
      throw error;
    }
  }

  async findById(id: string, select?: string) {
    try {
      return await this.userEntity.findById(id).select(select).lean();
    } catch (error) {
      this.logger.error('[UserDao] findById error', error);
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
      return await this.userEntity
        .find(queryCondition)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[UserDao] findMany error', error);
      throw error;
    }
  }
}
