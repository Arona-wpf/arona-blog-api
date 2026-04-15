import { Body, Controller, Inject, Post, Session } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { CaptchaTypeEnum } from '@/definition/enums/captcha.enum';
import { RedisStorageEnum } from '@/definition/enums/common.enum';
import { RegisterDto } from '@/dto/register.dto';
import { RedisHelper } from '@/helper/redis.helper';
import { IUserSession } from '@/interface';
import { UserService } from '@/service/user.service';

@Controller('/public-api/v1/register')
export class PubV1RegisterController {
  @Inject()
  ctx: Context;

  @Inject()
  userService: UserService;

  @Inject()
  redisHelper: RedisHelper;

  @Post('/')
  async register(@Body() body: RegisterDto, @Session() session: IUserSession) {
    // 获取redis实例
    const redis = await this.redisHelper.getRedisInstance(
      RedisStorageEnum.CAPTCHA
    );
    // 获取缓存键
    const cacheKey = `${RedisStorageEnum.CAPTCHA}:${session.tmpId}:${CaptchaTypeEnum.REGISTER}`;
    // 获取缓存值
    const cacheValueString = await redis.get(cacheKey);
    // 如果缓存值不存在，则抛出验证码不存在错误
    if (!cacheValueString) {
      throw BUSINESS_ERROR_CONSTANT.CAPTCHA_VERIFY_NOT_FOUND();
    }

    // 解析缓存值
    const cacheValue = JSON.parse(cacheValueString);
    // 如果缓存 ID 不匹配，则抛出验证码不存在错误
    if (cacheValue.cacheId !== body.cache_id) {
      throw BUSINESS_ERROR_CONSTANT.CAPTCHA_VERIFY_NOT_FOUND();
    }
    // 如果验证码未验证，则抛出验证码错误
    if (!cacheValue.verified) {
      throw BUSINESS_ERROR_CONSTANT.CAPTCHA_VERIFY_FAILED();
    }

    // 注册用户
    await this.userService.registerUser(body);
    // 删除缓存
    redis.del(cacheKey);

    return {
      data: null,
      group: 'user',
      msg: 'user.register.success',
    };
  }
}
