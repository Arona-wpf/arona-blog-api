import '@midwayjs/koa';
import '@midwayjs/ws';
import { IUserSession } from '@/interface';

declare module '@midwayjs/koa' {
  interface State {
    locale: string;
    permissions: string[];
  }
}

declare module '@midwayjs/ws' {
  interface Context {
    user?: IUserSession['user'];
  }
}
