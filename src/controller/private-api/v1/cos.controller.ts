import {
  Body,
  Config,
  Controller,
  Inject,
  Post,
  Session,
} from '@midwayjs/core';
import type COS from 'cos-nodejs-sdk-v5';

import {
  CosBucketOperateObjectEnum,
  CosBucketSearchEnum,
} from '@/definition/enums/cos.enum';
import { CosBucketSearchType } from '@/definition/types/cos.type';
import {
  CreateCosFolderDto,
  DeleteCosObjectDto,
  ExistsCosObjectDto,
  GetCosObjectUrlDto,
  ListCosBucketDto,
} from '@/dto/cos.dto';
import { UserEntity } from '@/entity/user.entity';
import { ICosConfig, IUserSession } from '@/interface';
import { CosService } from '@/service/cos.service';

@Controller('/private-api/v1/cos')
export class PriV1CosController {
  @Config('cos')
  cosConfig: ICosConfig;

  @Inject()
  cosService: CosService;

  /**
   * 列出目录内容
   * @param body scope 访问范围 / path 相对路径 / deep 是否递归
   */
  @Post('/list')
  async list(@Body() body: ListCosBucketDto, @Session() session: IUserSession) {
    const { user, isAdmin } = this.resolveUser(session);
    const scope = this.resolveScope(isAdmin);

    const prefix = this.buildListPrefix(scope, user.account, body.path);
    const data = await this.cosService.getBucketData(
      user,
      isAdmin,
      prefix,
      body.deep ?? false
    );

    return {
      data: this.normalizeBucketData(data, prefix),
      group: 'cos',
      msg: 'cos.list.success',
    };
  }

  /**
   * 创建文件夹
   */
  @Post('/folder/create')
  async createFolder(
    @Body() body: CreateCosFolderDto,
    @Session() session: IUserSession
  ) {
    const { user, isAdmin } = this.resolveUser(session);
    const scope = this.resolveScope(isAdmin);

    // 文件夹对象 key 约定带尾斜杠
    const objectKey = `${this.buildObjectKey(scope, user.account, body.path)}/`;

    await this.cosService.createFolder(user, isAdmin, objectKey);

    return {
      data: { key: objectKey },
      group: 'cos',
      msg: 'cos.folder.create.success',
    };
  }

  /**
   * 删除文件或文件夹
   */
  @Post('/delete')
  async delete(
    @Body() body: DeleteCosObjectDto,
    @Session() session: IUserSession
  ) {
    const { user, isAdmin } = this.resolveUser(session);
    const scope = this.resolveScope(isAdmin);

    const baseKey = this.buildObjectKey(scope, user.account, body.path);
    // 文件夹对象 key 带尾斜杠，与创建时的约定一致
    const objectKey =
      body.type === CosBucketOperateObjectEnum.FOLDER ? `${baseKey}/` : baseKey;
    const data = await this.cosService.deleteObject(
      user,
      isAdmin,
      body.type,
      objectKey
    );

    return {
      data,
      group: 'cos',
      msg: 'cos.delete.success',
    };
  }

  /**
   * 判断对象是否存在
   */
  @Post('/exists')
  async exists(
    @Body() body: ExistsCosObjectDto,
    @Session() session: IUserSession
  ) {
    const { user, isAdmin } = this.resolveUser(session);
    const scope = this.resolveScope(isAdmin);

    const objectKey = this.buildObjectKey(scope, user.account, body.path);
    // 兼容文件与文件夹两种形态（文件夹 key 带尾斜杠）
    const exists =
      (await this.cosService.doesObjectExist(user, isAdmin, objectKey)) ||
      (await this.cosService.doesObjectExist(user, isAdmin, `${objectKey}/`));

    return {
      data: { exists },
      group: 'cos',
      msg: 'cos.exists.success',
    };
  }

  /**
   * 获取对象签名访问/下载链接
   */
  @Post('/url')
  async getUrl(
    @Body() body: GetCosObjectUrlDto,
    @Session() session: IUserSession
  ) {
    const { user, isAdmin } = this.resolveUser(session);
    const scope = this.resolveScope(isAdmin);

    const objectKey = this.buildObjectKey(scope, user.account, body.path);
    const url = await this.cosService.getObjectUrlWithSignature(
      user,
      isAdmin,
      objectKey,
      body.expires
    );

    return {
      data: { url },
      group: 'cos',
      msg: 'cos.url.success',
    };
  }

  /**
   * 获取 COS 临时凭证（供前端直传 COS）
   */
  @Post('/credential')
  async credential(@Session() session: IUserSession) {
    const { user, isAdmin } = this.resolveUser(session);
    const data = await this.cosService.getCosCredential(user, isAdmin);

    return {
      data,
      group: 'cos',
      msg: 'cos.credential.success',
    };
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 从 session 解析当前用户上下文
   * CosService 仅读取 account 字段，此处构造最小用户对象
   */
  private resolveUser(session: IUserSession): {
    user: UserEntity;
    isAdmin: boolean;
  } {
    const account = session.user?.account;
    const isAdmin = session.user?.roles?.includes('administrator') ?? false;
    return {
      user: { account } as unknown as UserEntity,
      isAdmin,
    };
  }

  /**
   * 根据角色解析访问范围：管理员 -> 全桶 root，普通用户 -> 个人私有目录 private
   */
  private resolveScope(isAdmin: boolean): CosBucketSearchType {
    return isAdmin ? CosBucketSearchEnum.ROOT : CosBucketSearchEnum.PRIVATE;
  }

  /**
   * 规范化相对路径：去空白、反斜杠转正斜杠、压缩重复分隔符、剔除 . 与 .. 段
   */
  private sanitizePath(path?: string): string {
    if (!path) return '';
    return path
      .trim()
      .replace(/\\/g, '/')
      .split('/')
      .filter(seg => seg !== '' && seg !== '.' && seg !== '..')
      .join('/');
  }

  /**
   * 构建完整对象 key
   * - private -> private/{account}/{path}
   * - public  -> public/{account}/{path}
   * - root    -> {path}（仅管理员）
   */
  private buildObjectKey(
    scope: CosBucketSearchType,
    account: string,
    path?: string
  ): string {
    const normalized = this.sanitizePath(path);

    if (scope === CosBucketSearchEnum.ROOT) {
      return normalized;
    }

    const scopePrefix =
      scope === CosBucketSearchEnum.PRIVATE
        ? this.cosConfig.prefix.private
        : this.cosConfig.prefix.public;
    const base = `${scopePrefix}${account}`;

    return normalized ? `${base}/${normalized}` : base;
  }

  /**
   * 构建目录列表前缀（带尾斜杠，用于 getBucket 的 Prefix 参数）
   */
  private buildListPrefix(
    scope: CosBucketSearchType,
    account: string,
    path?: string
  ): string {
    const key = this.buildObjectKey(scope, account, path);
    if (!key) return '';
    return key.endsWith('/') ? key : `${key}/`;
  }

  /**
   * 将 getBucket 原始结果归一化为前端友好的结构
   */
  private normalizeBucketData(
    data: COS.GetBucketResult,
    prefix: string
  ): {
    folders: string[];
    files: Array<{
      name: string;
      size: number;
      lastModified: string;
      key: string;
    }>;
  } {
    const folders = (data.CommonPrefixes ?? [])
      .map(item => {
        const full = item.Prefix ?? '';
        const relative = full.startsWith(prefix)
          ? full.slice(prefix.length)
          : full;
        return relative.replace(/\/$/, '');
      })
      .filter(name => name !== '');

    const files = (data.Contents ?? [])
      .filter(item => item.Key !== prefix && !item.Key.endsWith('/'))
      .map(item => ({
        name: item.Key.startsWith(prefix)
          ? item.Key.slice(prefix.length)
          : item.Key,
        size: Number(item.Size),
        lastModified: item.LastModified,
        key: item.Key,
      }));

    return { folders, files };
  }
}
