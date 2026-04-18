import { Body, Controller, Inject, Post, Session } from '@midwayjs/core';
import { uniq } from 'lodash';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { LoginDto } from '@/dto/login.dto';
import { UserEntity } from '@/entity/user.entity';
import { IUserSession } from '@/interface';
import { RoleService } from '@/service/role.service';
import { UserService } from '@/service/user.service';

@Controller('/public-api/v1/login')
export class PubV1LoginController {
  @Inject()
  userService: UserService;

  @Inject()
  roleService: RoleService;

  @Post('/')
  async login(@Body() body: LoginDto, @Session() session: IUserSession) {
    const { account, password, cache_id } = body;
    const hasPassword = !!password;
    const hasCacheId = !!cache_id;

    if (!hasPassword && !hasCacheId) {
      throw BUSINESS_ERROR_CONSTANT.USER_LOGIN_PARAM_MISSING();
    }
    if (hasPassword && hasCacheId) {
      throw BUSINESS_ERROR_CONSTANT.USER_LOGIN_PARAM_CONFLICT();
    }

    let user: UserEntity;
    if (hasPassword) {
      user = await this.userService.loginByPassword(account, password);
    } else {
      user = await this.userService.loginByCacheId(
        account,
        cache_id,
        session.tmpId
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
      _id: user._id,
      account: user.account,
      nickname: user.nickname,
      avatar: user.avatar,
      birthday: user.birthday,
      gender: user.gender,
      email: user.email,
      roles: user.roles,
      permissions,
    };

    // 设置session
    session.user = sessionUser;
    session.tmpId = undefined;

    return {
      data: sessionUser,
      group: 'user',
      msg: 'user.login.success',
    };
  }
}
