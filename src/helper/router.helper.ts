import {
  attachClassMetadata,
  getClassMetadata,
  Init,
  Inject,
  MidwayWebRouterService,
  Provide,
  RouterInfo,
  RouterPriority,
  Singleton,
} from '@midwayjs/core';

@Provide()
@Singleton()
export class RouterHelper {
  @Inject()
  webRouterService: MidwayWebRouterService;

  public routePriorityList: RouterPriority[];
  public routerTable: Map<string, RouterInfo[]>;

  static createClassMetadata(
    decoratorKey: string,
    target: any,
    propertyKey: string
  ) {
    attachClassMetadata(
      decoratorKey,
      {
        target,
        propertyKey,
      },
      target
    );
  }

  @Init()
  async init() {
    this.routePriorityList = await this.webRouterService.getRoutePriorityList();
    this.routerTable = await this.webRouterService.getRouterTable();
  }

  getPathByClassMetadata(decoratorKey: string) {
    const path: string[] = [];
    this.routePriorityList.forEach(rpl => {
      const metaData = getClassMetadata(decoratorKey, rpl.routerModule);
      if (!metaData?.length) {
        return;
      }
      const isControllerDecorator = metaData.some(md => !md.propertyKey);
      if (isControllerDecorator) {
        path.push(rpl.prefix);
      } else {
        const routerInfoArr = this.routerTable.get(rpl.prefix);
        if (!routerInfoArr?.length) {
          return;
        }
        metaData.forEach(md => {
          const matchRouterInfo = routerInfoArr.find(
            ri => ri.method === md.propertyKey
          );
          if (!matchRouterInfo) {
            return;
          }
          if (matchRouterInfo.fullUrl) {
            path.push(matchRouterInfo.fullUrl);
          }
        });
      }
    });
    return path;
  }
}
