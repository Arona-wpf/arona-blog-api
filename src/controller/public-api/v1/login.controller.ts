import {
  Body,
  Controller,
  Headers,
  Inject,
  Post,
  Session,
} from '@midwayjs/core';
import { RedisServiceFactory } from '@midwayjs/redis';
import { uniq } from 'lodash';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { RedisStorageEnum } from '@/definition/enums/common.enum';
import { LoginDto } from '@/dto/login.dto';
import { UserEntity } from '@/entity/user.entity';
import { IUserSession } from '@/interface';
import { CosInstanceManager } from '@/manage/cos-instance.manage';
import { UserSessionManager } from '@/manage/user-session.manage';
import { WsConnectionManager } from '@/manage/ws-connection.manage';
import { CosService } from '@/service/cos.service';
import { RoleService } from '@/service/role.service';
import { UserService } from '@/service/user.service';
import { parseCookiesValue } from '@/utils/common';

@Controller('/public-api/v1/login')
export class PubV1LoginController {
  @Inject()
  cosService: CosService;

  @Inject()
  roleService: RoleService;

  @Inject()
  userService: UserService;

  @Inject()
  cosInstanceManager: CosInstanceManager;

  @Inject()
  redisServiceFactory: RedisServiceFactory;

  @Inject()
  userSessionManager: UserSessionManager;

  @Inject()
  wsConnectionManager: WsConnectionManager;

  @Post('/')
  async login(
    @Body() body: LoginDto,
    @Session() session: IUserSession,
    @Headers('cookie') cookieHeader: string
  ) {
    const { account, password, email, cache_id } = body;
    const hasAccountPassword = !!account && !!password;
    const hasEmailCaptcha = !!email && !!cache_id;

    if (!hasAccountPassword && !hasEmailCaptcha) {
      throw BUSINESS_ERROR_CONSTANT.USER_LOGIN_PARAM_MISSING();
    }
    if (hasAccountPassword && hasEmailCaptcha) {
      throw BUSINESS_ERROR_CONSTANT.USER_LOGIN_PARAM_CONFLICT();
    }

    let user: UserEntity;
    if (hasAccountPassword) {
      user = await this.userService.loginByPassword(account, password);
    } else {
      user = await this.userService.loginByEmail(
        email as string,
        cache_id as string,
        session.guest?.tmpId as string
      );
    }

    // 获取用户角色对应的权限
    const roleIds = user.roles ?? [];
    const roleMap = await this.roleService.getRoleMap(roleIds);
    const permissions = uniq(
      Array.from(roleMap.values()).flatMap(role => [
        ...(role.api_permissions ?? []),
        ...(role.menu_permissions ?? []),
      ])
    );

    // 构建session用户对象
    const sessionUser = {
      _id: user._id as string,
      account: user.account,
      nickname: user.nickname,
      avatar: user.avatar,
      birthday: user.birthday,
      gender: user.gender,
      email: user.email,
      roles: user.roles,
      permissions,
    };

    const currentSessionId = this.getSessionIdFromCookie(cookieHeader);
    if (currentSessionId) {
      // 顶号检查：同账号存在旧会话时，踢掉旧连接并清理旧 session
      const previousSessionId = this.userSessionManager.getSessionId(
        sessionUser.account
      );
      if (previousSessionId && previousSessionId !== currentSessionId) {
        this.wsConnectionManager.sendToUser(
          sessionUser.account,
          'session:kicked',
          {}
        );
        this.wsConnectionManager.disconnectUserConnections(
          sessionUser.account,
          4001,
          'Duplicate login'
        );

        const redisService = this.redisServiceFactory.get(
          RedisStorageEnum.SESSION
        );
        if (redisService) {
          await redisService.del(previousSessionId);
        }
        this.userSessionManager.unbindBySessionId(previousSessionId);
      }
    }

    // 设置session
    session.user = sessionUser;
    session.guest = undefined;
    if (currentSessionId) {
      this.userSessionManager.bind(sessionUser.account, currentSessionId);
    }

    // 管理员登录：预初始化 COS 实例
    const isAdmin = sessionUser.roles?.includes('administrator');
    if (isAdmin) {
      // 清理可能存在的旧实例（顶号场景）
      this.cosInstanceManager.remove(sessionUser.account);
      // 预初始化 COS 实例并注册到管理器
      await this.cosService.getCosInstance(user, true);
    }

    return {
      data: sessionUser,
      group: 'user',
      msg: 'user.login.success',
    };
  }

  /**
   * 从 cookie 中解析当前会话 ID
   */
  private getSessionIdFromCookie(cookieHeader: string): string | null {
    if (!cookieHeader) return null;
    return parseCookiesValue(cookieHeader, 'arona-blog-api.sid');
  }
}
