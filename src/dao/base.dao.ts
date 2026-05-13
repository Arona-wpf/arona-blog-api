import { ILogger, Logger } from '@midwayjs/core';
import { ReturnModelType } from '@typegoose/typegoose';
import { AnyBulkWriteOperation } from 'mongoose';

/**
 * 基础数据访问对象
 * @param T 数据类型
 */
export abstract class BaseDao<T> {
  @Logger()
  logger: ILogger;

  // 模型
  protected abstract get model(): ReturnModelType<new () => T>;
  // 数据表名
  protected daoName: string;

  protected constructor(daoName: string) {
    this.daoName = daoName + 'Dao';
  }

  /**
   * 查询单个数据
   * @param queryCondition 查询条件
   * @param select 查询字段
   * @param sort 排序
   * @returns 查询结果
   */
  abstract findOne(
    queryCondition: Record<string, any>,
    select?: string,
    sort?: Record<string, any>
  ): Promise<T | null>;

  /**
   * 查询单个数据
   * @param id 数据id
   * @param select 查询字段
   * @returns 查询结果
   */
  abstract findById(id: string, select?: string): Promise<T | null>;

  /**
   * 查询多个数据（通过skip分页式查找）
   * @param queryCondition 查询条件
   * @param currentPage 当前页
   * @param pageSize 每页条数
   * @param select 查询字段
   * @param sort 排序
   * @returns 查询结果
   */
  abstract findMany(
    queryCondition: Record<string, any>,
    currentPage: number,
    pageSize: number,
    select?: string,
    sort?: Record<string, any>
  ): Promise<T[]>;

  /**
   * 创建单个数据
   * @param data 数据
   * @returns 创建结果
   */
  async createOne(data: Partial<T>) {
    try {
      return await this.model.create(data);
    } catch (error) {
      this.logger.error(`[${this.daoName}] createOne error`, error);
      throw error;
    }
  }

  /**
   * 创建多个数据
   * @param datas 数据
   * @param ignoreError 无视错误（不会因为中间某条数据错误而导致后面的数据都丢弃）
   * @returns 创建结果
   */
  async createMany(datas: T[], ignoreError = false) {
    try {
      return await this.model.insertMany(datas, { ordered: !ignoreError });
    } catch (error) {
      this.logger.error(`[${this.daoName}] createMany error`, error);
      throw error;
    }
  }

  /**
   * 查询数据条数
   * @param queryCondition 查询条件
   * @returns 数据条数
   */
  async count(queryCondition: Record<string, any>) {
    try {
      return await this.model.countDocuments(queryCondition);
    } catch (error) {
      this.logger.error(`[${this.daoName}] count error`, error);
      throw error;
    }
  }

  /**
   * 更新单个数据
   * @param queryCondition 查询条件
   * @param update 更新数据
   * @returns 更新结果
   */
  async findOneAndUpdate(
    queryCondition: Record<string, any>,
    update: Record<string, any>,
    upsert = false
  ) {
    try {
      return await this.model.findOneAndUpdate(
        queryCondition,
        {
          ...update,
          $set: {
            ...(update.$set || {}),
            updated_at: new Date().valueOf(),
          },
        },
        {
          new: true,
          upsert,
        }
      );
    } catch (error) {
      this.logger.error(`[${this.daoName}] findOneAndUpdate error`, error);
      throw error;
    }
  }

  /**
   * 更新单个数据
   * @param id 数据id
   * @param update 更新数据
   * @returns 更新结果
   */
  async findByIdAndUpdate(id: string, update: Record<string, any>) {
    try {
      return await this.model.findByIdAndUpdate(
        id,
        {
          ...update,
          $set: {
            ...(update.$set || {}),
            updated_at: new Date().valueOf(),
          },
        },
        {
          new: true,
        }
      );
    } catch (error) {
      this.logger.error(`[${this.daoName}] findByIdAndUpdate error`, error);
      throw error;
    }
  }

  /**
   * 删除单个数据
   * @param queryCondition 查询条件
   * @returns 删除结果
   */
  async findOneAndDelete(queryCondition: Record<string, any>) {
    try {
      return await this.model.findOneAndDelete(queryCondition);
    } catch (error) {
      this.logger.error(`[${this.daoName}] findOneAndDelete error`, error);
      throw error;
    }
  }

  /**
   * 删除单个数据
   * @param id 数据id
   * @returns 删除结果
   */
  async findByIdAndDelete(id: string) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      this.logger.error(`[${this.daoName}] findByIdAndDelete error`, error);
      throw error;
    }
  }

  /**
   * 更新多个数据
   * @param queryCondition 查询条件
   * @param update 更新数据
   * @returns 更新结果
   */
  async updateMany(
    queryCondition: Record<string, any>,
    update: Record<string, any>
  ) {
    try {
      return await this.model.updateMany(queryCondition, update);
    } catch (error) {
      this.logger.error(`[${this.daoName}] updateMany error`, error);
      throw error;
    }
  }

  /**
   * 删除单个数据
   * @param queryCondition 查询条件
   * @returns 删除结果
   */
  async deleteOne(queryCondition: Record<string, any>) {
    try {
      return await this.model.deleteOne(queryCondition);
    } catch (error) {
      this.logger.error(`[${this.daoName}] deleteOne error`, error);
      throw error;
    }
  }

  /**
   * 删除多个数据
   * @param queryCondition 查询条件
   * @returns 删除结果
   */
  async deleteMany(queryCondition: Record<string, any>) {
    try {
      return await this.model.deleteMany(queryCondition);
    } catch (error) {
      this.logger.error(`[${this.daoName}] deleteMany error`, error);
      throw error;
    }
  }

  /**
   * 批量写入操作
   * @param operations 批量操作列表
   * @returns 批量写入结果
   */
  async bulkWrite(operations: AnyBulkWriteOperation[]) {
    try {
      if (operations.length === 0) {
        return null;
      }
      return await this.model.bulkWrite(operations);
    } catch (error) {
      this.logger.error(`[${this.daoName}] bulkWrite error`, error);
      throw error;
    }
  }
}
