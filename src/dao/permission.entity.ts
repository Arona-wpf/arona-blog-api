import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { PermissionEntity } from '@/entity/permission.entity';

import { BaseDao } from './base.dao';

@Provide()
export class PermissionDao extends BaseDao<PermissionEntity> {
  @InjectEntityModel(PermissionEntity)
  permissionEntity: ReturnModelType<typeof PermissionEntity>;

  protected get model(): ReturnModelType<typeof PermissionEntity> {
    return this.permissionEntity;
  }

  constructor() {
    super('Permission');
  }

  async findOne(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.permissionEntity
        .findOne(queryCondition)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[PermissionDao] findOne error', error);
      throw error;
    }
  }

  async findById(id: string, select?: string) {
    try {
      return await this.permissionEntity.findById(id).select(select).lean();
    } catch (error) {
      this.logger.error('[PermissionDao] findById error', error);
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
      return await this.permissionEntity
        .find(queryCondition)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[PermissionDao] findMany error', error);
      throw error;
    }
  }
}
