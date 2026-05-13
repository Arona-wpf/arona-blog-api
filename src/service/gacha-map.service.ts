import { Inject, Logger, Provide } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';

import { GachaMapDao } from '@/dao/gacha-map.dao';
import { GameType } from '@/definition/types/gacha.type';
import { GetGachaMapDTO } from '@/dto/gacha.dto';
import { GachaMapEntity } from '@/entity/gacha-map.entity';

@Provide()
export class GachaMapService {
  @Inject()
  gachaMapDao: GachaMapDao;

  @Logger()
  logger: ILogger;

  /**
   * 查询祈愿物品映射列表
   * @param data 查询参数
   * @returns 祈愿物品映射列表
   */
  async getGachaMap(data: GetGachaMapDTO) {
    const { game_type, current_page, page_size } = data;
    return this.gachaMapDao.findMany(
      { game_type: game_type },
      current_page,
      page_size
    );
  }

  /**
   * 查询祈愿物品映射数量
   * @param game_type 游戏类型
   * @returns 祈愿物品映射数量
   */
  async getGachaMapCount(game_type: GameType) {
    return this.gachaMapDao.count({ game_type: game_type });
  }

  /**
   * 创建祈愿物品映射
   * @param data 祈愿物品映射数据
   * @returns 创建的祈愿物品映射数据
   */
  async createGachaMap(data: GachaMapEntity) {
    return this.gachaMapDao.createOne(data);
  }

  /**
   * 批量创建祈愿物品映射
   * @param data 祈愿物品映射数据列表
   * @returns 创建的祈愿物品映射数据列表
   */
  async batchCreateGachaMap(data: GachaMapEntity[]) {
    return this.gachaMapDao.createMany(data);
  }

  /**
   * 删除祈愿物品映射
   * @param ids 祈愿物品映射ID列表
   * @returns 删除结果
   */
  async deleteGachaMap(ids: string[]) {
    return this.gachaMapDao.deleteMany({ _id: { $in: ids } });
  }

  /**
   * 根据游戏类型和内容ID查找祈愿物品映射
   * @param game_type 游戏类型
   * @param content_id 内容ID
   * @returns 祈愿物品映射
   */
  async findByContentId(game_type: GameType, content_id: number) {
    return this.gachaMapDao.findOne({ game_type, content_id });
  }

  /**
   * 根据游戏类型和内容ID列表批量查找祈愿物品映射
   * @param game_type 游戏类型
   * @param content_ids 内容ID列表
   * @returns 祈愿物品映射列表
   */
  async findByContentIds(game_type: GameType, content_ids: number[]) {
    return this.gachaMapDao.findManyByCondition({
      game_type,
      content_id: { $in: content_ids },
    });
  }

  /**
   * 根据游戏类型和内容ID更新祈愿物品映射
   * @param game_type 游戏类型
   * @param content_id 内容ID
   * @param updateData 更新数据
   * @returns 更新结果
   */
  async updateByContentId(
    game_type: GameType,
    content_id: number,
    updateData: Record<string, any>
  ) {
    return this.gachaMapDao.findOneAndUpdate(
      { game_type, content_id },
      updateData
    );
  }

  /**
   * 批量根据游戏类型和内容ID更新祈愿物品映射
   * @param game_type 游戏类型
   * @param updates 更新数据列表
   * @returns 更新结果
   */
  async batchUpdateByContentIds(
    game_type: GameType,
    updates: Array<{ content_id: number; updateData: Record<string, any> }>
  ) {
    const bulkOps = updates.map(({ content_id, updateData }) => ({
      updateOne: {
        filter: { game_type, content_id },
        update: { $set: updateData },
      },
    }));

    return this.gachaMapDao.bulkWrite(bulkOps);
  }
}
