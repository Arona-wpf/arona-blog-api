# arona-blog-api

🌍 English | [中文](./README.zh-CN.md)

Backend API service for Arona's personal blog. A comprehensive toolkit backend supporting gacha record management, user authentication, real-time communication, and more.

## Features

### Core Modules

| Module | Description |
| ------ | ----------- |
| **User System** | Registration, login, captcha verification, session management, role-based permissions (RBAC) |
| **Gacha Records** | Sync and manage gacha records for Genshin Impact, Honkai: Star Rail, and Zenless Zone Zero. Export to Excel/JSON/CSV |
| **Real-time Communication** | WebSocket for live log streaming and gacha sync progress updates |
| **Background Tasks** | BullMQ queue for async gacha atlas synchronization from Miyoushe API |
| **File Storage** | Minio local storage + Tencent COS cloud storage with presigned URL support |
| **System Config** | Runtime configuration management with MongoDB persistence |
| **Logging** | Structured logging with real-time WebSocket streaming for admin dashboard |

### Gacha Record System

The gacha module is the core feature, supporting three miHoYo games:

- **Genshin Impact** — All gacha pools (Character Event, Weapon Event, Standard, Chronicled Wish)
- **Honkai: Star Rail** — All gacha pools (Character Event, Light Cone Event, Standard, Departure Warp)
- **Zenless Zone Zero** — All gacha pools (Character Event, Weapon Event, Standard, Bangboo)

Key capabilities:
- Import gacha records via game API URL
- Deduplication by `(game_type, server_region, uid, gacha_id)`
- Pool-based pagination sync with progress streaming via WebSocket
- Export to multiple formats (Excel xlsx, JSON, CSV)
- Gacha atlas auto-sync from Miyoushe encyclopedia API

## Project Architecture

| Component    | Version              |
| ------------ | -------------------- |
| Framework    | Midway.js 3.20.24    |
| Language     | TypeScript 5.9.3     |
| Server       | Koa 2                |
| Protocol     | HTTP / WebSocket     |
| Cache        | Redis 8              |
| Database     | MongoDB 7 (mongoose) |
| File Storage | Minio / Tencent COS  |
| Task Queue   | BullMQ               |
| Build Tool   | Gulp                 |

## Development Commands

```sh
# Install dependencies
yarn install

# Development mode (hot reload)
yarn dev

# Type check / Lint
yarn lint

# Auto-fix lint issues
yarn fix

# Production build
yarn build

# Run tests
yarn test
```

**Node.js Requirement:** >= 24.0.0 (Volta locked at 24.14.0)

## Architecture Design

### Directory Structure (src/)

```
configuration.ts          — Application assembly: register components, middleware, filters, decorators
config/                   — Runtime config (config.default.ts + config.dev.ts overlay)
controller/               — API layer, partitioned by public-api/private-api/cdn, versioned subdirs
  public-api/v1/          — Public APIs: login, register, captcha, locale, user status, system info
  private-api/v1/         — Private APIs: logout, user profile, gacha sync/export, logs, permissions, config
service/                  — Business layer, orchestrates flows and rules
  user.service.ts         — User registration, login, profile management, password operations
  gacha-record.service.ts — Gacha record sync, deduplication, export (Excel/JSON/CSV)
  gacha-atlas.service.ts  — Gacha item atlas management (characters, weapons from Miyoushe)
  gacha-config.service.ts — Per-user gacha config (authkey, game regions)
  gacha-task.service.ts   — Async gacha task management (start/stop/progress)
  log.service.ts          — Log file listing and WebSocket streaming
  cos.service.ts          — Tencent COS temp credential generation
  minio.service.ts        — Minio presigned URL generation for CDN access
dao/                      — Data access layer, wraps Typegoose queries, inherits BaseDao<T>
entity/                   — MongoDB collection definitions (Typegoose decorators)
  user.entity.ts          — User accounts with roles array
  role.entity.ts          — Role definitions with permission keys
  permission.entity.ts    — Permission key definitions
  gacha-record.entity.ts  — Gacha record storage (game_type, uid, gacha_id, item details)
  gacha-atlas.entity.ts   — Gacha item atlas (item_name, icon_url, rank_type, element/path/etc)
  gacha-config.entity.ts  — Per-user gacha sync configuration
  gacha-task.entity.ts    — Async gacha sync task tracking
  config.entity.ts        — System runtime configuration
socket/                   — WebSocket controllers for real-time communication
  websocket.ts            — Handles log streaming, gacha sync progress, session kick events
queue/                    — BullMQ job queues for background task processing
  sync-gacha-atlas.ts     — Background job: sync gacha atlas from Miyoushe API
component/                — Custom components (upload whitelist control)
manage/                   — Global instance static resource management (Tencent COS)
middleware/               — Request chain cross-cutting logic (logging, response wrapper, session)
filter/                   — Exception capture and unified error response
decorator/                — Custom decorators (e.g., @Permission)
helper/                   — Framework-context utilities (i18n, route metadata, Redis, Result response)
utils/                    — Pure function utilities (crypto, email, common methods)
definition/               — Constants, enums, type definitions
  constants/              — Runtime constants (business error constants)
  enums/                  — Enum definitions (GameType, GachaItemType, RedisStorageEnum)
  types/                  — TypeScript type definitions (gacha.type, page.type)
locale/                   — i18n translations (zh/, en/ directories, module-based files)
template/                 — Template files (email templates in zh/en dirs)
typings/                  — Global type declarations
interface.ts              — Global interface definitions (IUserSession, ICosConfig, IMinioConfig, etc.)
class/                    — Custom classes (BusinessError, ValidationError)
```

### Strict Layered Boundary

- **Controller** → Receives params, calls Service, returns `{ data, group, msg, redirect }`, never touches DAO directly
- **Service** → Business orchestration, aggregates multiple DAOs, never assembles HTTP response shell
- **DAO** → Database CRUD, inherits `BaseDao<T>` (provides `findOne`, `findById`, `findMany` and CRUD wrappers)
- **Entity** → Only defines fields and constraints, snake_case naming, includes `_id` / `created_at` / `updated_at`

### API Route Convention

- **Public API:** `/public-api/v1/...` — No login required by default
  - `/public-api/v1/login` — User login
  - `/public-api/v1/register` — User registration
  - `/public-api/v1/captcha/image` — Image captcha
  - `/public-api/v1/captcha/email` — Email captcha
  - `/public-api/v1/locale` — Get locale translations
  - `/public-api/v1/user/status` — Check login status
  - `/public-api/v1/system/info` — System info (node version, env)

- **Private API:** `/private-api/v1/...` — Must pass session middleware validation
  - `/private-api/v1/logout` — User logout
  - `/private-api/v1/user/profile` — Get/update user profile
  - `/private-api/v1/user/password` — Change password
  - `/private-api/v1/user/list` — Get user list (admin)
  - `/private-api/v1/gacha/*` — Gacha sync, export, config, task operations
  - `/private-api/v1/log/*` — Log file listing and streaming
  - `/private-api/v1/config/*` — System config management (admin)
  - `/private-api/v1/role/*` — Role management (admin)
  - `/private-api/v1/permission/*` — Permission management (admin)

- **WebSocket:** `/ws` — Requires valid session cookie for authentication
  - `log:subscribe/unsubscribe` — Subscribe to log streaming
  - `gacha:sync-log` — Real-time gacha sync progress
  - `session:kicked` — Session kicked notification (another login detected)

- New version APIs go in new directories (e.g., `v2`), never make breaking changes in old versions

### Request-Response Chain

**Middleware Order:** `LoggerMiddleware` → `ResultMiddleware` → `SessionMiddleware`

**Filter Order:** `ValidateErrorFilter` → `BusinessErrorFilter` → `NotFoundFilter` → `DefaultErrorFilter`

- Success: Controller returns `{ data, group, msg, redirect }` → `ResultMiddleware` processes:
  - If `redirect` exists → HTTP redirect
  - If `redirect` empty → wraps to `{ code: 0, data, msg, success: true }`
- Param validation fail → 422
- Business error → `BusinessError`, translated via i18n before returning
- Unknown exception → 500, stack trace logged

### WebSocket Architecture

- Connection requires valid session cookie (`arona-blog-api.sid`)
- Upgrade authentication in `configuration.ts` `onWebSocketUpgrade`
- Session data parsed from Redis, user info attached to request object
- Event-based message routing: `module:action` format (e.g., `log:init`, `gacha:sync-log`)
- Locale sync: client sends `locale:update`, server uses for i18n

### BullMQ Background Tasks

- `sync-gacha-atlas` — Scheduled job to sync gacha item atlas from Miyoushe API
- Auto-updates character/weapon info including icon URLs, element types, etc.
- Supports all three games (Genshin, Star Rail, ZZZ)

## Core Coding Conventions

- **Dependency Injection:** Classes use `@Provide()`, dependencies use `@Inject()`, all managed by IOC container
- **Param Validation:** DTO fields use `@Rule()`, prefer reusing rule factories from `dto/index.ts`. Validation fail throws `ValidationError`
- **Business Error:** Throw `BusinessError` (generated via `BUSINESS_ERROR_CONSTANT`), translated by `BusinessErrorFilter` via i18n
- **i18n:** Key uses dot hierarchy (e.g., `error.user.not.exist`), each key must exist in both zh/en. Controller's `msg`/`group` must be i18n keys, no hardcoded text
- **Permission Check:** Controller methods use `@Permission({ permissionKeys: [...] })` decorator, registered in `configuration.ts`. Admin role (`administrator`) bypasses
- **Entity Spec:** snake_case field names, `@modelOptions` explicitly declares collection name. `_id` (string, `randomId`), `created_at`, `updated_at` are common fields. `updated_at` auto-updated via `BaseDao`
- **Redis:** Three clients distinguished by `RedisStorageEnum` — SESSION, CAPTCHA, COS. No hardcoded strings
- **CDN:** Validates Origin whitelist via `CdnService`, supports wildcard matching (e.g., `*.arona-blog.com`)

### Configuration Management

- `config.default.ts` — Default config for all environments
- `config.dev.ts` — Development environment overlay config
- `config.json` — Non-sensitive static base config (cos, mongo, redis, minio, upload, cdn)
- Sensitive values should be injected via environment variables

### File Upload & Storage

Upload goes through `@midwayjs/upload` middleware (max 10MB, whitelist extensions). Uses Minio (`service/minio.service.ts`) to store locally.
Also supports cloud storage via Tencent COS, generates temp credentials (`service/cos.service.ts`) for frontend direct upload.

**Upload Whitelist Control:** `component/upload.component.ts` dynamically recognizes routes with `@File`/`@Files` decorators, only these routes allow file storage to temp directory.

### CDN File Access

CDN API (`/cdn/*`) validates request Origin whitelist via `CdnService`, supports wildcard domain matching. After validation, gets presigned URL from Minio (1 hour expiry) and redirects.

## Security Features

- **Password Hashing:** SM3 hash with salt (国密算法)
- **Session Management:** Redis-backed session with configurable TTL
- **Captcha:** Image captcha + Email captcha with cooldown
- **WebSocket Auth:** Session-based upgrade authentication
- **Permission Control:** Role-based access control with granular permissions
- **Origin Validation:** CDN validates request origin whitelist

## Code Style

- All TypeScript, 2-space indent, LF line ending, UTF-8 encoding
- Naming: Class `PascalCase` + role suffix (`UserService`, `UserDao`, `UserEntity`), method/variable `camelCase`, constant `UPPER_SNAKE_CASE`
- Filename: `kebab-case` + role suffix (`user.service.ts`, `not-found.filter.ts`)
- Import order: Node built-in → Third-party → `@/` alias → Relative. Type-only imports use `import type`
- Format follows `mwts` + Prettier