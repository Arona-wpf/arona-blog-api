import { Body, Controller, Inject, Post, Session } from '@midwayjs/core';
import { cloneDeep } from 'lodash';

import { CreateConfigDto } from '@/dto/config.dto';
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
    const createData = cloneDeep(body);
    createData.creator = session.user.account;
    createData.updator = session.user.account;
    await this.configService.createConfig(createData);

    return {
      data: null,
      group: 'config',
      msg: 'config.create.success',
    };
  }
}
