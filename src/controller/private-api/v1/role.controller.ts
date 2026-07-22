import { Body, Controller, Inject, Post } from '@midwayjs/core';

import { Permission } from '@/decorator/permission.decorator';
import { GetRoleListDto, UpdateRoleDto } from '@/dto/role.dto';
import { RoleService } from '@/service/role.service';

@Controller('/private-api/v1/role')
export class PriV1RoleController {
  @Inject()
  roleService: RoleService;

  @Post('/update')
  @Permission({ permissionKeys: ['role:update'] })
  async updateRole(@Body() body: UpdateRoleDto) {
    const data = await this.roleService.updateRole(body);
    return {
      data,
      group: 'role',
      msg: 'role.update.success',
    };
  }

  @Post('/list')
  @Permission({ permissionKeys: ['role:view'] })
  async getRoleList(@Body() body: GetRoleListDto) {
    const data = await this.roleService.getRoleList(body);
    return {
      data,
      group: 'role',
      msg: 'role.list.success',
    };
  }

  @Post('/all')
  @Permission({ permissionKeys: ['role:view'] })
  async getAllRoles() {
    const data = await this.roleService.getAllRoles();
    return {
      data: {
        list: data,
      },
      group: 'role',
      msg: 'role.all.success',
    };
  }
}
