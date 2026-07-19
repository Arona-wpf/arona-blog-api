import { Body, Controller, Inject, Post, Session } from '@midwayjs/core';

import {
  ChangePasswordDto,
  CreateUserDto,
  DeleteUserDto,
  GetUserListDto,
  UpdateProfileDto,
  UpdateUserDto,
  UpdateUserRolesDto,
} from '@/dto/user.dto';
import { IUserSession } from '@/interface';
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

  @Post('/create')
  async createUser(@Body() body: CreateUserDto) {
    const data = await this.userService.createUser(body);
    return {
      data,
      group: 'user',
      msg: 'user.create.success',
    };
  }

  @Post('/update')
  async updateUser(@Body() body: UpdateUserDto) {
    const data = await this.userService.updateUser(body);
    return {
      data,
      group: 'user',
      msg: 'user.update.success',
    };
  }

  @Post('/delete')
  async deleteUser(@Body() body: DeleteUserDto) {
    await this.userService.deleteUser(body);
    return {
      data: null,
      group: 'user',
      msg: 'user.delete.success',
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

  @Post('/update-profile')
  async updateProfile(
    @Body() body: UpdateProfileDto,
    @Session() session: IUserSession
  ) {
    const userId = session.user?._id;
    if (!userId) {
      return {
        data: null,
        group: 'user',
        msg: 'user.not.login',
      };
    }

    const data = await this.userService.updateProfile(userId, body);
    // 更新 session 中的用户信息
    if (session.user) {
      if (body.nickname !== undefined) session.user.nickname = body.nickname;
      if (body.avatar !== undefined) session.user.avatar = body.avatar;
      if (body.gender !== undefined) session.user.gender = body.gender;
      if (body.birthday !== undefined) session.user.birthday = body.birthday;
    }
    return {
      data,
      group: 'user',
      msg: 'user.update.profile.success',
    };
  }

  @Post('/change-password')
  async changePassword(
    @Body() body: ChangePasswordDto,
    @Session() session: IUserSession
  ) {
    const userId = session.user?._id;
    if (!userId) {
      return {
        data: null,
        group: 'user',
        msg: 'user.not.login',
      };
    }

    await this.userService.changePassword(userId, body);
    // 销毁 session，强制重新登录
    session.user = undefined;
    return {
      data: null,
      group: 'user',
      msg: 'user.change.password.success',
    };
  }
}
