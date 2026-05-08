import { Inject, Logger, Provide } from '@midwayjs/core';
import { MidwayI18nService } from '@midwayjs/i18n';
import { ILogger } from '@midwayjs/logger';
import { AxiosInstance, AxiosResponse } from 'axios';

import { GachaDao } from '@/dao/gacha.dao';
import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { RedisStorageEnum } from '@/definition/enums/common.enum';
import {
  GameTypeEnum,
  GameTypeI18nKeyMap,
  GenshinImpactGachaTypeEnum,
  GenshinImpactGachaTypeI18nKeyMap,
} from '@/definition/enums/gacha.enum';
import {
  GameType,
  IMihoyoGachaLogFetchData,
} from '@/definition/types/gacha.type';
import { GachaEntity } from '@/entity/gacha.entity';
import { AxiosHelper } from '@/helper/axios.helper';
import { RedisHelper } from '@/helper/redis.helper';

const GACHA_LOCK_PREFIX = 'gacha:lock';
const GACHA_LOCK_TTL = 300; // 5 minutes

@Provide()
export class GachaService {
  @Inject()
  gachaDao: GachaDao;

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
  private verifyAndFixMihoyoGachaUrl(url: string) {
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
   * @returns 祈愿类型标签（中英文）
   */
  private getGachaTypeLabel(gachaType: string): { zh: string; en: string } {
    const i18nKey = GenshinImpactGachaTypeI18nKeyMap[gachaType];
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
  private getGameTypeLabel(gameType: string): { zh: string; en: string } {
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
   * 同步原神祈愿数据
   * @param uid 游戏uid
   * @param axiosInstance 请求实例
   * @param searchParams 查询参数
   * @param serverRegion 服务器区域
   */
  private async syncGenshinImpactGachaData(
    uid: string,
    axiosInstance: AxiosInstance,
    searchParams: URLSearchParams,
    serverRegion: string
  ) {
    const gameType = GameTypeEnum.GENSHIN_IMPACT;
    const gameTypeLabel = this.getGameTypeLabel(gameType);
    const gachaTypeList = Object.values(GenshinImpactGachaTypeEnum);

    this.logger.info(
      `[GachaService] Starting gacha sync for uid: ${uid}, gameType: ${gameTypeLabel.en}/${gameTypeLabel.zh}, serverRegion: ${serverRegion}`
    );

    for (const gachaType of gachaTypeList) {
      const gachaTypeLabel = this.getGachaTypeLabel(gachaType);
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
          `[GachaService] Lock acquisition failed for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, skipping (may be in progress)`
        );
        continue;
      }

      this.logger.info(
        `[GachaService] Acquired lock for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}`
      );

      try {
        // 获取最近祈愿记录用于增量对比
        this.logger.info(
          `[GachaService] Fetching recent gacha records for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}`
        );
        const recentGachaRecords = await this.gachaDao.findMany(
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
        const recentGachaIds = recentGachaRecords.map(
          record => record.gacha_id
        );
        this.logger.info(
          `[GachaService] Found ${recentGachaRecords.length} recent records for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}`
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
          `[GachaService] Starting to fetch gacha log for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}`
        );

        while (fetchMore) {
          if (retryCount) {
            if (retryCount >= 3) {
              this.logger.error(
                `[GachaService] Max retries reached for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, aborting`
              );
              break;
            }
            this.logger.warn(
              `[GachaService] Retrying fetch for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, attempt ${retryCount}`
            );
          }

          let response: AxiosResponse<IMihoyoGachaLogFetchData>;
          try {
            response = await axiosInstance.get(
              `/gacha_info/api/getGachaLog?${currentSearchParams.toString()}`
            );
          } catch (error) {
            this.logger.error(
              `[GachaService] Request failed for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, page: ${page}, error: ${error.message}`
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
                `[GachaService] Found ${uniqueGachaList.length} new records for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, page: ${page}`
              );

              const newGachaList: GachaEntity[] = [];
              uniqueGachaList.forEach(r => {
                const newGachaEntity = new GachaEntity();
                Object.assign(newGachaEntity, {
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
                newGachaList.push(newGachaEntity);
              });

              // 写入数据库
              this.logger.info(
                `[GachaService] Writing ${newGachaList.length} records to database for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}`
              );
              await this.gachaDao.createMany(newGachaList);
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
              `[GachaService] API returned error for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, retcode: ${retcode}, message: ${message}`
            );
            fetchMore = false;
          }
        }

        this.logger.info(
          `[GachaService] Completed gacha sync for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}, total new records: ${totalNewRecords}`
        );
      } finally {
        // 释放锁
        await this.releaseLock(lockKey);
        this.logger.info(
          `[GachaService] Released lock for gachaType: ${gachaTypeLabel.en}/${gachaTypeLabel.zh}`
        );
      }
    }

    this.logger.info(
      `[GachaService] Completed gacha sync for uid: ${uid}, gameType: ${gameTypeLabel.en}/${gameTypeLabel.zh}`
    );
  }

  /**
   * 同步祈愿数据
   * @param uid 游戏uid
   * @param gameType 游戏类型
   * @param originUrl 原始祈愿URL
   */
  async syncGachaData(uid: string, gameType: GameType, originUrl: string) {
    const gameTypeLabel = this.getGameTypeLabel(gameType);
    this.logger.info(
      `[GachaService] Starting gacha data sync for uid: ${uid}, gameType: ${gameTypeLabel.en}/${gameTypeLabel.zh}`
    );

    const url = this.verifyAndFixMihoyoGachaUrl(originUrl);

    const { searchParams, host } = new URL(url);
    const authKey = searchParams.get('authkey');
    const serverRegion = searchParams.get('region');

    // 验证 auth key
    if (!authKey) {
      this.logger.error('[GachaService] Auth key not found in gacha URL');
      throw BUSINESS_ERROR_CONSTANT.GACHA_AUTH_KEY_NOT_FOUND();
    }

    // 验证服务器区域
    if (!serverRegion) {
      this.logger.error('[GachaService] Server region not found in gacha URL');
      throw BUSINESS_ERROR_CONSTANT.GACHA_SERVER_REGION_NOT_FOUND();
    }

    this.logger.info(
      `[GachaService] Extracted auth key and server region: ${serverRegion}`
    );

    // 删除祈愿参数，后续手动拼接
    searchParams.delete('page');
    searchParams.delete('size');
    searchParams.delete('gacha_type');
    searchParams.delete('end_id');

    // 判断是否为全球服
    const isGlobalServer =
      host.includes('webstatic-sea') ||
      host.includes('api-os-takumi') ||
      host.includes('hoyoverse.com');

    this.logger.info(
      `[GachaService] Server type: ${isGlobalServer ? 'global' : 'cn'}`
    );

    const axiosInstance = await this.axiosHelper.getAxiosInstance(
      gameType + (isGlobalServer ? '_global' : '')
    );

    switch (gameType) {
      case GameTypeEnum.GENSHIN_IMPACT:
        return this.syncGenshinImpactGachaData(
          uid,
          axiosInstance,
          searchParams,
          serverRegion
        );
      default:
        this.logger.error(`[GachaService] Unsupported game type: ${gameType}`);
        throw BUSINESS_ERROR_CONSTANT.GACHA_GAME_TYPE_NOT_SUPPORTED();
    }
  }
}
