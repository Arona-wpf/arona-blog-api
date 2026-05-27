import { Inject, Logger, Provide } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';

import { GachaAtlasDao } from '@/dao/gacha-atlas.dao';
import { GameType } from '@/definition/types/gacha.type';
import { GetGachaAtlasDTO } from '@/dto/gacha.dto';
import { GachaAtlasEntity } from '@/entity/gacha-atlas.entity';

@Provide()
export class GachaAtlasService {
  @Inject()
  gachaAtlasDao: GachaAtlasDao;

  @Logger()
  logger: ILogger;

  /**
   * 查询祈愿物品图鉴列表
   * @param data 查询参数
   * @returns 祈愿物品图鉴列表
   */
  async getGachaAtlas(data: GetGachaAtlasDTO) {
    const { game_type, current_page, page_size } = data;
    return this.gachaAtlasDao.findMany(
      { game_type: game_type },
      current_page,
      page_size
    );
  }

  /**
   * 查询祈愿物品图鉴数量
   * @param game_type 游戏类型
   * @returns 祈愿物品图鉴数量
   */
  async getGachaAtlasCount(game_type: GameType) {
    return this.gachaAtlasDao.count({ game_type: game_type });
  }

  /**
   * 创建祈愿物品图鉴
   * @param data 祈愿物品图鉴数据
   * @returns 创建的祈愿物品图鉴数据
   */
  async createGachaAtlas(data: GachaAtlasEntity) {
    return this.gachaAtlasDao.createOne(data);
  }

  /**
   * 批量创建祈愿物品图鉴
   * @param data 祈愿物品图鉴数据列表
   * @returns 创建的祈愿物品图鉴数据列表
   */
  async batchCreateGachaAtlas(data: GachaAtlasEntity[]) {
    return this.gachaAtlasDao.createMany(data);
  }

  /**
   * 删除祈愿物品图鉴
   * @param ids 祈愿物品图鉴ID列表
   * @returns 删除结果
   */
  async deleteGachaAtlas(ids: string[]) {
    return this.gachaAtlasDao.deleteMany({ _id: { $in: ids } });
  }

  /**
   * 根据游戏类型和内容ID查找祈愿物品图鉴
   * @param game_type 游戏类型
   * @param content_id 内容ID
   * @returns 祈愿物品图鉴
   */
  async findByContentId(game_type: GameType, content_id: number) {
    return this.gachaAtlasDao.findOne({ game_type, content_id });
  }

  /**
   * 根据游戏类型和内容ID列表批量查找祈愿物品图鉴
   * @param game_type 游戏类型
   * @param content_ids 内容ID列表
   * @returns 祈愿物品图鉴列表
   */
  async findByContentIds(game_type: GameType, content_ids: number[]) {
    return this.gachaAtlasDao.findMany(
      {
        game_type,
        content_id: { $in: content_ids },
      },
      1,
      content_ids.length
    );
  }

  /**
   * 根据游戏类型和内容ID更新祈愿物品图鉴
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
    return this.gachaAtlasDao.findOneAndUpdate(
      { game_type, content_id },
      updateData
    );
  }

  /**
   * 批量根据游戏类型和内容ID更新祈愿物品图鉴
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

    return this.gachaAtlasDao.bulkWrite(bulkOps);
  }

  /**
   * 根据物品名称批量更新item_id
   * @param game_type 游戏类型
   * @param itemUpdates 物品名称和item_id的映射列表
   */
  async batchUpdateItemIdByName(
    game_type: GameType,
    itemUpdates: Array<{ item_name: string; item_id: string }>
  ) {
    if (itemUpdates.length === 0) return;

    const bulkOps = itemUpdates.map(({ item_name, item_id }) => ({
      updateOne: {
        filter: { game_type, item_name },
        update: { $set: { item_id, updated_at: Date.now() } },
      },
    }));

    try {
      const result = await this.gachaAtlasDao.bulkWrite(bulkOps);
      this.logger.info(
        `[GachaAtlasService] Batch updated ${result.modifiedCount || 0} atlas item_ids`
      );
      return result;
    } catch (error) {
      this.logger.error(
        '[GachaAtlasService] batchUpdateItemIdByName error',
        error
      );
    }
  }

  /**
   * 根据游戏类型和item_id列表批量查找祈愿物品图鉴
   * @param game_type 游戏类型
   * @param item_ids item_id列表
   * @returns 祈愿物品图鉴列表
   */
  async findByItemIds(game_type: GameType, item_ids: string[]) {
    if (item_ids.length === 0) return [];
    return this.gachaAtlasDao.findMany(
      {
        game_type,
        item_id: { $in: item_ids },
      },
      1,
      item_ids.length,
      'item_id icon_url item_name'
    );
  }
}
