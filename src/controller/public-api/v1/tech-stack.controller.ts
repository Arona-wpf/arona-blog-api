import { Body, Controller, Get, Inject, Post } from '@midwayjs/core';

import { TechStackTypeEnum } from '@/definition/enums/tech-stack.enum';
import { GetTechStackListDto } from '@/dto/tech-stack.dto';
import { TechStackService } from '@/service/tech-stack.service';

@Controller('/public-api/v1/tech-stack')
export class PubV1TechStackController {
  @Inject()
  techStackService: TechStackService;

  @Get('/list')
  async getTechStackList() {
    // 获取所有技术栈数据
    const result = await this.techStackService.getTechStackList(1, 100);

    // 按 type 分组返回
    const frontend = result.list.filter(
      item => item.type === TechStackTypeEnum.FRONTEND
    );
    const backend = result.list.filter(
      item => item.type === TechStackTypeEnum.BACKEND
    );

    return {
      data: {
        frontend,
        backend,
        total: result.total,
      },
      group: 'techStack',
      msg: 'techStack.list.success',
    };
  }

  @Post('/page')
  async getTechStackPage(@Body() body: GetTechStackListDto) {
    const { current_page = 1, page_size = 10, type, creator, updator } = body;
    const queryCondition: Record<string, any> = {};
    if (type) {
      queryCondition.type = type;
    }
    if (creator) {
      queryCondition.creator = creator;
    }
    if (updator) {
      queryCondition.updator = updator;
    }

    const result = await this.techStackService.getTechStackList(
      current_page,
      page_size,
      queryCondition
    );

    return {
      data: result,
      group: 'techStack',
      msg: 'techStack.list.success',
    };
  }
}
