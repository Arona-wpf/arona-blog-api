import '@midwayjs/koa'
import '@midwayjs/ws'
import type { IncomingMessage } from 'http'
import type { WsUserInfo } from '@/definition/types/websocket.type'

declare module 'http' {
  interface IncomingMessage {
    /**
     * WebSocket 用户信息
     * 由认证中间件注入
     */
    wsUser?: WsUserInfo
  }
}

declare module '@midwayjs/koa' {
  interface State {
    locale: string
    permissions: string[]
  }
}

declare module '@midwayjs/ws' {
  interface Context {
    /**
     * WebSocket 用户信息
     * 在连接建立时从 request.wsUser 复制
     */
    user?: WsUserInfo
  }
}
