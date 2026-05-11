# arona-blog-api

🌍 English | [中文](./README.zh-CN.md)

Backend API service for Arona's personal blog. Features are still being developed gradually...

## Project Architecture

| Component | Version |
|-----------|---------|
| Framework | Midway.js 3 |
| Language | TypeScript 5.9.3 |
| Server | Koa 2 |
| Protocol | HTTP / WebSocket |
| Cache | Redis (koa-redis) |
| Database | MongoDB 8 (mongoose) |
| File Storage | Minio / Tencent COS |
| Build Tool | Gulp |

## Development Commands

```sh
# Install dependencies
yarn install

# Development mode (hot reload)
yarn dev

# Type check / Lint
yarn lint

# Auto-fix lint issues
yarn lint:fix

# Production build
yarn build
```

**Node.js Requirement:** >= 24.0.0 (Volta locked at 24.14.0)

## Architecture Design

### Directory Structure (src/)

```
configuration.ts          — Application assembly: register components, middleware, filters, decorators
config/                   — Runtime config (config.default.ts + config.dev.ts overlay)
controller/               — API layer, partitioned by public-api/private-api/cdn, versioned subdirs
service/                  — Business layer, orchestrates flows and rules
dao/                      — Data access layer, wraps Typegoose queries, inherits BaseDao<T>
entity/                   — MongoDB collection definitions (Typegoose decorators)
dto/                      — Request param structures and validation rules (@Rule)
component/                — Custom components (upload whitelist control)
manage/                   — Global instance static resource management (Tencent COS)
middleware/               — Request chain cross-cutting logic (logging, response wrapper, session)
filter/                   — Exception capture and unified error response
decorator/                — Custom decorators (e.g., @Permission)
helper/                   — Framework-context utilities (i18n, route metadata, Redis, Result response)
utils/                    — Pure function utilities (crypto, email, common methods)
websocket/                — WebSocket controllers for real-time communication
definition/               — Constants, enums, type definitions
  constants/              — Runtime constants (business error constants)
  enums/                  — Enum definitions
  types/                  — TypeScript type definitions
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

- Public API: `/public-api/v1/...` — No login required by default
- Private API: `/private-api/v1/...` — Must pass session middleware validation
- CDN API: `/cdn/...` — File access proxy, no login check, validates Origin whitelist
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

### Core Coding Conventions

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

## Code Style

- All TypeScript, 2-space indent, LF line ending, UTF-8 encoding
- Naming: Class `PascalCase` + role suffix (`UserService`, `UserDao`, `UserEntity`), method/variable `camelCase`, constant `UPPER_SNAKE_CASE`
- Filename: `kebab-case` + role suffix (`user.service.ts`, `not-found.filter.ts`)
- Import order: Node built-in → Third-party → `@/` alias → Relative. Type-only imports use `import type`
- Format follows `mwts` + Prettier