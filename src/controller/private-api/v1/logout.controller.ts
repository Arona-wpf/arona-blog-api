import { Controller, Inject, Post, Session } from '@midwayjs/core';

import { IUserSession } from '@/interface';
import { CosInstanceManager } from '@/manage/cos-instance.manage';
import { CosService } from '@/service/cos.service';

@Controller('/private-api/v1/logout')
export class PrivV1LogoutController {
  @Inject()
  cosService: CosService;

  @Post('/')
  async logout(@Session() session: IUserSession) {
    const account = session.user?.account;

    if (account) {
      // 清除当前账号的 COS 实例
      CosInstanceManager.getInstance().remove(account);
    }

    // 销毁 session
    session.user = undefined;
    session.guest = undefined;

    return {
      data: null,
      group: 'user',
      msg: 'user.logout.success',
    };
  }
}
