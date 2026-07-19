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
  CreateUserDto,
  DeleteUserDto,
  GetUserListDto,
  ResetPasswordDto,
  UpdateProfileDto,
  UpdateUserDto,
  UpdateUserRolesDto,
} from '@/dto/user.dto';
import { UserEntity } from '@/entity/user.entity';
import { RedisHelper } from '@/helper/redis.helper';
import { ResultHelper } from '@/helper/result.helper';
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
      RedisStorageEnum.SCRIPT
    );
    // 获取缓存键
    const cacheKey = `${RedisStorageEnum.SCRIPT}:${tmpId}:${CaptchaTypeEnum.LOGIN}`;
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
   * 通过邮箱+验证码登录
   * @param email 邮箱
   * @param cacheId 缓存ID
   * @param tmpId 临时访问ID
   * @returns 用户信息
   */
  async loginByEmail(email: string, cacheId: string, tmpId: string) {
    // 获取redis实例
    const redis = await this.redisHelper.getRedisInstance(
      RedisStorageEnum.SCRIPT
    );
    // 获取缓存键
    const cacheKey = `${RedisStorageEnum.SCRIPT}:${tmpId}:${CaptchaTypeEnum.LOGIN}`;
    // 获取缓存值
    const cacheValueString = await redis.get(cacheKey);
    // 如果缓存值不存在，则抛出验证码不存在错误
    if (!cacheValueString) {
      throw BUSINESS_ERROR_CONSTANT.CAPTCHA_VERIFY_NOT_FOUND();
    }

    // 解析缓存值
    const cacheValue = JSON.parse(cacheValueString);
    // 如果缓存 ID 不匹配，则抛出验证码不存在错误
    if (cacheValue.cache_id !== cacheId) {
      throw BUSINESS_ERROR_CONSTANT.CAPTCHA_VERIFY_NOT_FOUND();
    }
    // 如果验证码未验证，则抛出验证码错误
    if (!cacheValue.verified) {
      throw BUSINESS_ERROR_CONSTANT.CAPTCHA_VERIFY_FAILED();
    }

    // 检查邮箱是否存在
    const user = await this.userDao.findOne({ email });
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
   * 检查账号是否存在，并返回邮箱
   * @param account 账号
   * @returns 邮箱地址
   */
  async checkAccountExists(account: string) {
    // 检查账号是否存在
    const user = await this.userDao.findOne({ account }, 'email');
    if (!user) {
      throw BUSINESS_ERROR_CONSTANT.USER_NOT_EXIST();
    }

    return user.email;
  }

  /**
   * 重置密码（通过邮箱）
   * @param email 用户邮箱
   * @param data 重置密码参数
   * @param tmpId 临时访问ID
   * @returns 是否成功
   */
  async resetPasswordByEmail(
    email: string,
    data: ResetPasswordDto,
    tmpId: string
  ) {
    const { cache_id, password, confirm_password } = data;

    // 验证两次密码是否一致
    if (password !== confirm_password) {
      throw BUSINESS_ERROR_CONSTANT.USER_PASSWORD_NOT_MATCH();
    }

    // 获取 redis 实例，验证 cache_id
    const redis = await this.redisHelper.getRedisInstance(
      RedisStorageEnum.SCRIPT
    );
    const cacheKey = `${RedisStorageEnum.SCRIPT}:${tmpId}:${CaptchaTypeEnum.VERIFY_SELF}`;
    const cacheValueString = await redis.get(cacheKey);

    // 验证缓存是否存在
    if (!cacheValueString) {
      throw BUSINESS_ERROR_CONSTANT.CAPTCHA_VERIFY_NOT_FOUND();
    }

    // 解析缓存值并验证 cache_id
    const cacheValue = JSON.parse(cacheValueString);
    if (cacheValue.cache_id !== cache_id) {
      throw BUSINESS_ERROR_CONSTANT.CAPTCHA_VERIFY_NOT_FOUND();
    }

    // 通过邮箱查找用户
    const user = await this.userDao.findOne({ email });
    if (!user) {
      throw BUSINESS_ERROR_CONSTANT.USER_NOT_EXIST();
    }

    // 生成新盐并加密新密码
    const newSalt = generateSalt();
    const hashedPassword = sm3Hash(password + newSalt);

    // 更新密码
    const updatedUser = await this.userDao.findByIdAndUpdate(user._id, {
      $set: {
        password: hashedPassword,
        salt: newSalt,
      },
    });

    if (!updatedUser) {
      throw BUSINESS_ERROR_CONSTANT.USER_RESET_PASSWORD_FAILED();
    }

    // 密码更新成功后，销毁验证码缓存
    await redis.del(cacheKey);

    return true;
  }

  /**
   * 创建用户（管理员操作）
   * @param data 创建用户参数
   * @returns 新创建的用户
   */
  async createUser(data: CreateUserDto) {
    const { account, password, nickname, birthday, gender, email, roles } =
      data;
    // 检查账号是否已存在
    const existingUser = await this.userDao.findOne({ account });
    if (existingUser) {
      throw BUSINESS_ERROR_CONSTANT.USER_ALREADY_EXISTS();
    }
    // 检查邮箱是否已存在
    const existingEmail = await this.userDao.findOne({ email });
    if (existingEmail) {
      throw BUSINESS_ERROR_CONSTANT.USER_ALREADY_EXISTS();
    }
    // 验证角色是否存在
    if (roles && roles.length > 0) {
      const roleIds = uniq(roles);
      const roleCount = await this.roleService.countRolesByIds(roleIds);
      if (roleCount !== roleIds.length) {
        throw BUSINESS_ERROR_CONSTANT.USER_ROLE_NOT_EXIST();
      }
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
      roles: roles && roles.length > 0 ? uniq(roles) : [],
    });
    // 创建用户
    const newUser = await this.userDao.createOne(newUserEntity);
    return newUser;
  }

  /**
   * 更新用户信息（管理员操作）
   * @param data 更新用户参数
   * @returns 更新后的用户
   */
  async updateUser(data: UpdateUserDto) {
    const { _id, nickname, email, birthday, gender, password, roles } = data;
    // 检查用户是否存在
    const user = await this.userDao.findById(_id);
    if (!user) {
      throw BUSINESS_ERROR_CONSTANT.USER_NOT_EXIST();
    }
    // 检查邮箱是否被其他用户占用
    if (email && email !== user.email) {
      const existingEmail = await this.userDao.findOne({ email });
      if (existingEmail) {
        throw BUSINESS_ERROR_CONSTANT.USER_ALREADY_EXISTS();
      }
    }
    // 验证角色是否存在
    if (roles && roles.length > 0) {
      const roleIds = uniq(roles);
      const roleCount = await this.roleService.countRolesByIds(roleIds);
      if (roleCount !== roleIds.length) {
        throw BUSINESS_ERROR_CONSTANT.USER_ROLE_NOT_EXIST();
      }
    }
    // 构建更新数据
    const updateData: Record<string, any> = {};
    if (nickname !== undefined) {
      updateData.nickname = nickname;
    }
    if (email !== undefined) {
      updateData.email = email;
    }
    if (birthday !== undefined) {
      updateData.birthday = birthday;
    }
    if (gender !== undefined) {
      updateData.gender = gender;
    }
    if (roles !== undefined) {
      updateData.roles = uniq(roles);
    }
    // 如果需要更新密码
    if (password) {
      const newSalt = generateSalt();
      const hashedPassword = sm3Hash(password + newSalt);
      updateData.password = hashedPassword;
      updateData.salt = newSalt;
    }
    // 执行更新
    const updatedUser = await this.userDao.findByIdAndUpdate(_id, {
      $set: updateData,
    });
    if (!updatedUser) {
      throw BUSINESS_ERROR_CONSTANT.USER_UPDATE_PROFILE_FAILED();
    }
    return updatedUser;
  }

  /**
   * 删除用户（管理员操作）
   * @param data 删除用户参数
   * @returns 删除结果
   */
  async deleteUser(data: DeleteUserDto) {
    const { _id } = data;
    // 检查用户是否存在
    const user = await this.userDao.findById(_id);
    if (!user) {
      throw BUSINESS_ERROR_CONSTANT.USER_NOT_EXIST();
    }
    // 检查是否为管理员
    if (user.roles && user.roles.includes('administrator')) {
      throw BUSINESS_ERROR_CONSTANT.USER_IS_ADMINISTRATOR();
    }
    // 删除用户
    await this.userDao.findByIdAndDelete(_id);
    return null;
  }
}
