import { Inject, Provide } from '@midwayjs/core';

import { TechStackDao } from '@/dao/tech-stack.dao';
import { CreateTechStackDto, UpdateTechStackDto } from '@/dto/tech-stack.dto';
import { TechStackEntity } from '@/entity/tech-stack.entity';

import { CounterService } from './counter.service';

@Provide()
export class TechStackService {
  @Inject()
  techStackDao: TechStackDao;

  @Inject()
  counterService: CounterService;

  /**
   * 创建技术栈项
   * @param data 技术栈创建参数
   * @returns 新建后的技术栈实体
   */
  async createTechStack(data: CreateTechStackDto) {
    const techStackSeq =
      await this.counterService.getEntityNextSequence('tech_stack');

    const techStackEntity = new TechStackEntity();
    Object.assign(techStackEntity, data);
    techStackEntity.seq = techStackSeq;

    return this.techStackDao.createOne(techStackEntity);
  }

  /**
   * 更新技术栈项
   * @param data 技术栈更新参数
   * @returns 更新后的技术栈实体
   */
  async updateTechStack(data: UpdateTechStackDto) {
    const { _id, ...updateData } = data;
    return this.techStackDao.findByIdAndUpdate(_id, updateData);
  }

  /**
   * 删除技术栈项
   * @param _id 技术栈id
   * @returns 删除结果
   */
  async deleteTechStack(_id: string) {
    return this.techStackDao.findByIdAndDelete(_id);
  }

  /**
   * 获取技术栈详情
   * @param _id 技术栈id
   * @returns 技术栈详情
   */
  async getTechStackById(_id: string) {
    return this.techStackDao.findById(_id);
  }

  /**
   * 获取技术栈列表
   * @param currentPage 当前页
   * @param pageSize 每页条数
   * @param queryCondition 查询条件
   * @returns 技术栈列表
   */
  async getTechStackList(
    currentPage: number,
    pageSize: number,
    queryCondition: Record<string, any> = {}
  ) {
    const list = await this.techStackDao.findMany(
      queryCondition,
      currentPage,
      pageSize,
      undefined,
      { seq: -1 }
    );
    const total = await this.techStackDao.count(queryCondition);
    return { list, total };
  }
}
