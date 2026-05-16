import '@midwayjs/koa';
import '@midwayjs/ws';
import { WsUserInfo } from '@/definition/types/log.type';

declare module '@midwayjs/koa' {
  interface State {
    locale: string;
    permissions: string[];
  }
}

declare module '@midwayjs/ws' {
  interface Context {
    user?: WsUserInfo;
  }
}
