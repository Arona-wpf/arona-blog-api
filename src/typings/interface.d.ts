import '@midwayjs/koa';

declare module '@midwayjs/koa' {
  interface State {
    locale: string;
    permissions: string[];
  }
}
