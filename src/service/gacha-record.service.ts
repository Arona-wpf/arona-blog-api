import { Inject, Logger, Provide } from '@midwayjs/core';
import { MidwayI18nService } from '@midwayjs/i18n';
import { ILogger } from '@midwayjs/logger';
import { AxiosInstance, AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { readFile } from 'fs/promises';

import { GachaRecordDao } from '@/dao/gacha-record.dao';
import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import {
  GameTypeI18nKeyMap,
  GenshinImpactGachaTypeI18nKeyMap,
  HonkaiStarRailGachaTypeI18nKeyMap,
  ZenlessZoneZeroGachaTypeI18nKeyMap,
} from '@/definition/constants/gacha.constant';
import { LocaleEnum, RedisStorageEnum } from '@/definition/enums/common.enum';
import {
  GachaItemTypeEnum,
  GameTypeEnum,
  GenshinImpactGachaTypeEnum,
  HonkaiStarRailGachaTypeEnum,
  ZenlessZoneZeroGachaTypeEnum,
} from '@/definition/enums/gacha.enum';
import {
  GameType,
  IMihoyoGachaLogFetchData,
} from '@/definition/types/gacha.type';
import { GachaRecordEntity } from '@/entity/gacha-record.entity';
import { AxiosHelper } from '@/helper/axios.helper';
import { RedisHelper } from '@/helper/redis.helper';
import { GachaAtlasService } from '@/service/gacha-atlas.service';
import { GachaConfigService } from '@/service/gacha-config.service';
import { MinioService } from '@/service/minio.service';
import { delay } from '@/utils/common';

const GACHA_LOCK_PREFIX = 'gacha:lock';
const GACHA_LOCK_TTL = 300; // 5 minutes

export interface GachaSyncProgressPayload {
  type: 'fetch_page' | 'pool_completed';
  gachaTypeLabel: { zh: string; en: string };
  page?: number;
  totalNewRecords?: number;
}

@Provide()
export class GachaRecordService {
  @Inject()
  gachaRecordDao: GachaRecordDao;

  @Inject()
  gachaConfigService: GachaConfigService;

  @Inject()
  gachaAtlasService: GachaAtlasService;

  @Inject()
  axiosHelper: AxiosHelper;

  @Inject()
  redisHelper: RedisHelper;

  @Inject()
  i18nService: MidwayI18nService;

  @Inject()
  minioService: MinioService;

  @Logger()
  logger: ILogger;

  /**
   * 修补米哈游祈愿URL
   * @param url 米哈游祈愿URL
   * @returns 修补后的米哈游祈愿URL
   */
  verifyAndFixMihoyoGachaUrl(url: string) {
    const authkeyMatch = url.match(/authkey=([^&]+)/);
    if (
      authkeyMatch &&
      authkeyMatch.length > 1 &&
      !authkeyMatch[1].includes('%')
    ) {
      url = url.replace(
        /authkey=([^&]+)/,
        `authkey=${encodeURIComponent(authkeyMatch[1])}`
      );
    }
    return url;
  }

  /**
   * 生成锁的 key
   * @param gameType 游戏类型
   * @param serverRegion 服务器区域
   * @param uid 游戏uid
   * @param gachaType 祈愿类型
   * @returns 锁的 key
   */
  private generateLockKey(
    gameType: string,
    serverRegion: string,
    uid: string,
    gachaType: string
  ): string {
    return `${GACHA_LOCK_PREFIX}:${gameType}:${serverRegion}:${uid}:${gachaType}`;
  }

  /**
   * 尝试获取锁
   * @param lockKey 锁的 key
   * @returns 是否成功获取锁
   */
  private async acquireLock(lockKey: string): Promise<boolean> {
    const redis = await this.redisHelper.getRedisInstance(
      RedisStorageEnum.SCRIPT
    );
    const result = await redis.setex(lockKey, GACHA_LOCK_TTL, '1');
    return result === 'OK';
  }

  /**
   * 释放锁
   * @param lockKey 锁的 key
   */
  private async releaseLock(lockKey: string): Promise<void> {
    const redis = await this.redisHelper.getRedisInstance(
      RedisStorageEnum.SCRIPT
    );
    await redis.del(lockKey);
  }

  /**
   * 获取祈愿类型的显示标签（中英文）
   * @param gachaType 祈愿类型枚举值
   * @param gameType 游戏类型
   * @returns 祈愿类型标签（中英文）
   */
  private getGachaTypeLabel(
    gachaType: string,
    gameType: GameType
  ): { zh: string; en: string } {
    let i18nKeyMap: Record<string, string>;
    switch (gameType) {
      case GameTypeEnum.GENSHIN_IMPACT:
        i18nKeyMap = GenshinImpactGachaTypeI18nKeyMap;
        break;
      case GameTypeEnum.HONKAI_STAR_RAIL:
        i18nKeyMap = HonkaiStarRailGachaTypeI18nKeyMap;
        break;
      case GameTypeEnum.ZENLESS_ZONE_ZERO:
        i18nKeyMap = ZenlessZoneZeroGachaTypeI18nKeyMap;
        break;
      default:
        return { zh: gachaType, en: gachaType };
    }

    const i18nKey = i18nKeyMap[gachaType];
    if (!i18nKey) {
      return { zh: gachaType, en: gachaType };
    }
    return {
      zh: this.i18nService.translate(i18nKey, {
        group: 'gacha',
        locale: 'zh-cn',
      }),
      en: this.i18nService.translate(i18nKey, {
        group: 'gacha',
        locale: 'en-us',
      }),
    };
  }

  /**
   * 获取游戏类型的显示标签（中英文）
   * @param gameType 游戏类型枚举值
   * @returns 游戏类型标签（中英文）
   */
  getGameTypeLabel(gameType: string): { zh: string; en: string } {
    const i18nKey = GameTypeI18nKeyMap[gameType];
    if (!i18nKey) {
      return { zh: gameType, en: gameType };
    }
    return {
      zh: this.i18nService.translate(i18nKey, {
        group: 'gacha',
        locale: 'zh-cn',
      }),
      en: this.i18nService.translate(i18nKey, {
        group: 'gacha',
        locale: 'en-us',
      }),
    };
  }

  /**
   * 获取游戏的祈愿类型列表
   * @param gameType 游戏类型
   * @returns 祈愿类型列表
   */
  private getGachaTypeList(gameType: GameType): string[] {
    switch (gameType) {
      case GameTypeEnum.GENSHIN_IMPACT:
        return Object.values(GenshinImpactGachaTypeEnum);
      case GameTypeEnum.HONKAI_STAR_RAIL:
        return Object.values(HonkaiStarRailGachaTypeEnum);
      case GameTypeEnum.ZENLESS_ZONE_ZERO:
        return Object.values(ZenlessZoneZeroGachaTypeEnum);
      default:
        throw BUSINESS_ERROR_CONSTANT.GACHA_GAME_TYPE_NOT_SUPPORTED;
    }
  }

  /**
   * 获取祈愿数据API路径
   * @param gameType 游戏类型
   * @returns API路径
   */
  private getGachaApiPath(gameType: GameType): string {
    switch (gameType) {
      case GameTypeEnum.GENSHIN_IMPACT:
        return '/gacha_info/api/getGachaLog';
      case GameTypeEnum.HONKAI_STAR_RAIL:
        return '/common/gacha_record/api/getGachaLog';
      case GameTypeEnum.ZENLESS_ZONE_ZERO:
        return '/common/gacha_record/api/getGachaLog';
      default:
        throw BUSINESS_ERROR_CONSTANT.GACHA_GAME_TYPE_NOT_SUPPORTED;
    }
  }

  /**
   * 同步祈愿数据并收集item数据（用于任务执行后异步更新图鉴）
   * @param uid 游戏uid
   * @param gameType 游戏类型
   * @param axiosInstance 请求实例
   * @param searchParams 查询参数
   * @param serverRegion 服务器区域
   */
  async syncGachaDataWithItems(
    uid: string,
    gameType: GameType,
    axiosInstance: AxiosInstance,
    searchParams: URLSearchParams,
    serverRegion: string,
    onProgress?: (payload: GachaSyncProgressPayload) => void
  ): Promise<{
    totalRecords: number;
    syncedItems: Array<{ name: string; item_id: string }>;
  }> {
    const gameTypeLabel = this.getGameTypeLabel(gameType);
    const gachaTypeList = this.getGachaTypeList(gameType);
    const apiPath = this.getGachaApiPath(gameType);

    this.logger.info(
      `[GachaRecordService] Starting gacha sync with items for uid: ${uid}, gameType: ${gameTypeLabel.en}/${gameTypeLabel.zh}, serverRegion: ${serverRegion}`
    );

    let totalNewRecords = 0;
    const syncedItems: Array<{ name: string; item_id: string }> = [];

    for (const gachaType of gachaTypeList) {
      const gachaTypeLabel = this.getGachaTypeLabel(gachaType, gameType);
      const lockKey = this.generateLockKey(
        gameType,
        serverRegion,
        uid,
        gachaType
      );

      const lockAcquired = await this.acquireLock(lockKey);
      if (!lockAcquired) {
        this.logger.warn(
          `[GachaRecordService] Lock acquisition failed for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, skipping (may be in progress)`
        );
        continue;
      }

      this.logger.info(
        `[GachaRecordService] Acquired lock for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}`
      );

      try {
        const result = await this.syncGachaDataByTypeWithItems(
          uid,
          gameType,
          axiosInstance,
          searchParams,
          serverRegion,
          gachaType,
          apiPath,
          onProgress
        );
        totalNewRecords += result.totalNewRecords;
        syncedItems.push(...result.syncedItems);
      } finally {
        await this.releaseLock(lockKey);
        this.logger.info(
          `[GachaRecordService] Released lock for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}`
        );
      }
    }

    this.logger.info(
      `[GachaRecordService] Completed gacha sync with items for uid: ${uid}, gameType: ${gameTypeLabel.en}/${gameTypeLabel.zh}, total new records: ${totalNewRecords}, synced items: ${syncedItems.length}`
    );

    return { totalRecords: totalNewRecords, syncedItems };
  }

  /**
   * 同步单个祈愿类型的数据并收集item信息
   * @param uid 游戏uid
   * @param gameType 游戏类型
   * @param axiosInstance 请求实例
   * @param searchParams 查询参数
   * @param serverRegion 服务器区域
   * @param gachaType 祈愿类型
   * @param apiPath API路径
   */
  private async syncGachaDataByTypeWithItems(
    uid: string,
    gameType: GameType,
    axiosInstance: AxiosInstance,
    searchParams: URLSearchParams,
    serverRegion: string,
    gachaType: string,
    apiPath: string,
    onProgress?: (payload: GachaSyncProgressPayload) => void
  ): Promise<{
    totalNewRecords: number;
    syncedItems: Array<{ name: string; item_id: string }>;
  }> {
    const gachaTypeLabel = this.getGachaTypeLabel(gachaType, gameType);

    this.logger.info(
      `[GachaRecordService] Fetching recent gacha records for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}`
    );
    const recentGachaRecords = await this.gachaRecordDao.findMany(
      {
        game_type: gameType,
        server_region: serverRegion,
        uid,
        gacha_type: gachaType,
      },
      1,
      100,
      'gacha_id',
      { gacha_time: -1 }
    );
    const recentGachaIds = recentGachaRecords.map(record => record.gacha_id);
    this.logger.info(
      `[GachaRecordService] Found ${recentGachaRecords.length} recent records for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}`
    );

    let page = 1;
    const size = 20;
    let fetchMore = true;
    let retryCount = 0;
    let totalNewRecords = 0;
    const syncedItems: Array<{ name: string; item_id: string }> = [];

    const currentSearchParams = new URLSearchParams(searchParams);
    if (gameType === GameTypeEnum.ZENLESS_ZONE_ZERO) {
      currentSearchParams.set('real_gacha_type', gachaType);
    } else {
      currentSearchParams.set('gacha_type', gachaType);
    }

    currentSearchParams.set('end_id', '0');
    currentSearchParams.set('page', page.toString());
    currentSearchParams.set('size', size.toString());

    while (fetchMore) {
      onProgress?.({
        type: 'fetch_page',
        gachaTypeLabel,
        page,
      });

      if (retryCount) {
        if (retryCount >= 3) {
          this.logger.error(
            `[GachaRecordService] Max retries reached for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, aborting`
          );
          break;
        }
        this.logger.warn(
          `[GachaRecordService] Retrying fetch for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, attempt ${retryCount}`
        );
      }

      let response: AxiosResponse<IMihoyoGachaLogFetchData>;
      try {
        // console.log(`${apiPath}?${currentSearchParams.toString()}`);
        response = await axiosInstance.get(
          `${apiPath}?${currentSearchParams.toString()}`
        );
      } catch (error) {
        this.logger.error(
          `[GachaRecordService] Request failed for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, page: ${page}, error: ${error.message}`
        );
        retryCount++;
        continue;
      }

      const { retcode, message, data } = response.data;
      if (retcode === 0 && message === 'OK') {
        if (data.list.length === 0) {
          fetchMore = false;
          continue;
        }

        currentSearchParams.set('end_id', data.list[data.list.length - 1].id);

        const uniqueGachaList = data.list.filter(
          item => !recentGachaIds.includes(item.id)
        );

        if (uniqueGachaList.length > 0) {
          this.logger.info(
            `[GachaRecordService] Found ${uniqueGachaList.length} new records for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, page: ${page}`
          );

          const newGachaList: GachaRecordEntity[] = [];
          uniqueGachaList.forEach(r => {
            const newGachaRecordEntity = new GachaRecordEntity();
            Object.assign(newGachaRecordEntity, {
              game_type: gameType,
              server_region: serverRegion,
              region_time_zone: data.region_time_zone,
              uid,
              gacha_id: r.id,
              gacha_type: gachaType,
              gacha_time: new Date(r.time),
              item_id: r.item_id,
              item_type: this.resolveItemType(gameType, r.item_id),
              item_name: r.name,
              rank_type: this.resolveRankType(gameType, r.rank_type),
            });
            newGachaList.push(newGachaRecordEntity);

            syncedItems.push({ name: r.name, item_id: r.item_id });
          });

          this.logger.info(
            `[GachaRecordService] Writing ${newGachaList.length} records to database for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}`
          );
          await this.gachaRecordDao.createMany(newGachaList);
          totalNewRecords += newGachaList.length;

          // 更新分页参数
          page++;
          currentSearchParams.set('page', page.toString());
        } else {
          this.logger.info(
            `[GachaRecordService] No new records found for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, page: ${page}`
          );
          fetchMore = false;
        }
      } else {
        this.logger.error(
          `[GachaRecordService] API returned error for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, retcode: ${retcode}, message: ${message}`
        );
        fetchMore = false;
      }

      // 等待1秒后继续获取下一页数据，防止请求过于频繁被封禁
      await delay(1000);
    }

    this.logger.info(
      `[GachaRecordService] Completed gacha sync with items for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, new records: ${totalNewRecords}, items: ${syncedItems.length}`
    );

    onProgress?.({
      type: 'pool_completed',
      gachaTypeLabel,
      totalNewRecords,
    });

    return { totalNewRecords, syncedItems };
  }

  /**
   * 获取Axios实例
   * @param gameType 游戏类型
   * @param host URL host
   * @returns Axios实例
   */
  async getAxiosInstance(
    gameType: GameType,
    host: string
  ): Promise<AxiosInstance> {
    const isGlobalServer =
      host.includes('webstatic-sea') ||
      host.includes('api-os-takumi') ||
      host.includes('hoyoverse.com');

    this.logger.info(
      `[GachaRecordService] Server type: ${isGlobalServer ? 'global' : 'cn'}`
    );

    return await this.axiosHelper.getAxiosInstance(
      gameType + (isGlobalServer ? '_global' : '')
    );
  }

  /**
   * 解析并导入JSON祈愿记录文件
   * @param filePath JSON文件路径
   * @param gachaConfigId 祈愿配置ID
   * @param gameType 游戏类型
   * @param account 用户账号
   * @returns 导入结果
   */
  async parseAndImportGachaJson(
    filePath: string,
    gachaConfigId: string,
    gameType: GameType
  ): Promise<{ total: number; imported: number }> {
    const config =
      await this.gachaConfigService.getGachaConfigById(gachaConfigId);

    const fileContent = await readFile(filePath, 'utf-8');
    const jsonData: Record<string, any> = JSON.parse(fileContent);

    const gameKeyMap: Record<GameType, string> = {
      [GameTypeEnum.GENSHIN_IMPACT]: 'hk4e',
      [GameTypeEnum.HONKAI_STAR_RAIL]: 'hkrpg',
      [GameTypeEnum.ZENLESS_ZONE_ZERO]: 'nap',
    };

    const gameKey = gameKeyMap[gameType];
    const gameDataList = jsonData[gameKey];
    if (!gameDataList || !Array.isArray(gameDataList)) {
      this.logger.warn(
        `[GachaRecordService] No data found for game key: ${gameKey}`
      );
      return { total: 0, imported: 0 };
    }

    // 收集 JSON 中所有的 gacha_id（对应 item.id 字段）
    const allGachaIds: string[] = [];
    for (const gameData of gameDataList) {
      if (!gameData.list || !Array.isArray(gameData.list)) continue;
      for (const item of gameData.list) {
        allGachaIds.push(item.id);
      }
    }

    if (allGachaIds.length === 0) {
      return { total: 0, imported: 0 };
    }

    // 查询数据库中已存在的 gacha_id
    const existingIds = new Set<string>();
    const batchSize = 1000;
    const totalItems = allGachaIds.length;

    for (let offset = 0; offset < totalItems; offset += batchSize) {
      const batchIds = allGachaIds.slice(offset, offset + batchSize);
      const existingRecords = await this.gachaRecordDao.findMany(
        {
          game_type: gameType,
          server_region: config.region,
          uid: config.game_uid,
          gacha_id: { $in: batchIds },
        },
        1,
        batchIds.length,
        'gacha_id'
      );
      for (const record of existingRecords) {
        existingIds.add(record.gacha_id);
      }
    }

    // 过滤掉已存在的记录，只导入新的
    let totalImported = 0;
    let dataLang = '';

    for (const gameData of gameDataList) {
      const { uid, timezone, lang, list } = gameData;
      dataLang = lang;
      if (!list || !Array.isArray(list)) continue;

      if (String(uid) !== String(config.game_uid)) {
        throw BUSINESS_ERROR_CONSTANT.GACHA_IMPORT_UID_MISMATCH();
      }

      const newItems = list.filter(item => !existingIds.has(item.id));
      if (newItems.length === 0) continue;

      const entities = newItems.map(item => {
        const entity = new GachaRecordEntity();
        Object.assign(entity, {
          game_type: gameType,
          server_region: config.region,
          region_time_zone: timezone,
          uid: config.game_uid,
          gacha_id: item.id,
          gacha_type: item.gacha_type,
          gacha_time: new Date(item.time).valueOf(),
          item_id: item.item_id,
          item_type: this.resolveItemType(gameType, item.item_id),
          item_name: item.name,
          rank_type: this.resolveRankType(gameType, item.rank_type),
        });
        return entity;
      });

      if (entities.length > 0) {
        await this.gachaRecordDao.createMany(entities);
        totalImported += entities.length;
      }
    }

    this.logger.info(
      `[GachaRecordService] Imported ${totalImported} gacha records from JSON file for config ${gachaConfigId}`
    );

    if (dataLang === 'zh-cn') {
      // 异步更新图鉴中的item_id（不阻塞主流程）
      this.asyncUpdateAtlasItemId(gameType, gameDataList);
    }

    return { total: allGachaIds.length, imported: totalImported };
  }

  /**
   * 异步更新图鉴中的item_id
   * @param gameType 游戏类型
   * @param gameDataList 游戏数据列表
   */
  private asyncUpdateAtlasItemId(
    gameType: GameType,
    gameDataList: Array<{ list?: Array<{ name: string; item_id: string }> }>
  ) {
    // 汇总所有item_name和item_id的映射
    const itemUpdates: Array<{ item_name: string; item_id: string }> = [];
    const seenNames = new Set<string>();

    for (const gameData of gameDataList) {
      if (!gameData.list || !Array.isArray(gameData.list)) continue;
      for (const item of gameData.list) {
        if (!seenNames.has(item.name) && item.item_id) {
          seenNames.add(item.name);
          itemUpdates.push({
            item_name: item.name,
            item_id: item.item_id,
          });
        }
      }
    }

    if (itemUpdates.length === 0) return;

    // 异步执行更新，不阻塞主流程
    this.gachaAtlasService
      .batchUpdateItemIdByName(gameType, itemUpdates)
      .catch(error => {
        this.logger.error(
          '[GachaRecordService] asyncUpdateAtlasItemId error',
          error
        );
      });
  }

  /**
   * 从同步任务收集的item数据异步更新图鉴中的item_id
   * @param gameType 游戏类型
   * @param syncedItems 同步收集的item数据
   */
  asyncUpdateAtlasItemIdFromSync(
    gameType: GameType,
    syncedItems: Array<{ name: string; item_id: string }>
  ) {
    if (syncedItems.length === 0) return;

    const itemUpdates: Array<{ item_name: string; item_id: string }> =
      Array.from(
        new Map(
          syncedItems.map(item => [
            item.name,
            { item_name: item.name, item_id: item.item_id },
          ])
        ).values()
      );

    this.gachaAtlasService
      .batchUpdateItemIdByName(gameType, itemUpdates)
      .catch(error => {
        this.logger.error(
          '[GachaRecordService] asyncUpdateAtlasItemIdFromSync error',
          error
        );
      });
  }

  /**
   * 根据 item_id 长度和前缀判断物品类型
   */
  private resolveItemType(gameType: GameType, itemId: string): string {
    const len = itemId.length;
    switch (gameType) {
      case GameTypeEnum.GENSHIN_IMPACT:
        return len === 5
          ? GachaItemTypeEnum.WEAPON
          : GachaItemTypeEnum.CHARACTER;
      case GameTypeEnum.HONKAI_STAR_RAIL:
        return len === 4
          ? GachaItemTypeEnum.CHARACTER
          : GachaItemTypeEnum.WEAPON;
      case GameTypeEnum.ZENLESS_ZONE_ZERO:
        if (len === 4) return GachaItemTypeEnum.CHARACTER;
        if (len === 5) {
          return itemId.startsWith('5')
            ? GachaItemTypeEnum.BANBOO
            : GachaItemTypeEnum.WEAPON;
        }
        return '';
      default:
        return '';
    }
  }

  /**
   * 按 gacha_type 分组祈愿记录
   */
  private groupRecordsByGachaType(
    records: GachaRecordEntity[]
  ): Record<string, GachaRecordEntity[]> {
    const grouped: Record<string, GachaRecordEntity[]> = {};
    for (const record of records) {
      if (!grouped[record.gacha_type]) {
        grouped[record.gacha_type] = [];
      }
      grouped[record.gacha_type].push(record);
    }
    return grouped;
  }

  /**
   * 绝区零将 rank_type 数字映射为 S/A/B，原神和星铁保持原值
   */
  private resolveRankType(gameType: GameType, rankType: string): string {
    if (gameType !== GameTypeEnum.ZENLESS_ZONE_ZERO) {
      return rankType.toString();
    }
    const zzzRankMap: Record<string, string> = { '4': 'S', '3': 'A', '2': 'B' };
    return zzzRankMap[rankType] ?? rankType.toString();
  }

  /**
   * 根据配置ID获取祈愿记录（按gacha_type分组）
   * @param gachaConfigId 祈愿配置ID
   * @returns 分组的祈愿记录（包含icon_url）
   */
  async getGachaRecordsByConfigId(
    gachaConfigId: string
  ): Promise<Record<string, GachaRecordEntity[]>> {
    const config =
      await this.gachaConfigService.getGachaConfigById(gachaConfigId);

    const recordList = await this.gachaRecordDao.findAll(
      {
        game_type: config.game_type,
        server_region: config.region,
        uid: config.game_uid,
      },
      undefined,
      { gacha_id: -1 }
    );
    const records = this.groupRecordsByGachaType(recordList);

    this.logger.info(
      `[GachaRecordService] Found ${Object.keys(records).length} gacha types for config ${gachaConfigId}`
    );

    // 收集所有item_id，查询对应的icon_url
    const allRecords: GachaRecordEntity[] = [];
    for (const recordList of Object.values(records)) {
      allRecords.push(...recordList);
    }

    const uniqueItemIds = [
      ...new Set(allRecords.map(r => r.item_id).filter(id => id)),
    ];
    if (uniqueItemIds.length > 0) {
      const atlasList = await this.gachaAtlasService.findByItemIds(
        config.game_type,
        uniqueItemIds
      );

      // 构建 item_id -> icon_url 的映射
      const iconUrlMap = new Map<string, string>();
      for (const atlas of atlasList) {
        if (atlas.item_id && atlas.icon_url) {
          iconUrlMap.set(atlas.item_id, atlas.icon_url);
        }
      }

      // 将 icon_url 添加到每条记录
      for (const record of allRecords) {
        record.icon_url = iconUrlMap.get(record.item_id) || '';
      }
    }

    return records;
  }

  /**
   * 导出祈愿记录，上传到 MinIO 并返回下载链接
   * @param gachaConfigId 祈愿配置ID
   * @param fileName 文件名
   * @param fileType 文件类型（json/excel）
   * @param locale 当前语言
   * @returns MinIO 下载链接
   */
  async exportGachaRecords(
    gachaConfigId: string,
    fileName: string,
    fileType: 'json' | 'excel',
    locale: string
  ): Promise<string> {
    const config =
      await this.gachaConfigService.getGachaConfigById(gachaConfigId);

    const allRecords = await this.gachaRecordDao.findAll(
      {
        game_type: config.game_type,
        server_region: config.region,
        uid: config.game_uid,
      },
      undefined,
      { gacha_id: -1 }
    );

    if (allRecords.length === 0) {
      throw BUSINESS_ERROR_CONSTANT.GACHA_EXPORT_EMPTY();
    }

    const isZh = locale === LocaleEnum.ZH_CN;
    const safeFileName = fileName.replace(/[^a-zA-Z0-9一-龥_-]/g, '');
    const timestamp = dayjs().format('YYYYMMDD_HHmmss');

    if (fileType === 'json') {
      const ext = 'json';
      const objectKey = `gacha/export/${dayjs().format('YYYY-MM')}/${safeFileName}_${timestamp}.${ext}`;

      const gameKeyMap: Record<string, string> = {
        [GameTypeEnum.GENSHIN_IMPACT]: 'hk4e',
        [GameTypeEnum.HONKAI_STAR_RAIL]: 'hkrpg',
        [GameTypeEnum.ZENLESS_ZONE_ZERO]: 'nap',
      };
      const gameKey = gameKeyMap[config.game_type];

      const groupedData: Record<string, any[]> = {};
      for (const record of allRecords) {
        if (!groupedData[record.gacha_type]) {
          groupedData[record.gacha_type] = [];
        }
        groupedData[record.gacha_type].push({
          id: record.gacha_id,
          gacha_type: record.gacha_type,
          item_id: record.item_id,
          name: record.item_name,
          item_type: record.item_type,
          rank_type: record.rank_type,
          time: dayjs(record.gacha_time).format('YYYY-MM-DD HH:mm:ss'),
          lang: isZh ? 'zh-cn' : 'en-us',
        });
      }

      const exportData = {
        [gameKey]: Object.entries(groupedData).map(([gachaType, list]) => ({
          gacha_type: gachaType,
          uid: config.game_uid,
          timezone: allRecords[0]?.region_time_zone ?? 8,
          lang: isZh ? 'zh-cn' : 'en-us',
          list,
        })),
      };

      const buffer = Buffer.from(JSON.stringify(exportData, null, 2));
      return this.minioService.uploadBuffer(
        buffer,
        objectKey,
        'application/json'
      );
    }

    if (fileType === 'excel') {
      const ext = 'xlsx';
      const objectKey = `gacha/export/${dayjs().format('YYYY-MM')}/${safeFileName}_${timestamp}.${ext}`;
      const records = this.groupRecordsByGachaType(allRecords);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Arona Blog';
      workbook.created = new Date();

      // 列名国际化
      const columnHeaders = isZh
        ? {
            id: 'ID',
            time: '时间',
            type: '类型',
            name: '名称',
            category: '类别',
            rank: '星级',
            uid: 'UID',
          }
        : {
            id: 'ID',
            time: 'Time',
            type: 'Type',
            name: 'Name',
            category: 'Category',
            rank: 'Rank',
            uid: 'UID',
          };

      const gachaTypeLabelMap: Record<string, { zh: string; en: string }> = {};
      for (const gachaType of Object.keys(records)) {
        gachaTypeLabelMap[gachaType] = this.getGachaTypeLabel(
          gachaType,
          config.game_type
        );
      }

      for (const [gachaType, recordList] of Object.entries(records)) {
        const label = isZh
          ? gachaTypeLabelMap[gachaType]?.zh || gachaType
          : gachaTypeLabelMap[gachaType]?.en || gachaType;
        const worksheet = workbook.addWorksheet(label.slice(0, 31));

        worksheet.columns = [
          { header: columnHeaders.id, key: 'gacha_id', width: 20 },
          { header: columnHeaders.time, key: 'gacha_time', width: 22 },
          { header: columnHeaders.type, key: 'gacha_type_label', width: 16 },
          { header: columnHeaders.name, key: 'item_name', width: 20 },
          { header: columnHeaders.category, key: 'item_type', width: 12 },
          { header: columnHeaders.rank, key: 'rank_type', width: 8 },
          { header: columnHeaders.uid, key: 'uid', width: 12 },
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };

        for (const record of recordList) {
          worksheet.addRow({
            gacha_id: record.gacha_id,
            gacha_time: isZh
              ? dayjs(record.gacha_time).format('YYYY-MM-DD HH:mm:ss')
              : new Date(record.gacha_time).toLocaleString('en-US'),
            gacha_type_label: isZh
              ? gachaTypeLabelMap[gachaType]?.zh || gachaType
              : gachaTypeLabelMap[gachaType]?.en || gachaType,
            item_name: record.item_name,
            item_type: record.item_type,
            rank_type: record.rank_type,
            uid: config.game_uid,
          });
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return this.minioService.uploadBuffer(
        Buffer.from(buffer),
        objectKey,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    }

    throw BUSINESS_ERROR_CONSTANT.GACHA_EXPORT_FILE_TYPE_INVALID();
  }

  /**
   * 异步清理不再有任何配置关联的祈愿记录
   * @param gameType 游戏类型
   * @param region 服务器区域
   * @param uid 游戏UID
   */
  asyncCleanupOrphanRecords(gameType: string, region: string, uid: string) {
    this.gachaConfigService
      .countConfigsByQuery({ game_type: gameType, region, game_uid: uid })
      .then(count => {
        if (count === 0) {
          this.logger.info(
            `[GachaRecordService] No configs found for gameType=${gameType}, region=${region}, uid=${uid}, cleaning up orphan gacha records`
          );
          return this.gachaRecordDao.deleteMany({
            game_type: gameType,
            server_region: region,
            uid,
          });
        }
        this.logger.info(
          `[GachaRecordService] Found ${count} config(s) for gameType=${gameType}, region=${region}, uid=${uid}, skipping orphan cleanup`
        );
      })
      .catch(err => {
        this.logger.error(
          '[GachaRecordService] asyncCleanupOrphanRecords error',
          err
        );
      });
  }
}
