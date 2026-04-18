import { Controller, Get, Inject, Session } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import { IUserSession } from '@/interface';

@Controller('/public-api/v1/user')
export class PubV1UserController {
  @Inject()
  ctx: Context;

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
}
