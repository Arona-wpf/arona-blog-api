import { Inject, Logger, Provide } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';

import { GachaTaskDao } from '@/dao/gacha-task.dao';
import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import {
  GachaTaskStatusEnum,
  GameTypeEnum,
} from '@/definition/enums/gacha.enum';
import { GameType } from '@/definition/types/gacha.type';
import { GachaConfigService } from '@/service/gacha-config.service';
import { GachaRecordService } from '@/service/gacha-record.service';

@Provide()
export class GachaTaskService {
  @Inject()
  gachaTaskDao: GachaTaskDao;

  @Inject()
  gachaRecordService: GachaRecordService;

  @Inject()
  gachaConfigService: GachaConfigService;

  @Logger()
  logger: ILogger;

  /**
   * 创建祈愿分析任务
   * @param gachaConfigId 祈愿配置ID
   * @returns 任务实体
   */
  async createGachaTask(gachaConfigId: string) {
    const config =
      await this.gachaConfigService.getGachaConfigById(gachaConfigId);

    this.logger.info(
      `[GachaTaskService] Creating gacha task for config: ${gachaConfigId}, uid: ${config.game_uid}, gameType: ${config.game_type}`
    );

    const task = await this.gachaTaskDao.createOne({
      game_type: config.game_type,
      uid: config.game_uid,
      gacha_url: config.gacha_url,
      gacha_config_id: gachaConfigId,
      status: GachaTaskStatusEnum.PENDING,
    });

    this.logger.info(
      `[GachaTaskService] Gacha task created with id: ${task._id}`
    );

    // (异步)执行祈愿分析任务
    this.executeGachaTask(task._id);

    return task;
  }

  /**
   * 获取祈愿分析任务详情
   * @param taskId 任务ID
   * @returns 任务实体
   */
  async getGachaTask(taskId: string) {
    const task = await this.gachaTaskDao.findById(taskId);
    if (!task) {
      this.logger.error(`[GachaTaskService] Task not found: ${taskId}`);
      throw BUSINESS_ERROR_CONSTANT.GACHA_TASK_NOT_FOUND();
    }
    return task;
  }

  /**
   * 执行祈愿分析任务（供定时任务或其他服务调用）
   * @param taskId 任务ID
   */
  async executeGachaTask(taskId: string): Promise<void> {
    const task = await this.getGachaTask(taskId);

    // 检查任务状态
    if (
      task.status === GachaTaskStatusEnum.PROCESSING ||
      task.status === GachaTaskStatusEnum.COMPLETED
    ) {
      this.logger.warn(
        `[GachaTaskService] Task ${taskId} is already ${task.status}, skipping`
      );
      return;
    }

    // 更新状态为处理中
    await this.gachaTaskDao.findOneAndUpdate(
      { _id: taskId },
      { $set: { status: GachaTaskStatusEnum.PROCESSING } }
    );

    try {
      const gameType = task.game_type as GameType;
      const gameTypeLabel = this.gachaRecordService.getGameTypeLabel(gameType);
      this.logger.info(
        `[GachaTaskService] Executing task ${taskId}, gameType: ${gameTypeLabel.en}/${gameTypeLabel.zh}`
      );

      // 解析URL
      const url = this.gachaRecordService.verifyAndFixMihoyoGachaUrl(
        task.gacha_url
      );
      const { searchParams, host } = new URL(url);
      const authKey = searchParams.get('authkey');
      const serverRegion = searchParams.get('region');

      if (!authKey) {
        throw BUSINESS_ERROR_CONSTANT.GACHA_AUTH_KEY_NOT_FOUND();
      }
      if (!serverRegion) {
        throw BUSINESS_ERROR_CONSTANT.GACHA_SERVER_REGION_NOT_FOUND();
      }

      // 更新任务的服务器区域
      await this.gachaTaskDao.findOneAndUpdate(
        { _id: taskId },
        { $set: { server_region: serverRegion } }
      );

      // 删除祈愿参数
      searchParams.delete('page');
      searchParams.delete('size');
      searchParams.delete('gacha_type');
      searchParams.delete('end_id');

      // 获取Axios实例
      const axiosInstance = await this.gachaRecordService.getAxiosInstance(
        gameType,
        host
      );

      // 根据游戏类型执行同步（收集item数据用于图鉴更新）
      let totalRecords = 0;
      let syncedItems: Array<{ name: string; item_id: string }> = [];
      switch (gameType) {
        case GameTypeEnum.GENSHIN_IMPACT:
        case GameTypeEnum.HONKAI_STAR_RAIL:
        case GameTypeEnum.ZENLESS_ZONE_ZERO:
          ({ totalRecords, syncedItems } =
            await this.gachaRecordService.syncGachaDataWithItems(
              task.uid,
              gameType,
              axiosInstance,
              searchParams,
              serverRegion
            ));
          break;
        default:
          this.logger.error(
            `[GachaTaskService] Unsupported game type: ${gameType}`
          );
          throw BUSINESS_ERROR_CONSTANT.GACHA_GAME_TYPE_NOT_SUPPORTED();
      }

      // 更新任务状态为完成
      await this.gachaTaskDao.findOneAndUpdate(
        { _id: taskId },
        {
          $set: {
            status: GachaTaskStatusEnum.COMPLETED,
            total_records: totalRecords,
          },
        }
      );

      // 如果配置为国服，异步更新图鉴中的item_id
      if (task.gacha_config_id && this.isCnServer(serverRegion)) {
        this.logger.info(
          `[GachaTaskService] CN server detected, triggering asyncUpdateAtlasItemId for task ${taskId}`
        );
        this.gachaRecordService.asyncUpdateAtlasItemIdFromSync(
          gameType,
          syncedItems
        );
      }

      this.logger.info(
        `[GachaTaskService] Task ${taskId} completed successfully, total records: ${totalRecords}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // 更新任务状态为失败
      await this.gachaTaskDao.findOneAndUpdate(
        { _id: taskId },
        {
          $set: {
            status: GachaTaskStatusEnum.FAILED,
            error_message: errorMessage,
          },
        }
      );

      this.logger.error(
        `[GachaTaskService] Task ${taskId} failed with error: ${errorMessage}`
      );
    }
  }

  /**
   * 判断是否为国服
   */
  private isCnServer(region: string): boolean {
    return region.includes('cn');
  }

  /**
   * 获取待处理的任务列表（供定时任务调用）
   * @param limit 限制数量
   * @returns 任务列表
   */
  async getPendingTasks(limit: number = 100) {
    return await this.gachaTaskDao.findPendingTasks(limit);
  }
}
