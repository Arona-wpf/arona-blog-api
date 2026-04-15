import { Body, Controller, Inject, Post } from '@midwayjs/core';

import {
  CreatePermissionDto,
  DeletePermissionDto,
  GetPermissionListDto,
} from '@/dto/permission.dto';
import { PermissionService } from '@/service/permission.service';

@Controller('/private-api/v1/permission')
export class PriV1PermissionController {
  @Inject()
  permissionService: PermissionService;

  @Post('/create')
  async createPermission(@Body() body: CreatePermissionDto) {
    const data = await this.permissionService.createPermission(body);
    return {
      data,
      group: 'permission',
      msg: 'permission.create.success',
    };
  }

  @Post('/delete')
  async deletePermission(@Body() body: DeletePermissionDto) {
    await this.permissionService.deletePermission(body);
    return {
      data: null,
      group: 'permission',
      msg: 'permission.delete.success',
    };
  }

  @Post('/list')
  async getPermissionList(@Body() body: GetPermissionListDto) {
    const data = await this.permissionService.getPermissionList(body);
    return {
      data,
      group: 'permission',
      msg: 'permission.list.success',
    };
  }
}
