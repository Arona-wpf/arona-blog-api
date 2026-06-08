import { Inject, Logger, Provide } from '@midwayjs/core';
import { MidwayI18nService } from '@midwayjs/i18n';
import { ILogger } from '@midwayjs/logger';

import { GachaTaskDao } from '@/dao/gacha-task.dao';
import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { LocaleEnum } from '@/definition/enums/common.enum';
import {
  GachaTaskStatusEnum,
  GameTypeEnum,
} from '@/definition/enums/gacha.enum';
import { GameType } from '@/definition/types/gacha.type';
import { WsConnectionManager } from '@/manage/ws-connection.manage';
import { GachaConfigService } from '@/service/gacha-config.service';
import {
  GachaRecordService,
  GachaSyncProgressPayload,
} from '@/service/gacha-record.service';

@Provide()
export class GachaTaskService {
  @Inject()
  gachaTaskDao: GachaTaskDao;

  @Inject()
  gachaRecordService: GachaRecordService;

  @Inject()
  gachaConfigService: GachaConfigService;

  @Inject()
  wsConnectionManager: WsConnectionManager;

  @Inject()
  i18nService: MidwayI18nService;

  @Logger()
  logger: ILogger;

  /**
   * 创建祈愿分析任务
   * @param gachaConfigId 祈愿配置ID
   * @param gachaUrl 祈愿URL
   * @param account 当前会话账号
   * @returns 任务实体
   */
  async createGachaTask(
    gachaConfigId: string,
    gachaUrl: string,
    account: string
  ) {
    const config =
      await this.gachaConfigService.getGachaConfigById(gachaConfigId);

    // 必须使用当前会话账号，防止越权同步其他账号配置
    if (config.account !== account) {
      throw BUSINESS_ERROR_CONSTANT.GACHA_CONFIG_ACCOUNT_MISMATCH();
    }

    this.logger.info(
      `[GachaTaskService] Creating gacha task for config: ${gachaConfigId}, uid: ${config.game_uid}, gameType: ${config.game_type}`
    );

    // 检查账号是否正在同步
    await this.gachaRecordService.assertAccountSyncNotInProgress(
      config.game_type as GameType,
      config.region,
      config.game_uid
    );

    // 创建祈愿分析任务
    const task = await this.gachaTaskDao.createOne({
      game_type: config.game_type,
      uid: config.game_uid,
      gacha_url: gachaUrl,
      gacha_config_id: gachaConfigId,
      status: GachaTaskStatusEnum.PENDING,
      server_region: config.region,
    });

    this.logger.info(
      `[GachaTaskService] Gacha task created with id: ${task._id}`
    );

    // 更新祈愿配置URL
    this.gachaConfigService.updateGachaConfig(gachaConfigId, account, {
      gacha_url: gachaUrl,
    });

    // (异步)执行祈愿分析任务
    this.executeGachaTask(task._id, config.region, account);

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
  async executeGachaTask(
    taskId: string,
    configServerRegion: string,
    account?: string
  ): Promise<void> {
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

    this.pushSyncLog(account, locale =>
      this.i18nService.translate('gacha.sync.progress.task.start', {
        group: 'gacha',
        locale,
      })
    );

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

      this.pushSyncLog(account, locale =>
        this.i18nService.translate('gacha.sync.progress.task.game', {
          group: 'gacha',
          locale,
          args: {
            game:
              locale === LocaleEnum.EN_US ? gameTypeLabel.en : gameTypeLabel.zh,
          },
        })
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
      // 检查服务器区域是否匹配
      if (serverRegion !== configServerRegion) {
        throw BUSINESS_ERROR_CONSTANT.GACHA_SERVER_REGION_MISMATCH();
      }

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
              serverRegion,
              payload => this.handleSyncProgress(account, payload)
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

      // 原神祈愿不更新图鉴
      if (gameType !== GameTypeEnum.GENSHIN_IMPACT) {
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
      }

      this.logger.info(
        `[GachaTaskService] Task ${taskId} completed successfully, total records: ${totalRecords}`
      );
      this.pushSyncLog(
        account,
        locale =>
          this.i18nService.translate('gacha.sync.progress.task.completed', {
            group: 'gacha',
            locale,
            args: { count: String(totalRecords) },
          }),
        'completed',
        { totalRecords }
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
      this.pushSyncLog(
        account,
        locale =>
          this.i18nService.translate('gacha.sync.progress.task.failed', {
            group: 'gacha',
            locale,
            args: { error: errorMessage },
          }),
        'failed'
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
   * 处理祈愿同步分页进度
   */
  private handleSyncProgress(
    account: string | undefined,
    payload: GachaSyncProgressPayload
  ) {
    if (payload.type === 'fetch_page') {
      this.pushSyncLog(account, locale =>
        this.i18nService.translate('gacha.sync.progress.fetch.page', {
          group: 'gacha',
          locale,
          args: {
            pool:
              locale === LocaleEnum.EN_US
                ? payload.gachaTypeLabel.en
                : payload.gachaTypeLabel.zh,
            page: String(payload.page || 1),
          },
        })
      );
      return;
    }

    if (payload.type === 'pool_completed') {
      this.pushSyncLog(account, locale =>
        this.i18nService.translate('gacha.sync.progress.pool.completed', {
          group: 'gacha',
          locale,
          args: {
            pool:
              locale === LocaleEnum.EN_US
                ? payload.gachaTypeLabel.en
                : payload.gachaTypeLabel.zh,
            count: String(payload.totalNewRecords || 0),
          },
        })
      );
    }
  }

  /**
   * 向账号在线连接推送祈愿同步日志
   */
  private pushSyncLog(
    account: string | undefined,
    messageBuilder: (locale: string) => string,
    status: 'processing' | 'completed' | 'failed' = 'processing',
    extraData?: Record<string, any>
  ) {
    if (!account) return;

    const connections = this.wsConnectionManager.getConnections(account);
    if (!connections || connections.size === 0) return;

    for (const ctx of connections) {
      if (ctx.readyState !== 1) continue;

      const locale =
        this.wsConnectionManager.getUser(ctx)?.locale || LocaleEnum.ZH_CN;
      const message = messageBuilder(locale);
      ctx.send(
        JSON.stringify({
          event: 'gacha:sync-log',
          data: { message, status, ...extraData },
        })
      );
    }
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
