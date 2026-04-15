import { Body, Controller, Inject, Post } from '@midwayjs/core';

import { GetUserListDto, UpdateUserRolesDto } from '@/dto/user.dto';
import { UserService } from '@/service/user.service';

@Controller('/private-api/v1/user')
export class PriV1UserController {
  @Inject()
  userService: UserService;

  @Post('/list')
  async getUserList(@Body() body: GetUserListDto) {
    const data = await this.userService.getUserList(body);
    return {
      data,
      group: 'user',
      msg: 'user.list.success',
    };
  }

  @Post('/update-roles')
  async updateUserRoles(@Body() body: UpdateUserRolesDto) {
    const data = await this.userService.updateUserRoles(body);
    return {
      data,
      group: 'user',
      msg: 'user.update.roles.success',
    };
  }
}
