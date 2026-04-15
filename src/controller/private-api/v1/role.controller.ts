import { Body, Controller, Inject, Post } from '@midwayjs/core';

import {
  CreateRoleDto,
  DeleteRoleDto,
  GetRoleListDto,
  UpdateRoleDto,
} from '@/dto/role.dto';
import { RoleService } from '@/service/role.service';

@Controller('/private-api/v1/role')
export class PriV1RoleController {
  @Inject()
  roleService: RoleService;

  @Post('/create')
  async createRole(@Body() body: CreateRoleDto) {
    const data = await this.roleService.createRole(body);
    return {
      data,
      group: 'role',
      msg: 'role.create.success',
    };
  }

  @Post('/update')
  async updateRole(@Body() body: UpdateRoleDto) {
    const data = await this.roleService.updateRole(body);
    return {
      data,
      group: 'role',
      msg: 'role.update.success',
    };
  }

  @Post('/delete')
  async deleteRole(@Body() body: DeleteRoleDto) {
    await this.roleService.deleteRole(body);
    return {
      data: null,
      group: 'role',
      msg: 'role.delete.success',
    };
  }

  @Post('/list')
  async getRoleList(@Body() body: GetRoleListDto) {
    const data = await this.roleService.getRoleList(body);
    return {
      data,
      group: 'role',
      msg: 'role.list.success',
    };
  }
}
