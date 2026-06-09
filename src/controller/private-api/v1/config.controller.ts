import { Body, Controller, Get, Inject, Post, Session } from '@midwayjs/core';
import { cloneDeep } from 'lodash';

import { CreateConfigDto, SetConfigDto } from '@/dto/config.dto';
import { IUserSession } from '@/interface';
import { ConfigService } from '@/service/config.service';

@Controller('/private-api/v1/config')
export class PriV1ConfigController {
  @Inject()
  configService: ConfigService;

  @Post('/create')
  async createConfig(
    @Body() body: CreateConfigDto,
    @Session() session: IUserSession
  ) {
    const account = session.user.account;

    const createData = cloneDeep(body);
    await this.configService.createConfig(createData, account);

    return {
      data: null,
      group: 'config',
      msg: 'config.create.success',
    };
  }

  @Get('/get')
  async getConfigList() {
    const groupedConfig = await this.configService.getGroupedConfigList();

    return {
      data: groupedConfig,
      group: 'config',
      msg: 'config.get.success',
    };
  }

  @Post('/set')
  async setConfig(
    @Body() body: SetConfigDto,
    @Session() session: IUserSession
  ) {
    const account = session.user.account;

    await this.configService.setConfigByKey(body.key, body.value, account);

    return {
      data: null,
      group: 'config',
      msg: 'config.set.success',
    };
  }
}
