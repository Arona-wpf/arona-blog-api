import { Body, Controller, Inject, Post } from '@midwayjs/core';

import { Permission } from '@/decorator/permission.decorator';
import { GetPermissionListDto } from '@/dto/permission.dto';
import { PermissionService } from '@/service/permission.service';

@Controller('/private-api/v1/permission')
export class PriV1PermissionController {
  @Inject()
  permissionService: PermissionService;

  @Post('/list')
  @Permission({ permissionKeys: ['permission:view'] })
  async getPermissionList(@Body() body: GetPermissionListDto) {
    const data = await this.permissionService.getPermissionList(body);
    return {
      data,
      group: 'permission',
      msg: 'permission.list.success',
    };
  }
}
