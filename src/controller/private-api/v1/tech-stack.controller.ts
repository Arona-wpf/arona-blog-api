import { Body, Controller, Inject, Post, Session } from '@midwayjs/core';
import { cloneDeep } from 'lodash';

import {
  CreateTechStackDto,
  DeleteTechStackDto,
  UpdateTechStackDto,
} from '@/dto/tech-stack.dto';
import { IUserSession } from '@/interface';
import { TechStackService } from '@/service/tech-stack.service';

@Controller('/private-api/v1/tech-stack')
export class PriV1TechStackController {
  @Inject()
  techStackService: TechStackService;

  @Post('/create')
  async createTechStack(
    @Body() body: CreateTechStackDto,
    @Session() session: IUserSession
  ) {
    const createData = cloneDeep(body);
    createData.creator = session.user.account;
    createData.updator = session.user.account;
    await this.techStackService.createTechStack(createData);

    return {
      data: null,
      group: 'techStack',
      msg: 'techStack.create.success',
    };
  }

  @Post('/update')
  async updateTechStack(
    @Body() body: UpdateTechStackDto,
    @Session() session: IUserSession
  ) {
    const updateData = cloneDeep(body);
    updateData.updator = session.user.account;
    await this.techStackService.updateTechStack(updateData);

    return {
      data: null,
      group: 'techStack',
      msg: 'techStack.update.success',
    };
  }

  @Post('/delete')
  async deleteTechStack(@Body() body: DeleteTechStackDto) {
    await this.techStackService.deleteTechStack(body._id);

    return {
      data: null,
      group: 'techStack',
      msg: 'techStack.delete.success',
    };
  }
}
