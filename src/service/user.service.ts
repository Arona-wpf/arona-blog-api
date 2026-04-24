import { CaptchaService } from '@midwayjs/captcha';
import { Inject, Provide } from '@midwayjs/core';
import { uniq } from 'lodash';

import { UserDao } from '@/dao/user.dao';
import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { CaptchaTypeEnum } from '@/definition/enums/captcha.enum';
import { RedisStorageEnum } from '@/definition/enums/common.enum';
import { IPageResult } from '@/definition/types/page.type';
import { RegisterDto } from '@/dto/register.dto';
import {
  ChangePasswordDto,
  GetUserListDto,
  UpdateProfileDto,
  UpdateUserRolesDto,
} from '@/dto/user.dto';
import { UserEntity } from '@/entity/user.entity';
import { RedisHelper } from '@/helper/redis.helper';
import { ResultHelper } from '@/helper/result.helper';
import { maskEmail } from '@/utils/common';
import { generateSalt, sm3Hash } from '@/utils/crypto';

import { CounterService } from './counter.service';
import { RoleService } from './role.service';

@Provide()
export class UserService {
  @Inject()
  captchaService: CaptchaService;

  @Inject()
  counterService: CounterService;

  @Inject()
  redisHelper: RedisHelper;

  @Inject()
  resultHelper: ResultHelper;

  @Inject()
  userDao: UserDao;

  @Inject()
  roleService: RoleService;

  /**
   * 注册用户
   * @param data 注册参数
   * @returns 新建后的用户实体
   */
  async registerUser(data: RegisterDto) {
    const { account, password, nickname, birthday, gender, email } = data;
    // 检查账号是否已存在
    const user = await this.userDao.findOne({ account });
    if (user) {
      throw BUSINESS_ERROR_CONSTANT.USER_ALREADY_EXISTS();
    }
    // 生成盐
    const salt = generateSalt();
    // 加密密码
    const hashedPassword = sm3Hash(password + salt);
    // 创建用户实体
    const newUserEntity = new UserEntity();
    Object.assign(newUserEntity, {
      account,
      password: hashedPassword,
      salt,
      nickname,
      birthday,
      gender,
      email,
    });
    // 创建用户
    const newUser = await this.userDao.createOne(newUserEntity);
    // 返回用户信息
    return newUser;
  }

  /**
   * 通过账号+密码登录
   * @param account 账号
   * @param password 密码
   * @returns 用户信息
   */
  async loginByPassword(account: string, password: string) {
    // 检查账号是否存在
    const user = await this.userDao.findOne({ account });
    if (!user) {
      throw BUSINESS_ERROR_CONSTANT.USER_NOT_EXIST();
    }
    // 验证密码
    const verifyPassword = sm3Hash(password + user.salt) === user.password;
    if (!verifyPassword) {
      throw BUSINESS_ERROR_CONSTANT.USER_LOGIN_FAILED_PASSWORD();
    }
    // 返回用户信息
    return user;
  }

  /**
   * 通过账号+缓存ID登录
   * @param account 账号
   * @param cacheId 缓存ID
   * @param tmpId 临时访问ID
   * @returns 用户信息
   */
  async loginByCacheId(account: string, cacheId: string, tmpId: string) {
    // 获取redis实例
    const redis = await this.redisHelper.getRedisInstance(
      RedisStorageEnum.CAPTCHA
    );
    // 获取缓存键
    const cacheKey = `${RedisStorageEnum.CAPTCHA}:${tmpId}:${CaptchaTypeEnum.LOGIN}`;
    // 获取缓存值
    const cacheValueString = await redis.get(cacheKey);
    // 如果缓存值不存在，则抛出验证码不存在错误
    if (!cacheValueString) {
      throw BUSINESS_ERROR_CONSTANT.CAPTCHA_VERIFY_NOT_FOUND();
    }

    // 解析缓存值
    const cacheValue = JSON.parse(cacheValueString);
    // 如果缓存 ID 不匹配，则抛出验证码不存在错误
    if (cacheValue.cacheId !== cacheId) {
      throw BUSINESS_ERROR_CONSTANT.CAPTCHA_VERIFY_NOT_FOUND();
    }
    // 如果验证码未验证，则抛出验证码错误
    if (!cacheValue.verified) {
      throw BUSINESS_ERROR_CONSTANT.CAPTCHA_VERIFY_FAILED();
    }

    // 检查账号是否存在
    const user = await this.userDao.findOne({ account });
    if (!user) {
      throw BUSINESS_ERROR_CONSTANT.USER_NOT_EXIST();
    }
    // 返回用户信息
    return user;
  }

  /**
   * 分页查询用户及角色权限信息
   * @param data 查询参数
   * @returns 用户分页结果（含角色与权限）
   */
  async getUserList(data: GetUserListDto): Promise<IPageResult<UserEntity>> {
    const { current_page, page_size, account, nickname, email, role_id } = data;
    const query: Record<string, any> = {};
    if (account) {
      query.account = account;
    }
    if (nickname) {
      query.nickname = nickname;
    }
    if (email) {
      query.email = email;
    }
    if (role_id) {
      query.roles = role_id;
    }

    const [list, total] = await Promise.all([
      this.userDao.findMany(query, current_page, page_size, '-password -salt', {
        seq: 1,
        _id: 1,
      }),
      this.userDao.count(query),
    ]);

    return {
      list,
      total,
      current_page,
      page_size,
    };
  }

  /**
   * 更新用户角色
   * @param data 更新参数
   * @returns 更新后的用户
   */
  async updateUserRoles(data: UpdateUserRolesDto) {
    const { _id, roles } = data;
    const user = await this.userDao.findById(_id);
    if (!user) {
      throw BUSINESS_ERROR_CONSTANT.USER_NOT_EXIST();
    }

    const roleIds = uniq(roles);
    const roleCount = await this.roleService.countRolesByIds(roleIds);
    if (roleCount !== roleIds.length) {
      throw BUSINESS_ERROR_CONSTANT.USER_ROLE_NOT_EXIST();
    }

    const updateUser = await this.userDao.findByIdAndUpdate(_id, {
      $set: {
        roles: roleIds,
      },
    });
    if (!updateUser) {
      throw BUSINESS_ERROR_CONSTANT.USER_UPDATE_ROLE_FAILED();
    }
    return updateUser;
  }

  /**
   * 按角色统计用户数量
   * @param roleId 角色ID
   * @returns 用户数量
   */
  async countUsersByRoleId(roleId: string) {
    return this.userDao.count({ roles: roleId });
  }

  /**
   * 更新用户资料
   * @param userId 用户ID
   * @param data 更新参数
   * @returns 更新后的用户
   */
  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.userDao.findById(userId);
    if (!user) {
      throw BUSINESS_ERROR_CONSTANT.USER_NOT_EXIST();
    }

    const updateData: Record<string, any> = {};
    if (data.nickname !== undefined) {
      updateData.nickname = data.nickname;
    }
    if (data.avatar !== undefined) {
      updateData.avatar = data.avatar;
    }
    if (data.gender !== undefined) {
      updateData.gender = data.gender;
    }
    if (data.birthday !== undefined) {
      updateData.birthday = data.birthday;
    }

    if (Object.keys(updateData).length === 0) {
      return user;
    }

    const updatedUser = await this.userDao.findByIdAndUpdate(userId, {
      $set: updateData,
    });

    if (!updatedUser) {
      throw BUSINESS_ERROR_CONSTANT.USER_UPDATE_PROFILE_FAILED();
    }

    return updatedUser;
  }

  /**
   * 修改用户密码
   * @param userId 用户ID
   * @param data 修改密码参数
   * @returns 是否成功
   */
  async changePassword(userId: string, data: ChangePasswordDto) {
    const { old_password, new_password, confirm_password } = data;

    // 验证两次新密码是否一致
    if (new_password !== confirm_password) {
      throw BUSINESS_ERROR_CONSTANT.USER_PASSWORD_NOT_MATCH();
    }

    // 获取用户
    const user = await this.userDao.findById(userId);
    if (!user) {
      throw BUSINESS_ERROR_CONSTANT.USER_NOT_EXIST();
    }

    // 验证旧密码
    const verifyOldPassword =
      sm3Hash(old_password + user.salt) === user.password;
    if (!verifyOldPassword) {
      throw BUSINESS_ERROR_CONSTANT.USER_OLD_PASSWORD_ERROR();
    }

    // 新密码不能与旧密码相同
    if (sm3Hash(new_password + user.salt) === user.password) {
      throw BUSINESS_ERROR_CONSTANT.USER_PASSWORD_SAME_AS_OLD();
    }

    // 生成新盐并加密新密码
    const newSalt = generateSalt();
    const hashedNewPassword = sm3Hash(new_password + newSalt);

    // 更新密码
    const updatedUser = await this.userDao.findByIdAndUpdate(userId, {
      $set: {
        password: hashedNewPassword,
        salt: newSalt,
      },
    });

    if (!updatedUser) {
      throw BUSINESS_ERROR_CONSTANT.USER_CHANGE_PASSWORD_FAILED();
    }

    return true;
  }

  /**
   * 检查账号是否存在，并返回隐藏后的邮箱
   * @param account 账号
   * @returns 隐藏后的邮箱地址
   */
  async checkAccountExists(account: string) {
    // 检查账号是否存在
    const user = await this.userDao.findOne({ account }, 'email');
    if (!user) {
      throw BUSINESS_ERROR_CONSTANT.USER_NOT_EXIST();
    }

    // 返回隐藏后的邮箱
    return {
      masked_email: maskEmail(user.email),
      email: user.email, // 完整邮箱用于后续验证码发送
    };
  }
}
