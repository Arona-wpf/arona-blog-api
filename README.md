# arona-blog-api

中文 | [English](./README.en.md)

Aronaの小屋 网站的后端 API 服务。综合性工具集后端，支持抽卡记录管理、用户认证、实时通信等功能。

## 功能特性

### 核心模块

| 模块 | 说明 |
| ---- | ---- |
| **用户系统** | 注册、登录、验证码校验、会话管理、基于角色的权限控制（RBAC） |
| **抽卡记录** | 同步和管理原神、崩坏：星穹铁道、绝区零的抽卡记录。导出为 Excel/JSON/CSV |
| **实时通信** | WebSocket 用于实时日志流推送和抽卡同步进度更新 |
| **后台任务** | BullMQ 队列，用于异步从米游社 API 同步抽卡图鉴 |
| **文件存储** | Minio 本地存储 + 腾讯云 COS 云存储，支持预签名 URL |
| **系统配置** | 基于 MongoDB 持久化的运行时配置管理 |
| **日志** | 结构化日志，通过 WebSocket 实时推送到管理后台 |

### 抽卡记录系统

抽卡模块是核心功能，支持三款米哈游游戏：

- **原神** — 全部卡池（角色活动、武器活动、常驻、集录祈愿）
- **崩坏：星穹铁道** — 全部卡池（角色活动、光锥活动、常驻、 departing 跃迁）
- **绝区零** — 全部卡池（角色活动、音擎活动、常驻、邦布频段）

主要能力：
- 通过游戏 API URL 导入抽卡记录
- 基于 `(game_type, server_region, uid, gacha_id)` 去重
- 按卡池分页同步，通过 WebSocket 推送进度
- 导出为多种格式（Excel xlsx、JSON、CSV）
- 从米游社百科 API 自动同步抽卡图鉴

## 项目架构

| 组成     | 版本                 |
| -------- | -------------------- |
| 框架     | Midway.js 3.20.24    |
| 语言     | TypeScript 5.9.3     |
| 服务器   | Koa 2                |
| 通信协议 | HTTP / WebSocket     |
| 缓存     | Redis 8              |
| 数据库   | MongoDB 7 (mongoose) |
| 文件存储 | Minio / 腾讯云 COS   |
| 任务队列 | BullMQ               |
| 打包工具 | Gulp                 |

## 开发命令

```sh
# 安装依赖
yarn install

# 开发模式（热重载）
yarn dev

# 代码规范检查
yarn lint

# 自动修复代码规范问题
yarn lint:fix

# 生产构建
yarn build

# 运行测试
yarn test
```

**Node.js 要求：** >= 24.0.0（Volta 锁定 24.18.0）

## 架构设计

### 分层结构（src/）

```
configuration.ts          — 应用总装配：注册组件、中间件、过滤器、装饰器处理器
config/                   — 运行时配置（config.default.ts 通用配置 + config.dev.ts 开发环境覆盖）
controller/               — 接口层，按 public-api/private-api/cdn 分区，再按版本号分子目录
  public-api/v1/          — 公开接口：登录、注册、验证码、语言包、用户状态、系统信息
  private-api/v1/         — 私有接口：登出、用户资料、抽卡同步/导出、日志、权限、配置
service/                  — 业务层，负责流程编排与规则判断
  user.service.ts         — 用户注册、登录、资料管理、密码操作
  gacha-record.service.ts — 抽卡记录同步、去重、导出（Excel/JSON/CSV）
  gacha-atlas.service.ts  — 抽卡图鉴管理（角色、武器，来自米游社）
  gacha-config.service.ts — 用户级抽卡配置（authkey、游戏区服）
  gacha-task.service.ts   — 异步抽卡任务管理（启动/停止/进度）
  log.service.ts          — 日志文件列表与 WebSocket 推送
  cos.service.ts          — 腾讯云 COS 临时凭证生成
  minio.service.ts        — Minio 预签名 URL 生成，用于 CDN 访问
dao/                      — 数据访问层，封装 Typegoose 查询，全部继承 BaseDao<T>
entity/                   — MongoDB 集合定义（Typegoose 装饰器）
  user.entity.ts          — 用户账号，含 roles 数组
  role.entity.ts          — 角色定义，含权限 key 列表
  permission.entity.ts    — 权限 key 定义
  gacha-record.entity.ts  — 抽卡记录存储（game_type、uid、gacha_id、物品详情）
  gacha-atlas.entity.ts   — 抽卡图鉴（item_name、icon_url、rank_type、元素/路径等）
  gacha-config.entity.ts  — 用户级抽卡同步配置
  gacha-task.entity.ts    — 异步抽卡同步任务追踪
  config.entity.ts        — 系统运行时配置
socket/                   — WebSocket 控制器，用于实时通信
  websocket.ts            — 处理日志流推送、抽卡同步进度、会话踢出事件
queue/                    — BullMQ 任务队列，用于后台任务处理
  sync-gacha-atlas.ts     — 后台任务：从米游社 API 同步抽卡图鉴
component/                — 自定义组件（upload 白名单控制）
manage/                   — 全局实例静态资源管理（腾讯云 COS）
middleware/               — 请求链路横切逻辑（日志、统一返回、会话处理）
filter/                   — 异常捕获与统一错误响应
decorator/                — 自定义装饰器（如 @Permission）
helper/                   — 带框架上下文的工具（i18n 翻译、路由元数据、Redis 获取、Result 响应）
utils/                    — 纯函数工具（加密、邮件、通用方法）
definition/               — 常量、枚举、类型定义
  constants/              — 运行时常量（业务错误常量）
  enums/                  — 枚举定义（GameType、GachaItemType、RedisStorageEnum）
  types/                  — TypeScript 类型定义（gacha.type、page.type）
locale/                   — 国际化词条（zh/、en/ 目录，按模块分文件）
template/                 — 模板文件（邮件模板，中/英文目录）
typings/                  — 全局类型声明
interface.ts              — 全局接口定义（IUserSession、ICosConfig、IMinioConfig 等）
class/                    — 自定义类（BusinessError、ValidationError）
```

### 严格分层边界

- **Controller** → 接收参数、调用 Service、返回 `{ data, group, msg, redirect }`，不直接操作 DAO
- **Service** → 业务编排、聚合多个 DAO，不拼装 HTTP 响应壳
- **DAO** → 数据库读写，继承 `BaseDao<T>`（提供 `findOne`、`findById`、`findMany` 及 CRUD 封装）
- **Entity** → 仅定义字段和约束，snake_case 命名，含 `_id` / `created_at` / `updated_at`

### API 路由规范

- **公开接口：** `/public-api/v1/...` — 默认不拦截登录态
  - `/public-api/v1/login` — 用户登录
  - `/public-api/v1/register` — 用户注册
  - `/public-api/v1/captcha/image` — 图片验证码
  - `/public-api/v1/captcha/email` — 邮件验证码
  - `/public-api/v1/locale` — 获取语言包
  - `/public-api/v1/user/status` — 检查登录状态
  - `/public-api/v1/system/info` — 系统信息（Node 版本、环境）

- **私有接口：** `/private-api/v1/...` — 必须经过会话中间件校验
  - `/private-api/v1/logout` — 用户登出
  - `/private-api/v1/user/profile` — 获取/更新用户资料
  - `/private-api/v1/user/password` — 修改密码
  - `/private-api/v1/user/list` — 获取用户列表（管理员）
  - `/private-api/v1/gacha/*` — 抽卡同步、导出、配置、任务操作
  - `/private-api/v1/log/*` — 日志文件列表与推送
  - `/private-api/v1/config/*` — 系统配置管理（管理员）
  - `/private-api/v1/role/*` — 角色管理（管理员）
  - `/private-api/v1/permission/*` — 权限管理（管理员）

- **WebSocket：** `/ws` — 需要有效会话 cookie 进行认证
  - `log:subscribe/unsubscribe` — 订阅日志流
  - `gacha:sync-log` — 实时抽卡同步进度
  - `session:kicked` — 会话踢出通知（检测到其他登录）

- 新版本接口在新目录（如 `v2`）新增，禁止在旧版本中做破坏性修改

### 请求-响应链路

**中间件顺序：** `LoggerMiddleware` → `ResultMiddleware` → `SessionMiddleware`

**过滤器顺序：** `ValidateErrorFilter` → `BusinessErrorFilter` → `NotFoundFilter` → `DefaultErrorFilter`

- 成功：Controller 返回 `{ data, group, msg, redirect }` → `ResultMiddleware` 处理：
  - 若 `redirect` 存在 → 执行 HTTP 重定向
  - 若 `redirect` 为空 → 包装为 `{ code: 0, data, msg, success: true }`
- 参数校验失败 → 422
- 业务错误 → `BusinessError`，通过 i18n 翻译后返回
- 未知异常 → 500，记录堆栈日志

### WebSocket 架构

- 连接需要有效会话 cookie（`arona-blog-api.sid`）
- 在 `configuration.ts` 的 `onWebSocketUpgrade` 中进行升级认证
- 从 Redis 解析会话数据，用户信息附加到请求对象
- 基于事件的消息路由：`module:action` 格式（如 `log:init`、`gacha:sync-log`）
- 语言同步：客户端发送 `locale:update`，服务端用于 i18n

### BullMQ 后台任务

- `sync-gacha-atlas` — 定时从米游社 API 同步抽卡图鉴
- 自动更新角色/武器信息，包括图标 URL、元素类型等
- 支持三款游戏（原神、星穹铁道、绝区零）

## 核心编码约定

- **依赖注入：** 类使用 `@Provide()`，依赖使用 `@Inject()`，全部通过 IOC 容器管理
- **参数校验：** DTO 字段使用 `@Rule()`，优先复用 `dto/index.ts` 中的规则工厂。校验失败抛 `ValidationError`
- **业务错误：** 抛 `BusinessError`（通过 `BUSINESS_ERROR_CONSTANT` 生成），由 `BusinessErrorFilter` 经 i18n 翻译后返回
- **国际化：** key 使用点分层级（如 `error.user.not.exist`），每个 key 必须同时存在中英文。Controller 的 `msg`/`group` 必须是 i18n key，禁止硬编码文案
- **权限校验：** Controller 方法使用 `@Permission({ permissionKeys: [...] })` 装饰器，在 `configuration.ts` 注册。管理员角色（`administrator`）直接放行
- **实体规范：** snake_case 字段名，`@modelOptions` 显式声明集合名。`_id`（string，`randomId`）、`created_at`、`updated_at` 为通用字段。`updated_at` 通过 `BaseDao` 自动更新
- **Redis：** 三个客户端通过 `RedisStorageEnum` 枚举区分 — SESSION、CAPTCHA、COS。禁止硬编码字符串
- **CDN：** 通过 `CdnService` 校验 Origin 白名单，支持通配符匹配（如 `*.arona-blog.com`）

### 配置管理

- `config.default.ts` — 所有环境的默认配置
- `config.dev.ts` — 开发环境覆盖配置
- `config.json` — 非敏感静态基础配置（cos、mongo、redis、minio、upload、cdn）
- 敏感值应通过环境变量注入

### 文件上传与存储

上传走 `@midwayjs/upload` 中间件（最大 10MB，白名单扩展名）。使用 Minio（`service/minio.service.ts`）存储到服务器本地。
也支持走云端存储，使用腾讯云 COS，通过生成临时密钥（`service/cos.service.ts`）返回给前端，让前端直传云存储桶。

**上传白名单控制：** `component/upload.component.ts` 动态识别带有 `@File`/`@Files` 装饰器的路由，仅这些路由允许文件存储到临时目录。

### CDN 文件访问

CDN 接口（`/cdn/*`）通过 `CdnService` 校验请求来源 Origin 白名单，支持通配符域名匹配。验证通过后从 Minio 获取预签名 URL（1 小时有效期）并重定向。

## 安全特性

- **密码哈希：** SM3 哈希加盐（国密算法）
- **会话管理：** 基于 Redis 的会话，支持可配置 TTL
- **验证码：** 图片验证码 + 邮件验证码，含冷却时间
- **WebSocket 认证：** 基于会话的升级认证
- **权限控制：** 基于角色的访问控制，提供细粒度权限
- **来源校验：** CDN 校验请求来源白名单

## 代码风格

- 全部使用 TypeScript，2 空格缩进，LF 换行符，UTF-8 编码
- 命名：类名 `PascalCase` + 职责后缀（`UserService`、`UserDao`、`UserEntity`），方法/变量 `camelCase`，常量 `UPPER_SNAKE_CASE`
- 文件名：`kebab-case` + 职责后缀（`user.service.ts`、`not-found.filter.ts`）
- 导入顺序：Node 内置 → 第三方 → `@/` 别名 → 相对路径。仅类型导入使用 `import type`
- 格式以 `mwts` + Prettier 为准
