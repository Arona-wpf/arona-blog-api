import { Inject, Logger, Provide } from '@midwayjs/core';
import { MidwayI18nService } from '@midwayjs/i18n';
import { ILogger } from '@midwayjs/logger';
import { AxiosInstance, AxiosResponse } from 'axios';

import { GachaRecordDao } from '@/dao/gacha-record.dao';
import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { RedisStorageEnum } from '@/definition/enums/common.enum';
import {
  GameTypeEnum,
  GameTypeI18nKeyMap,
  GenshinImpactGachaTypeEnum,
  GenshinImpactGachaTypeI18nKeyMap,
  HonkaiStarRailGachaTypeEnum,
  HonkaiStarRailGachaTypeI18nKeyMap,
  ZenlessZoneZeroGachaTypeEnum,
  ZenlessZoneZeroGachaTypeI18nKeyMap,
} from '@/definition/enums/gacha.enum';
import {
  GameType,
  IMihoyoGachaLogFetchData,
} from '@/definition/types/gacha.type';
import { GachaRecordEntity } from '@/entity/gacha-record.entity';
import { AxiosHelper } from '@/helper/axios.helper';
import { RedisHelper } from '@/helper/redis.helper';

const GACHA_LOCK_PREFIX = 'gacha:lock';
const GACHA_LOCK_TTL = 300; // 5 minutes

@Provide()
export class GachaRecordService {
  @Inject()
  gachaRecordDao: GachaRecordDao;

  @Inject()
  axiosHelper: AxiosHelper;

  @Inject()
  redisHelper: RedisHelper;

  @Inject()
  i18nService: MidwayI18nService;

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
   * 同步祈愿数据（通用方法）
   * @param uid 游戏uid
   * @param gameType 游戏类型
   * @param axiosInstance 请求实例
   * @param searchParams 查询参数
   * @param serverRegion 服务器区域
   */
  async syncGachaData(
    uid: string,
    gameType: GameType,
    axiosInstance: AxiosInstance,
    searchParams: URLSearchParams,
    serverRegion: string
  ): Promise<number> {
    const gameTypeLabel = this.getGameTypeLabel(gameType);
    const gachaTypeList = this.getGachaTypeList(gameType);
    const apiPath = this.getGachaApiPath(gameType);

    this.logger.info(
      `[GachaRecordService] Starting gacha sync for uid: ${uid}, gameType: ${gameTypeLabel.en}/${gameTypeLabel.zh}, serverRegion: ${serverRegion}`
    );

    let totalNewRecords = 0;

    for (const gachaType of gachaTypeList) {
      const gachaTypeLabel = this.getGachaTypeLabel(gachaType, gameType);
      const lockKey = this.generateLockKey(
        gameType,
        serverRegion,
        uid,
        gachaType
      );

      // 尝试获取锁
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
        totalNewRecords += await this.syncGachaDataByType(
          uid,
          gameType,
          axiosInstance,
          searchParams,
          serverRegion,
          gachaType,
          apiPath
        );
      } finally {
        // 释放锁
        await this.releaseLock(lockKey);
        this.logger.info(
          `[GachaRecordService] Released lock for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}`
        );
      }
    }

    this.logger.info(
      `[GachaRecordService] Completed gacha sync for uid: ${uid}, gameType: ${gameTypeLabel.en}/${gameTypeLabel.zh}, total new records: ${totalNewRecords}`
    );

    return totalNewRecords;
  }

  /**
   * 同步单个祈愿类型的数据
   * @param uid 游戏uid
   * @param gameType 游戏类型
   * @param axiosInstance 请求实例
   * @param searchParams 查询参数
   * @param serverRegion 服务器区域
   * @param gachaType 祈愿类型
   * @param apiPath API路径
   * @returns 新增记录数
   */
  private async syncGachaDataByType(
    uid: string,
    gameType: GameType,
    axiosInstance: AxiosInstance,
    searchParams: URLSearchParams,
    serverRegion: string,
    gachaType: string,
    apiPath: string
  ): Promise<number> {
    const gachaTypeLabel = this.getGachaTypeLabel(gachaType, gameType);

    // 获取最近祈愿记录用于增量对比
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

    // 准备查询参数
    let page = 1;
    const size = 50;
    let fetchMore = true;
    let retryCount = 0;
    let totalNewRecords = 0;

    const currentSearchParams = new URLSearchParams(searchParams);
    currentSearchParams.set('gacha_type', gachaType);
    currentSearchParams.set('size', size.toString());

    // 开始获取祈愿数据
    this.logger.info(
      `[GachaRecordService] Starting to fetch gacha log for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}`
    );

    while (fetchMore) {
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

      // 解析响应数据
      const { retcode, message, data } = response.data;
      if (retcode === 0 && message === 'OK' && data.list.length > 0) {
        const uniqueGachaList = data.list.filter(
          item => !recentGachaIds.includes(item.gacha_id)
        );

        // 处理新的祈愿记录
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
              item_type: r.item_type,
              item_name: r.name,
              rank_type: r.rank_type,
            });
            newGachaList.push(newGachaRecordEntity);
          });

          // 写入数据库
          this.logger.info(
            `[GachaRecordService] Writing ${newGachaList.length} records to database for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}`
          );
          await this.gachaRecordDao.createMany(newGachaList);
          totalNewRecords += newGachaList.length;

          // 检查是否还有更多数据
          if (newGachaList.length === size) {
            page++;
            currentSearchParams.set('page', page.toString());
            currentSearchParams.set(
              'end_id',
              uniqueGachaList[uniqueGachaList.length - 1].id
            );
          }
        }

        // 没有更多数据则停止获取
        if (uniqueGachaList.length < size) {
          fetchMore = false;
        }
      } else {
        this.logger.error(
          `[GachaRecordService] API returned error for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, retcode: ${retcode}, message: ${message}`
        );
        fetchMore = false;
      }
    }

    this.logger.info(
      `[GachaRecordService] Completed gacha sync for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, new records: ${totalNewRecords}`
    );

    return totalNewRecords;
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
}
