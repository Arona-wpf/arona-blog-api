import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { GachaTaskEntity } from '@/entity/gacha-task.entity';

import { BaseDao } from './base.dao';

@Provide()
export class GachaTaskDao extends BaseDao<GachaTaskEntity> {
  @InjectEntityModel(GachaTaskEntity)
  gachaTaskEntity: ReturnModelType<typeof GachaTaskEntity>;

  protected get model(): ReturnModelType<typeof GachaTaskEntity> {
    return this.gachaTaskEntity;
  }

  constructor() {
    super('GachaTask');
  }

  async findOne(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ) {
    try {
      return await this.gachaTaskEntity
        .findOne(queryCondition)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[GachaTaskDao] findOne error', error);
      throw error;
    }
  }

  async findById(id: string, select?: string) {
    try {
      return await this.gachaTaskEntity.findById(id).select(select).lean();
    } catch (error) {
      this.logger.error('[GachaTaskDao] findById error', error);
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
      return await this.gachaTaskEntity
        .find(queryCondition)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .select(select)
        .sort(sort)
        .lean();
    } catch (error) {
      this.logger.error('[GachaTaskDao] findMany error', error);
      throw error;
    }
  }

  /**
   * 根据UID查询最近的任务
   * @param uid 游戏UID
   * @param gameType 游戏类型
   * @param limit 限制数量
   */
  async findByUid(
    uid: string,
    gameType: string,
    limit: number = 10
  ): Promise<GachaTaskEntity[]> {
    try {
      return await this.gachaTaskEntity
        .find({ uid, game_type: gameType })
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      this.logger.error('[GachaTaskDao] findByUid error', error);
      throw error;
    }
  }

  /**
   * 查询待处理的任务列表
   * @param limit 限制数量
   */
  async findPendingTasks(limit: number = 100): Promise<GachaTaskEntity[]> {
    try {
      return await this.gachaTaskEntity
        .find({ status: 'pending' })
        .sort({ created_at: 1 })
        .limit(limit)
        .lean();
    } catch (error) {
      this.logger.error('[GachaTaskDao] findPendingTasks error', error);
      throw error;
    }
  }
}
