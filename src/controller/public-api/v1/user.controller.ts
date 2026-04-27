import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Session,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { ResetPasswordDto } from '@/dto/user.dto';
import { IUserSession } from '@/interface';
import { UserService } from '@/service/user.service';

@Controller('/public-api/v1/user')
export class PubV1UserController {
  @Inject()
  ctx: Context;

  @Inject()
  userService: UserService;

  @Get('/status')
  async status(@Session() session: IUserSession) {
    const user = session?.user;

    if (!user?.account) {
      return {
        data: null,
        group: 'user',
        msg: 'user.not.login',
      };
    }

    return {
      data: {
        _id: user._id,
        account: user.account,
        nickname: user.nickname,
        avatar: user.avatar,
        birthday: user.birthday,
        gender: user.gender,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
      },
      group: 'user',
      msg: 'user.status.success',
    };
  }

  @Get('/check-account')
  async checkAccount(@Query('account') account: string) {
    const email = await this.userService.checkAccountExists(account);

    return {
      data: {
        email,
      },
      group: 'user',
      msg: 'user.check.account.success',
    };
  }

  @Post('/reset-password')
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Session() session: IUserSession
  ) {
    // 从 session.guest 获取 email 和 tmpId
    const guest = session.guest;
    if (!guest?.email || !guest?.tmpId) {
      throw BUSINESS_ERROR_CONSTANT.USER_RESET_PASSWORD_INFO_MISSING();
    }

    // 重置密码，并销毁验证码缓存
    await this.userService.resetPasswordByEmail(guest.email, body, guest.tmpId);

    // 清除邮箱验证状态
    session.guest = {
      tmpId: guest.tmpId,
    };

    return {
      data: null,
      group: 'user',
      msg: 'user.reset.password.success',
    };
  }
}
