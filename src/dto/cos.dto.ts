import { Rule } from '@midwayjs/validate';

import { CosBucketOperateObjectEnum } from '@/definition/enums/cos.enum';
import { CosBucketOperateObjectType } from '@/definition/types/cos.type';

import {
  createBooleanRuleType,
  createNumberRuleType,
  createStringRuleType,
} from '.';

/**
 * 列出目录内容 DTO。path 为相对于访问范围根目录的相对路径，空表示根目录。
 */
export class ListCosBucketDto {
  @Rule(createStringRuleType('cos.path', false, 'cos'))
  path?: string;

  @Rule(createBooleanRuleType('cos.deep', false, 'cos'))
  deep?: boolean;
}

/**
 * 创建文件夹 DTO。path 为待创建文件夹的相对路径（含文件夹名）。
 */
export class CreateCosFolderDto {
  @Rule(createStringRuleType('cos.path', true, 'cos', { min: 1 }))
  path: string;
}

/**
 * 删除对象 DTO。type：folder-文件夹 / file-文件。
 */
export class DeleteCosObjectDto {
  @Rule(createStringRuleType('cos.path', true, 'cos', { min: 1 }))
  path: string;

  @Rule(
    createStringRuleType('cos.type', true, 'cos', {
      enum: Object.values(CosBucketOperateObjectEnum),
    })
  )
  type: CosBucketOperateObjectType;
}

/**
 * 判断对象是否存在 DTO。
 */
export class ExistsCosObjectDto {
  @Rule(createStringRuleType('cos.path', true, 'cos', { min: 1 }))
  path: string;
}

/**
 * 获取对象签名链接 DTO。
 */
export class GetCosObjectUrlDto {
  @Rule(createStringRuleType('cos.path', true, 'cos', { min: 1 }))
  path: string;

  @Rule(
    createNumberRuleType('cos.expires', false, 'cos', {
      min: 60,
      max: 604800,
      integer: true,
    })
  )
  expires?: number;
}
