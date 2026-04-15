import { Inject, Provide } from '@midwayjs/core';

import { CounterDao } from '@/dao/counter.dao';

@Provide()
export class CounterService {
  @Inject()
  counterDao: CounterDao;

  /**
   * 获取某个实体表新增数据时的序列
   * @param entityName 实体表名称
   * @returns 新数据的序列
   */
  async getEntityNextSequence(entityName: string) {
    const query = {
      entity_name: entityName,
    };
    const update = {
      $inc: { current_seq: 1 },
    };

    const result = await this.counterDao.findOneAndUpdate(query, update, true);
    return result.current_seq;
  }

  /**
   * 撤销某个实体表记录的增量更改
   * @param entityName 实体表名称
   * @param offset 撤销的数量
   */
  async undoEntityNextSequence(entityName: string) {
    const query = {
      entity_name: entityName,
    };
    const update = {
      $inc: { current_seq: -1 },
    };

    this.counterDao.findOneAndUpdate(query, update);
  }

  /**
   * 批量获取某个实体表新增数据时的序列号
   * @param entityName 实体表名称
   * @param offset 新增的数量
   * @returns 新数据的开始和结束序列
   */
  async batchGetEntityNextSequence(entityName: string, offset: number) {
    const query = {
      entity_name: entityName,
    };
    const update = {
      $inc: { current_seq: offset },
    };

    const result = await this.counterDao.findOneAndUpdate(query, update);
    return {
      start: result.current_seq - offset + 1,
      end: result.current_seq,
    };
  }

  // async updateEntityCurrentSequence(entityName: string, updateSeq: number) {
  //   const query = {
  //     entity_name: entityName,
  //   };
  //   const update = {
  //     current_seq: updateSeq,
  //   };

  //   this.counterDao.findOneAndUpdate(query, update);
  // }
}
