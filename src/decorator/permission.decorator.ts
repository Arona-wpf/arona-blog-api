import {
  createCustomMethodDecorator,
  IMethodAspect,
  JoinPoint,
  REQUEST_OBJ_CTX_KEY,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import { ResultHelper } from '@/helper/result.helper';
import { IUserSession } from '@/interface';
import { checkEmpty } from '@/utils/common';

export const PERMISSION_KEY = 'decorator:permission';

/**
 * 定义权限校验装饰器
 * @param options 配置参数
 * @returns 方法装饰器
 */
export const Permission = (options?: {
  permissionKeys: string[];
}): MethodDecorator => {
  return createCustomMethodDecorator(PERMISSION_KEY, options);
};

/**
 * 权限校验注册函数
 * @returns
 */
export function registerPermissionMethod(options: {
  target: new (...args: any[]) => any;
  propertyName: string;
  metadata: { permissionKeys: string[] };
}): IMethodAspect {
  return {
    around: async (joinPoint: JoinPoint) => {
      const { metadata } = options;
      // 如果权限代码为空，直接放行
      if (checkEmpty(metadata.permissionKeys)) {
        return await joinPoint.proceed(...joinPoint.args);
      }

      const instance = joinPoint.target;
      const ctx: Context = instance[REQUEST_OBJ_CTX_KEY];

      const session = ctx.session as IUserSession;
      const userPermissions = session.user?.permissions ?? [];
      // 如果角色里包含administrator，直接放行
      if (session.user.roles.includes('administrator')) {
        return await joinPoint.proceed(...joinPoint.args);
      }
      // 如果接口鉴权的权限列表是用户权限列表的子集，放行
      if (metadata.permissionKeys.every(key => userPermissions.includes(key))) {
        return await joinPoint.proceed(...joinPoint.args);
      }

      const resultHelper = await ctx.requestContext.getAsync(ResultHelper);
      ctx.status = 401;
      ctx.body = {
        code: 401,
        msg: resultHelper.translate('unauthorized'),
        success: false,
      };
      return;
    },
  };
}
