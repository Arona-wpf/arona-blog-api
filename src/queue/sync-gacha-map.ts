import { IProcessor, Processor } from '@midwayjs/bullmq';
import { FORMAT, Inject, Logger } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';
import { AxiosInstance } from 'axios';

import { QueueNameEnum } from '@/definition/enums/queue.enum';
import { AxiosHelper } from '@/helper/axios.helper';
import { GachaMapService } from '@/service/gacha-map.service';

@Processor(QueueNameEnum.SYNC_GACHA_MAP, {
  repeat: {
    pattern: FORMAT.CRONTAB.EVERY_HOUR,
  },
})
export class SyncGachaMapProcessor implements IProcessor {
  @Inject()
  axiosHelper: AxiosHelper;

  @Inject()
  gachaMapService: GachaMapService;

  @Logger('queueLogger')
  queueLogger: ILogger;

  async execute() {
    this.queueLogger.info(
      '[SyncGachaMapProcessor] Starting sync gacha map processor'
    );

    const axiosInstance = await this.axiosHelper.getAxiosInstance('uigf');

    // 同步原神祈愿物品映射
    try {
      await this.syncGenshinImpactGachaMap(axiosInstance);
    } catch (error) {
      this.queueLogger.error(
        '[SyncGachaMapProcessor] Sync genshin impact gacha map error',
        error
      );
    }

    // 同步崩坏：星穹铁道祈愿物品映射
    try {
      await this.syncHonkaiStarRailGachaMap(axiosInstance);
    } catch (error) {
      this.queueLogger.error(
        '[SyncGachaMapProcessor] Sync honkai star rail gacha map error',
        error
      );
    }

    // 同步绝区零祈愿物品映射
    try {
      await this.syncZenlessZoneZeroGachaMap(axiosInstance);
    } catch (error) {
      this.queueLogger.error(
        '[SyncGachaMapProcessor] Sync zenless zone zero gacha map error',
        error
      );
    }
  }

  /**
   * 同步原神祈愿物品映射
   * @param axiosInstance Axios实例
   */
  async syncGenshinImpactGachaMap(axiosInstance: AxiosInstance) {
    this.queueLogger.info(
      '[SyncGachaMapProcessor] Syncing genshin impact gacha map'
    );
  }

  /**
   * 同步崩坏：星穹铁道祈愿物品映射
   * @param axiosInstance Axios实例
   */
  async syncHonkaiStarRailGachaMap(axiosInstance: AxiosInstance) {
    this.queueLogger.info(
      '[SyncGachaMapProcessor] Syncing honkai star rail gacha map'
    );
  }

  /**
   * 同步绝区零祈愿物品映射
   * @param axiosInstance Axios实例
   */
  async syncZenlessZoneZeroGachaMap(axiosInstance: AxiosInstance) {
    this.queueLogger.info(
      '[SyncGachaMapProcessor] Syncing zenless zone zero gacha map'
    );
  }
}
