import { Controller, Inject, Post, Session } from '@midwayjs/core';

import { IUserSession } from '@/interface';
import { CosInstanceManager } from '@/manage/cos-instance.manage';
import { UserSessionManager } from '@/manage/user-session.manage';
import { CosService } from '@/service/cos.service';

@Controller('/private-api/v1/logout')
export class PrivV1LogoutController {
  @Inject()
  cosService: CosService;

  @Inject()
  cosInstanceManager: CosInstanceManager;

  @Inject()
  userSessionManager: UserSessionManager;

  @Post('/')
  async logout(@Session() session: IUserSession) {
    const account = session.user?.account;

    if (account) {
      // 清除当前账号的 COS 实例
      this.cosInstanceManager.remove(account);
      // 清除当前账号的会话映射
      this.userSessionManager.unbindByAccount(account);
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
