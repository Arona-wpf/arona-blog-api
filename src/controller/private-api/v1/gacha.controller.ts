import {
  Body,
  Controller,
  Fields,
  Files,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Session,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { UploadFileInfo } from '@midwayjs/upload';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { GameType } from '@/definition/types/gacha.type';
import {
  CreateGachaConfigDTO,
  CreateGachaTaskDTO,
  DeleteGachaConfigDTO,
  ExportGachaDTO,
  GetGachaConfigListDTO,
  GetGachaRecordListDTO,
  ImportGachaDTO,
  UpdateGachaConfigDTO,
} from '@/dto/gacha.dto';
import { IUserSession } from '@/interface';
import { GachaConfigService } from '@/service/gacha-config.service';
import { GachaRecordService } from '@/service/gacha-record.service';
import { GachaTaskService } from '@/service/gacha-task.service';

@Controller('/private-api/v1/gacha')
export class PriV1GachaController {
  @Inject()
  ctx: Context;

  @Inject()
  gachaTaskService: GachaTaskService;

  @Inject()
  gachaConfigService: GachaConfigService;

  @Inject()
  gachaRecordService: GachaRecordService;

  /**
   * 创建祈愿同步任务
   */
  @Post('/sync')
  async createTask(
    @Body() body: CreateGachaTaskDTO,
    @Session() session: IUserSession
  ) {
    const account = session.user.account;
    const task = await this.gachaTaskService.createGachaTask(
      body.gacha_config_id,
      body.gacha_url,
      account
    );

    return {
      data: {
        task_id: task._id,
      },
      group: 'gacha',
      msg: 'gacha.task.create.success',
    };
  }

  /**
   * 查询祈愿任务状态
   */
  @Get('/task/:taskId')
  async getTask(@Param('taskId') taskId: string) {
    const task = await this.gachaTaskService.getGachaTask(taskId);

    return {
      data: {
        task_id: task._id,
        game_type: task.game_type,
        uid: task.uid,
        status: task.status,
        server_region: task.server_region,
        total_records: task.total_records,
        error_message: task.error_message,
        created_at: task.created_at,
        updated_at: task.updated_at,
      },
      group: 'gacha',
      msg: 'gacha.task.get.success',
    };
  }

  /**
   * 创建祈愿配置
   */
  @Post('/config/create')
  async createConfig(
    @Body() body: CreateGachaConfigDTO,
    @Session() session: IUserSession
  ) {
    const account = session.user.account;
    const config = await this.gachaConfigService.createGachaConfig(
      account,
      body.game_type as GameType,
      body.region,
      body.game_uid,
      body.game_nickname,
      body.gacha_url
    );

    return {
      data: {
        _id: config._id,
        game_type: config.game_type,
        region: config.region,
        game_uid: config.game_uid,
        game_nickname: config.game_nickname,
        created_at: config.created_at,
      },
      group: 'gacha',
      msg: 'gacha.config.create.success',
    };
  }

  /**
   * 获取祈愿配置列表
   */
  @Get('/config/list')
  async getConfigList(
    @Query() query: GetGachaConfigListDTO,
    @Session() session: IUserSession
  ) {
    const account = session.user.account;
    let configList;
    if (query.game_type) {
      configList = await this.gachaConfigService.getGachaConfigListByGameType(
        account,
        query.game_type as GameType
      );
    } else {
      configList = await this.gachaConfigService.getGachaConfigList(account);
    }

    return {
      data: configList,
      group: 'gacha',
      msg: 'gacha.config.list.success',
    };
  }

  /**
   * 更新祈愿配置
   */
  @Post('/config/update')
  async updateConfig(
    @Body() body: UpdateGachaConfigDTO,
    @Session() session: IUserSession
  ) {
    const account = session.user.account;
    const updateData: Record<string, any> = {};
    if (body.game_uid) updateData.game_uid = body.game_uid;
    if (body.game_nickname) updateData.game_nickname = body.game_nickname;
    if (body.gacha_url) updateData.gacha_url = body.gacha_url;

    await this.gachaConfigService.updateGachaConfig(
      body._id,
      account,
      updateData
    );

    return {
      data: null,
      group: 'gacha',
      msg: 'gacha.config.update.success',
    };
  }

  /**
   * 删除祈愿配置
   */
  @Post('/config/delete')
  async deleteConfig(
    @Body() body: DeleteGachaConfigDTO,
    @Session() session: IUserSession
  ) {
    const account = session.user.account;
    await this.gachaConfigService.deleteGachaConfig(body._id, account);

    return {
      data: null,
      group: 'gacha',
      msg: 'gacha.config.delete.success',
    };
  }

  /**
   * 导入祈愿记录（JSON文件）
   */
  @Post('/import')
  async importGacha(
    @Files('file') files: Array<UploadFileInfo<string>>,
    @Fields() fields: ImportGachaDTO
  ) {
    if (!files?.length) {
      throw BUSINESS_ERROR_CONSTANT.FILE_UPLOAD_NOT_FOUND();
    }
    const result = await this.gachaRecordService.parseAndImportGachaJson(
      files[0].data,
      fields.gacha_config_id,
      fields.game_type as GameType
    );

    return {
      data: result,
      group: 'gacha',
      msg: 'gacha.import.success',
    };
  }

  /**
   * 导出祈愿记录（JSON/Excel），上传到 MinIO 返回下载链接
   */
  @Post('/export')
  async exportGacha(@Body() body: ExportGachaDTO) {
    const locale = (this.ctx as any).locale || 'zh-cn';
    const downloadUrl = await this.gachaRecordService.exportGachaRecords(
      body.gacha_config_id,
      body.file_name,
      body.file_type as 'json' | 'excel',
      locale
    );

    return {
      data: { url: downloadUrl },
      group: 'gacha',
      msg: 'gacha.export.success',
    };
  }

  /**
   * 获取祈愿记录列表（按gacha_type分组）
   */
  @Get('/record/list')
  async getRecordList(@Query() query: GetGachaRecordListDTO) {
    const records = await this.gachaRecordService.getGachaRecordsByConfigId(
      query.gacha_config_id
    );

    // 转换记录格式，添加标签信息
    const groupedRecords: Record<string, any[]> = {};
    for (const [gachaType, recordList] of Object.entries(records)) {
      groupedRecords[gachaType] = recordList.map(record => ({
        _id: record._id,
        gacha_id: record.gacha_id,
        gacha_type: record.gacha_type,
        gacha_time: record.gacha_time,
        item_id: record.item_id,
        item_type: record.item_type,
        item_name: record.item_name,
        rank_type: record.rank_type,
        icon_url: record.icon_url,
      }));
    }

    return {
      data: groupedRecords,
      group: 'gacha',
      msg: 'gacha.record.list.success',
    };
  }
}
