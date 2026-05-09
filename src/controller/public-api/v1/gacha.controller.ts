import { Body, Controller, Get, Inject, Param, Post } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import { GameType } from '@/definition/types/gacha.type';
import { CreateGachaTaskDTO } from '@/dto/gacha.dto';
import { GachaTaskService } from '@/service/gacha-task.service';

@Controller('/public-api/v1/gacha')
export class PubV1GachaController {
  @Inject()
  ctx: Context;

  @Inject()
  gachaTaskService: GachaTaskService;

  /**
   * 创建祈愿同步任务
   * @param body 任务参数
   */
  @Post('/sync')
  async createTask(@Body() body: CreateGachaTaskDTO) {
    const task = await this.gachaTaskService.createGachaTask(
      body.uid,
      body.game_type as GameType,
      body.gacha_url
    );

    return {
      data: {
        task_id: task._id,
        status: 'created',
      },
      group: 'gacha',
      msg: 'gacha.task.create.success',
    };
  }

  /**
   * 查询祈愿任务状态
   * @param taskId 任务ID
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
}
