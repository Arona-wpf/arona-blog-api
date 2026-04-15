# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**arona-blog-api** — 网站后端 API 服务，基于 **Midway.js 3** + **TypeScript** + **Koa 2**，使用 **MongoDB**（Typegoose）和 **Redis**。

## 开发命令

```sh
# 安装依赖
yarn install

# 开发模式（热重载）
yarn dev

# 类型检查 / 代码规范检查
yarn lint

# 自动修复代码规范问题
yarn lint:fix

# 生产构建（编译 TS 并打包为 zip）
yarn build
```

**Node.js 要求：** >= 24.0.0（Volta 锁定 24.14.0）

## 架构设计

### 分层结构（src/）

```
configuration.ts          — 应用总装配：注册组件、中间件、过滤器、装饰器处理器
config/                   — 运行时配置（config.default.ts 通用配置 + config.dev.ts 开发环境覆盖）
controller/               — 接口层，按 public-api/ 和 private-api/ 分区，再按版本号分子目录
service/                  — 业务层，负责流程编排与规则判断
dao/                      — 数据访问层，封装 Typegoose 查询，全部继承 BaseDao<T>
entity/                   — MongoDB 集合定义（Typegoose 装饰器）
dto/                      — 请求参数结构与校验规则（@Rule）
manage/                   — 全局实例静态资源管理（腾讯云COS实例）
middleware/               — 请求链路横切逻辑（日志、统一返回、会话处理）
filter/                   — 异常捕获与统一错误响应
decorator/                — 自定义装饰器（如 @Permission）
helper/                   — 带框架上下文的工具（i18n 翻译、路由元数据、Redis 获取）
utils/                    — 纯函数工具（加密、邮件、通用方法）
definition/               — 常量、枚举、类型定义
locale/                   — 国际化词条（中/英）
template/                 — 邮件等模板文件
```

### 严格分层边界

- **Controller** → 接收参数、调用 Service、返回 `{ data, group, msg }`，不直接操作 DAO
- **Service** → 业务编排、聚合多个 DAO，不拼装 HTTP 响应壳
- **DAO** → 数据库读写，继承 `BaseDao<T>`（提供 `findOne`、`findById`、`findMany` 及 CRUD 封装）
- **Entity** → 仅定义字段和约束，snake_case 命名，含 `_id` / `created_at` / `updated_at`

### API 路由规范

- 公开接口：`/public-api/v1/...` — 默认不拦截登录态
- 私有接口：`/private-api/v1/...` — 必须经过会话中间件校验
- 新版本接口在新目录（如 `v2`）新增，禁止在旧版本中做破坏性修改

### 请求-响应链路

**中间件顺序：** `LoggerMiddleware` → `ResultMiddleware` → `SessionMiddleware`

**过滤器顺序：** `ValidateErrorFilter` → `BusinessErrorFilter` → `NotFoundFilter` → `DefaultErrorFilter`

- 成功：Controller 返回 `{ data, group, msg }` → `ResultMiddleware` 包装为 `{ code: 0, data, msg, success: true }`
- 参数校验失败 → 422
- 业务错误 → `BusinessError`，通过 i18n 翻译后返回
- 未知异常 → 500，记录堆栈日志

### 核心编码约定

- **依赖注入：** 类使用 `@Provide()`，依赖使用 `@Inject()`，全部通过 IOC 容器管理
- **参数校验：** DTO 字段使用 `@Rule()`，优先复用 `dto/index.ts` 中的规则工厂。校验失败抛 `ValidationError`
- **业务错误：** 抛 `BusinessError`（通过 `BUSINESS_ERROR_CONSTANT` 生成），由 `BusinessErrorFilter` 经 i18n 翻译后返回
- **i18n：** key 使用点分层级（如 `error.user.not.exist`），每个 key 必须同时存在中英文。Controller 的 `msg`/`group` 必须是 i18n key，禁止硬编码文案
- **权限校验：** Controller 方法使用 `@Permission({ permissionKeys: [...] })` 装饰器，在 `configuration.ts` 注册。管理员角色（`administrator`）直接放行
- **实体规范：** snake_case 字段名，`@modelOptions` 显式声明集合名。`_id`（string，`randomId`）、`created_at`、`updated_at` 为通用字段。`updated_at` 通过 `BaseDao` 自动更新
- **Redis：** 三个客户端通过 `RedisStorageEnum` 枚举区分 — SESSION、CAPTCHA、COS。禁止硬编码字符串

### 配置管理

- `config.default.ts` — 所有环境的默认配置
- `config.dev.ts` — 开发环境覆盖配置
- `config.json` — 非敏感静态基础配置（cos、mongo、redis、minio、upload）
- 敏感值应通过环境变量注入

### 文件上传

上传走 `@midwayjs/upload` 中间件（最大 10MB，白名单扩展名）。使用 Minio（`service/minio.service.ts`）存储到服务器本地。
也支持走云端存储，使用 腾讯云COS，通过生成临时密钥临时密钥（`service/cos.service.ts`）返回给前端，让前端直传云存储桶。

## 代码风格

- 全部使用 TypeScript，2 空格缩进，LF 换行符，UTF-8 编码
- 命名：类名 `PascalCase` + 职责后缀（`UserService`、`UserDao`、`UserEntity`），方法/变量 `camelCase`，常量 `UPPER_SNAKE_CASE`
- 文件名：`kebab-case` + 职责后缀（`user.service.ts`、`not-found.filter.ts`）
- 导入顺序：Node 内置 → 第三方 → `@/` 别名 → 相对路径。仅类型导入使用 `import type`
- 格式以 `mwts` + Prettier 为准
