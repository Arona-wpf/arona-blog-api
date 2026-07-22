import { Inject, Provide } from '@midwayjs/core';

import { PermissionDao } from '@/dao/permission.dao';
import { RoleDao } from '@/dao/role.dao';
import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { IPageResult } from '@/definition/types/page.type';
import {
  CreatePermissionDto,
  DeletePermissionDto,
  GetPermissionListDto,
  UpdatePermissionDto,
} from '@/dto/permission.dto';
import { PermissionEntity } from '@/entity/permission.entity';

@Provide()
export class PermissionService {
  @Inject()
  permissionDao: PermissionDao;

  @Inject()
  roleDao: RoleDao;

  /**
   * 根据权限 ID 列表构建权限映射
   * @param permissionIds 权限ID列表
   * @returns key 为权限ID的映射表
   */
  async getPermissionMap(
    permissionIds: string[]
  ): Promise<Map<string, PermissionEntity>> {
    if (!permissionIds.length) {
      return new Map<string, PermissionEntity>();
    }
    const permissionList = await this.permissionDao.findMany(
      { _id: { $in: permissionIds } },
      1,
      permissionIds.length,
      undefined,
      { _id: 1 }
    );
    return new Map(
      permissionList.map(permission => [permission._id, permission])
    );
  }

  /**
   * 创建权限
   * @param data 权限创建参数
   * @returns 新建后的权限实体
   */
  async createPermission(data: CreatePermissionDto) {
    const duplicate = await this.permissionDao.findOne({
      $or: [{ name: data.name }, { code: data.code }],
    });
    if (duplicate) {
      throw BUSINESS_ERROR_CONSTANT.PERMISSION_ALREADY_EXISTS();
    }

    const permissionEntity = new PermissionEntity();
    Object.assign(permissionEntity, data);
    return this.permissionDao.createOne(permissionEntity);
  }

  /**
   * 删除权限（若被角色使用则不允许删除）
   * @param data 删除参数
   * @returns 固定返回 null
   */
  async deletePermission(data: DeletePermissionDto) {
    const { _id } = data;
    const permission = await this.permissionDao.findById(_id);
    if (!permission) {
      throw BUSINESS_ERROR_CONSTANT.PERMISSION_NOT_EXIST();
    }

    const roleCount = await this.roleDao.count({
      $or: [{ api_permissions: _id }, { menu_permissions: _id }],
    });
    if (roleCount > 0) {
      throw BUSINESS_ERROR_CONSTANT.PERMISSION_IN_USE();
    }

    await this.permissionDao.findByIdAndDelete(_id);
    return null;
  }

  /**
   * 更新权限
   * @param data 更新参数
   * @returns 更新后的权限
   */
  async updatePermission(data: UpdatePermissionDto) {
    const { _id, ...updateData } = data;
    const permission = await this.permissionDao.findById(_id);
    if (!permission) {
      throw BUSINESS_ERROR_CONSTANT.PERMISSION_NOT_EXIST();
    }

    // 检查名称是否与其他权限重复
    if (data.name && data.name !== permission.name) {
      const duplicate = await this.permissionDao.findOne({ name: data.name });
      if (duplicate) {
        throw BUSINESS_ERROR_CONSTANT.PERMISSION_ALREADY_EXISTS();
      }
    }

    return this.permissionDao.findByIdAndUpdate(_id, { $set: updateData });
  }

  /**
   * 分页查询权限列表
   * @param data 查询参数
   * @returns 权限分页结果
   */
  async getPermissionList(
    data: GetPermissionListDto
  ): Promise<IPageResult<PermissionEntity>> {
    const { current_page, page_size, group, type, action } = data;
    const query: Record<string, any> = {};
    if (group) {
      query.group = group;
    }
    if (type) {
      query.type = type;
    }
    if (action) {
      query.action = action;
    }

    const [list, total] = await Promise.all([
      this.permissionDao.findMany(query, current_page, page_size, undefined, {
        _id: 1,
      }),
      this.permissionDao.count(query),
    ]);

    return {
      list,
      total,
      current_page,
      page_size,
    };
  }
}
