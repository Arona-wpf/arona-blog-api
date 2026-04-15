import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { RoleEntity } from '@/entity/role.entity';

import { BaseDao } from './base.dao';

@Provide()
export class RoleDao extends BaseDao<RoleEntity> {
  @InjectEntityModel(RoleEntity)
  roleEntity: ReturnModelType<typeof RoleEntity>;

  protected get model(): ReturnModelType<typeof RoleEntity> {
    return this.roleEntity;
  }

  constructor() {
    super('Role');
  }

  async findOne(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.roleEntity
        .findOne(queryCondition)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[RoleDao] findOne error', error);
      throw error;
    }
  }

  async findById(id: string, select?: string) {
    try {
      return await this.roleEntity.findById(id).select(select).lean();
    } catch (error) {
      this.logger.error('[RoleDao] findById error', error);
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
      return await this.roleEntity
        .find(queryCondition)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[RoleDao] findMany error', error);
      throw error;
    }
  }
}
