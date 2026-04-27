import {
  Configuration,
  getClassMetadata,
  ILifeCycle,
  Inject,
  INJECT_CUSTOM_PARAM,
  Logger,
  MidwayConfigService,
  MidwayWebRouterService,
  RouteParamTypes,
  RouterInfo,
  RouterPriority,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { ILogger } from '@midwayjs/logger';
import * as upload from '@midwayjs/upload';
import { flatten } from 'lodash';

/**
 * midway组件，非@File和@Files修饰的接口不存放文件到/tmp
 */
@Configuration({
  imports: [upload],
  importConfigs: [],
})
class UploadConfiguration implements ILifeCycle {
  @Inject()
  midwayConfigService: MidwayConfigService;

  @Logger()
  logger: ILogger;

  @Inject()
  webRouterService: MidwayWebRouterService;

  public routePriorityList: RouterPriority[];

  public routerTable: Map<string, RouterInfo[]>;

  async onConfigLoad() {
    await this.getRouterInfo();
    await this.injectUpload();
  }

  async getRouterInfo() {
    // 串行，否则报错
    this.routePriorityList = await this.webRouterService.getRoutePriorityList();
    this.routerTable = await this.webRouterService.getRouterTable();
  }

  /**
   * 处理使用upload标记的路由，对这些路由进行放过，其余不允许存储到/tmp
   */
  async injectUpload() {
    const whiteUploadList: string[] = [];
    this.routePriorityList.forEach(rpl => {
      const metaData = getClassMetadata(INJECT_CUSTOM_PARAM, rpl.routerModule);
      if (!metaData) {
        return;
      }
      const uploadMethodParamMetas = flatten(Object.values(metaData)).filter(
        (md: any) =>
          md.metadata?.type === RouteParamTypes.FILESTREAM ||
          md.metadata?.type === RouteParamTypes.FILESSTREAM ||
          md.metadata?.type === RouteParamTypes.FIELDS
      );
      if (!uploadMethodParamMetas?.length) {
        return;
      }
      const routerInfos = this.routerTable.get(rpl.prefix);
      const uploadInfos = routerInfos?.filter(routerInfo =>
        uploadMethodParamMetas.find(
          (md: any) => md.propertyName === routerInfo.method
        )
      );
      uploadInfos?.forEach(ui => {
        if (ui.fullUrl) {
          whiteUploadList.push(ui.fullUrl);
        }
      });
    });
    const config = {
      upload: {
        match: (ctx: Context) => {
          return whiteUploadList.some(wu => {
            return new RegExp(
              `^${wu.replace(/:[^\s/]+/g, '([^/]+)')}(\\?.*)?$`
            ).test(ctx.path);
          });
        },
      },
    };
    this.midwayConfigService.addObject(config);
  }
}

export { UploadConfiguration as Configuration };
