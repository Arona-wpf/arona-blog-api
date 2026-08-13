import { Inject, Logger, Provide } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';

import { GachaAtlasDao } from '@/dao/gacha-atlas.dao';
import { GACHA_ATLAS_GOLD_RANK_TYPE_MAP } from '@/definition/constants/gacha.constant';
import { GachaItemTypeEnum } from '@/definition/enums/gacha.enum';
import { GachaItemType, GameType } from '@/definition/types/gacha.type';
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
   * 查询所有祈愿物品图鉴
   * @param game_type 游戏类型
   * @returns 祈愿物品图鉴列表
   */
  async getAllGachaAtlas(game_type: GameType) {
    return this.gachaAtlasDao.findAll({ game_type });
  }

  /**
   * 获取指定游戏的 5 星 / S 级角色与武器图鉴列表
   * @param game_type 游戏类型
   */
  async getGachaAtlasGoldList(game_type: GameType) {
    const goldRankTypes = GACHA_ATLAS_GOLD_RANK_TYPE_MAP[game_type] || [];

    return this.gachaAtlasDao.findAll(
      {
        game_type,
        rank_type: { $in: goldRankTypes },
        item_type: {
          $in: [GachaItemTypeEnum.CHARACTER, GachaItemTypeEnum.WEAPON],
        },
      },
      '_id content_id item_id item_name item_type rank_type icon_url',
      { item_name: 1 }
    );
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
   * 查询指定游戏中 item_id 为空字符串的祈愿物品图鉴
   * @param game_type 游戏类型
   * @param item_type 物品类型（可选）
   * @returns 祈愿物品图鉴列表
   */
  async findByEmptyItemId(game_type: GameType, item_type?: GachaItemType) {
    const query: Record<string, any> = {
      game_type,
      item_id: { $in: ['', null] },
    };
    if (item_type) query.item_type = item_type;
    return this.gachaAtlasDao.findAll(query, 'item_name item_id');
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
   * 根据游戏类型和 _id 列表批量查找祈愿物品图鉴
   * @param game_type 游戏类型
   * @param ids _id列表
   * @returns 祈愿物品图鉴列表
   */
  async findByIds(game_type: GameType, ids: string[]) {
    if (ids.length === 0) return [];
    return this.gachaAtlasDao.findMany(
      {
        game_type,
        _id: { $in: ids },
      },
      1,
      ids.length,
      '_id icon_url item_name item_type'
    );
  }

  /**
   * 根据 _id 列表获取完整图鉴数据
   * @param game_type 游戏类型
   * @param ids _id 列表
   */
  async getAtlasItemsByIds(game_type: GameType, ids: string[]) {
    if (ids.length === 0) return [];
    return this.gachaAtlasDao.findMany(
      {
        game_type,
        _id: { $in: ids },
      },
      1,
      ids.length
    );
  }

  /**
   * 根据 _id 列表获取图标映射
   * @param game_type 游戏类型
   * @param ids _id 列表
   */
  async getAtlasIconMapByIds(game_type: GameType, ids: string[]) {
    const items = await this.findByIds(game_type, ids);
    const iconMap: Record<
      string,
      {
        item_id: string;
        icon_url: string;
        item_name: string;
        item_type: string;
      }
    > = {};

    for (const item of items) {
      if (!item._id || !item.icon_url) continue;
      iconMap[item._id] = {
        item_id: item.item_id,
        icon_url: item.icon_url,
        item_name: item.item_name,
        item_type: item.item_type,
      };
    }

    return iconMap;
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
      'item_id icon_url item_name item_type'
    );
  }

  /**
   * 根据 item_id 列表获取图标映射
   * @param game_type 游戏类型
   * @param item_ids item_id 列表
   */
  async getAtlasIconMapByItemIds(game_type: GameType, item_ids: string[]) {
    const items = await this.findByItemIds(game_type, item_ids);
    const iconMap: Record<
      string,
      { icon_url: string; item_name: string; item_type: string }
    > = {};

    for (const item of items) {
      if (!item.item_id || !item.icon_url) continue;
      iconMap[item.item_id] = {
        icon_url: item.icon_url,
        item_name: item.item_name,
        item_type: item.item_type,
      };
    }

    return iconMap;
  }
}
