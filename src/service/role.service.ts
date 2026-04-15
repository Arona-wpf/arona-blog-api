import { Inject, Provide } from '@midwayjs/core';
import { uniq } from 'lodash';

import { PermissionDao } from '@/dao/permission.entity';
import { RoleDao } from '@/dao/role.dao';
import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { PermissionTypeEnum } from '@/definition/enums/permission.enum';
import { IPageResult } from '@/definition/types/page.type';
import {
  CreateRoleDto,
  DeleteRoleDto,
  GetRoleListDto,
  UpdateRoleDto,
} from '@/dto/role.dto';
import { RoleEntity } from '@/entity/role.entity';

import { CounterService } from './counter.service';
import { PermissionService } from './permission.service';
import { UserService } from './user.service';

@Provide()
export class RoleService {
  @Inject()
  roleDao: RoleDao;

  @Inject()
  permissionDao: PermissionDao;

  @Inject()
  counterService: CounterService;

  @Inject()
  permissionService: PermissionService;

  @Inject()
  userService: UserService;

  /**
   * 根据角色 ID 列表构建角色映射
   * @param roleIds 角色ID列表
   * @returns key 为角色ID的映射表
   */
  async getRoleMap(roleIds: string[]): Promise<Map<string, RoleEntity>> {
    if (!roleIds.length) {
      return new Map<string, RoleEntity>();
    }
    const roleList = await this.roleDao.findMany(
      { _id: { $in: roleIds } },
      1,
      roleIds.length,
      undefined,
      { seq: 1, _id: 1 }
    );
    return new Map(roleList.map(role => [role._id, role]));
  }

  /**
   * 查询角色及其关联权限映射
   * @param roleIds 角色ID列表
   * @returns 角色映射与权限映射
   */
  async getRoleAndPermissionMap(roleIds: string[]) {
    const roleMap = await this.getRoleMap(roleIds);
    const permissionIds = uniq(
      Array.from(roleMap.values()).flatMap(role => [
        ...(role.api_permissions ?? []),
        ...(role.menu_permissions ?? []),
      ])
    );
    const permissionMap =
      await this.permissionService.getPermissionMap(permissionIds);
    return { roleMap, permissionMap };
  }

  /**
   * 统计指定角色 ID 列表中存在的角色数量
   * @param roleIds 角色ID列表
   * @returns 角色数量
   */
  async countRolesByIds(roleIds: string[]) {
    if (!roleIds.length) {
      return 0;
    }
    return this.roleDao.count({ _id: { $in: roleIds } });
  }

  /**
   * 校验权限 ID 是否全部存在且类型匹配
   * @param permissionIds 权限ID列表
   * @param type 权限类型
   */
  private async validatePermissionIds(permissionIds: string[], type: string) {
    if (!permissionIds.length) {
      return;
    }
    const count = await this.permissionDao.count({
      _id: { $in: permissionIds },
      type,
    });
    if (count !== permissionIds.length) {
      throw BUSINESS_ERROR_CONSTANT.ROLE_PERMISSION_NOT_EXIST();
    }
  }

  /**
   * 创建角色
   * @param data 角色创建参数
   * @returns 新建后的角色实体
   */
  async createRole(data: CreateRoleDto) {
    const duplicate = await this.roleDao.findOne({
      $or: [{ name: data.name }, { code: data.code }],
    });
    if (duplicate) {
      throw BUSINESS_ERROR_CONSTANT.ROLE_ALREADY_EXISTS();
    }

    const apiPermissions = uniq(data.api_permissions ?? []);
    const menuPermissions = uniq(data.menu_permissions ?? []);
    await Promise.all([
      this.validatePermissionIds(apiPermissions, PermissionTypeEnum.API),
      this.validatePermissionIds(menuPermissions, PermissionTypeEnum.MENU),
    ]);

    const roleSeq = await this.counterService.getEntityNextSequence('role');
    const roleEntity = new RoleEntity();
    Object.assign(roleEntity, data, {
      api_permissions: apiPermissions,
      menu_permissions: menuPermissions,
      seq: roleSeq,
    });
    return this.roleDao.createOne(roleEntity);
  }

  /**
   * 更新角色权限配置
   * @param data 角色更新参数
   * @returns 更新后的角色
   */
  async updateRole(data: UpdateRoleDto) {
    const { _id } = data;
    const role = await this.roleDao.findById(_id);
    if (!role) {
      throw BUSINESS_ERROR_CONSTANT.ROLE_NOT_EXIST();
    }

    const updateSet: Record<string, any> = {};
    if (data.api_permissions) {
      const apiPermissions = uniq(data.api_permissions);
      await this.validatePermissionIds(apiPermissions, PermissionTypeEnum.API);
      updateSet.api_permissions = apiPermissions;
    }
    if (data.menu_permissions) {
      const menuPermissions = uniq(data.menu_permissions);
      await this.validatePermissionIds(
        menuPermissions,
        PermissionTypeEnum.MENU
      );
      updateSet.menu_permissions = menuPermissions;
    }

    return this.roleDao.findByIdAndUpdate(_id, { $set: updateSet });
  }

  /**
   * 删除角色（若被用户使用则不允许删除）
   * @param data 删除参数
   * @returns 固定返回 null
   */
  async deleteRole(data: DeleteRoleDto) {
    const { _id } = data;
    const role = await this.roleDao.findById(_id);
    if (!role) {
      throw BUSINESS_ERROR_CONSTANT.ROLE_NOT_EXIST();
    }

    const userCount = await this.userService.countUsersByRoleId(_id);
    if (userCount > 0) {
      throw BUSINESS_ERROR_CONSTANT.ROLE_IN_USE();
    }

    await this.roleDao.findByIdAndDelete(_id);
    return null;
  }

  /**
   * 分页查询角色列表
   * @param data 查询参数
   * @returns 角色分页结果
   */
  async getRoleList(data: GetRoleListDto): Promise<IPageResult<RoleEntity>> {
    const { current_page, page_size, code, start_at, end_at } = data;
    const query: Record<string, any> = {};
    if (code) {
      query.code = code;
    }
    if (start_at || end_at) {
      query.created_at = {};
      if (start_at) {
        query.created_at.$gte = start_at;
      }
      if (end_at) {
        query.created_at.$lte = end_at;
      }
    }

    const [list, total] = await Promise.all([
      this.roleDao.findMany(query, current_page, page_size, undefined, {
        seq: 1,
        _id: 1,
      }),
      this.roleDao.count(query),
    ]);

    return {
      list,
      total,
      current_page,
      page_size,
    };
  }
}
