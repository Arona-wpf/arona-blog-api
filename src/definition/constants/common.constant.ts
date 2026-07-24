import { BusinessError } from '@/class/error/business.error';

/**
 * 业务错误工厂常量集合。
 */
export const BUSINESS_ERROR_CONSTANT = {
  // URL替换失败
  URL_REPLACE_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000001, 'error.url.replace.failed', args),
  // Redis实例不存在
  REDIS_INSTANCE_NOT_FOUND: (args?: Record<string, string>) =>
    new BusinessError(1000002, 'error.redis.instance.not.found', args),
  // Axios实例不存在
  AXIOS_INSTANCE_NOT_FOUND: (args?: Record<string, string>) =>
    new BusinessError(1000003, 'error.axios.instance.not.found', args),
  // WebSocket 连接未授权（用户未登录）
  WS_UNAUTHORIZED: (args?: Record<string, string>) =>
    new BusinessError(1000004, 'error.ws.unauthorized', args),

  // 验证码校验失败
  CAPTCHA_VERIFY_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000101, 'error.captcha.verify.failed', args),
  // 验证码不存在或已过期
  CAPTCHA_VERIFY_NOT_FOUND: (args?: Record<string, string>) =>
    new BusinessError(1000102, 'error.captcha.verify.not.found', args),
  // 验证码发送超时
  CAPTCHA_SEND_TIMEOUT: (args?: Record<string, string>) =>
    new BusinessError(1000103, 'error.captcha.send.timeout', args),
  // 邮件发送失败
  EMAIL_SEND_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000104, 'error.email.send.failed', args),
  // 邮件模板不存在
  EMAIL_TEMPLATE_NOT_FOUND: (args?: Record<string, string>) =>
    new BusinessError(1000105, 'error.email.template.not.found', args),

  // 用户不存在
  USER_NOT_EXIST: (args?: Record<string, string>) =>
    new BusinessError(1000201, 'error.user.not.exist', args),
  // 用户已存在
  USER_ALREADY_EXISTS: (args?: Record<string, string>) =>
    new BusinessError(1000202, 'error.user.already.exists', args),
  // 用户登录密码错误
  USER_LOGIN_FAILED_PASSWORD: (args?: Record<string, string>) =>
    new BusinessError(1000203, 'error.user.login.failed.password', args),
  // 用户登录验证码错误
  USER_LOGIN_FAILED_VERIFY_CODE: (args?: Record<string, string>) =>
    new BusinessError(1000204, 'error.user.login.failed.verify_code', args),
  // 用户绑定角色不存在
  USER_ROLE_NOT_EXIST: (args?: Record<string, string>) =>
    new BusinessError(1000205, 'error.user.role.not.exist', args),
  // 更新用户角色失败
  USER_UPDATE_ROLE_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000206, 'error.user.update.role.failed', args),
  // 登录参数缺失（password 与 cache_id 均为空）
  USER_LOGIN_PARAM_MISSING: (args?: Record<string, string>) =>
    new BusinessError(1000207, 'error.user.login.param.missing', args),
  // 登录参数冲突（password 与 cache_id 同时存在）
  USER_LOGIN_PARAM_CONFLICT: (args?: Record<string, string>) =>
    new BusinessError(1000208, 'error.user.login.param.conflict', args),
  // 更新用户资料失败
  USER_UPDATE_PROFILE_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000209, 'error.user.update.profile.failed', args),
  // 修改密码失败
  USER_CHANGE_PASSWORD_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000210, 'error.user.change.password.failed', args),
  // 旧密码错误
  USER_OLD_PASSWORD_ERROR: (args?: Record<string, string>) =>
    new BusinessError(1000211, 'error.user.old.password.error', args),
  // 两次输入的密码不一致
  USER_PASSWORD_NOT_MATCH: (args?: Record<string, string>) =>
    new BusinessError(1000212, 'error.user.password.not.match', args),
  // 新密码与旧密码相同
  USER_PASSWORD_SAME_AS_OLD: (args?: Record<string, string>) =>
    new BusinessError(1000213, 'error.user.password.same.as.old', args),
  // 重置密码验证信息缺失（session.guest.email不存在）
  USER_RESET_PASSWORD_INFO_MISSING: (args?: Record<string, string>) =>
    new BusinessError(1000214, 'error.user.reset.password.info.missing', args),
  // 重置密码失败
  USER_RESET_PASSWORD_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000215, 'error.user.reset.password.failed', args),
  // 用户是管理员，无法删除
  USER_IS_ADMINISTRATOR: (args?: Record<string, string>) =>
    new BusinessError(1000216, 'error.user.is.administrator', args),

  // 文件上传缺失
  FILE_UPLOAD_NOT_FOUND: (args?: Record<string, string>) =>
    new BusinessError(1000301, 'error.file.upload.not.found', args),
  // 文件对象名称缺失
  FILE_OBJECT_NAME_NOT_FOUND: (args?: Record<string, string>) =>
    new BusinessError(1000302, 'error.file.object.name.not.found', args),

  // 权限已存在
  PERMISSION_ALREADY_EXISTS: (args?: Record<string, string>) =>
    new BusinessError(1000401, 'error.permission.already.exists', args),
  // 权限不存在
  PERMISSION_NOT_EXIST: (args?: Record<string, string>) =>
    new BusinessError(1000402, 'error.permission.not.exist', args),
  // 权限被引用，无法删除
  PERMISSION_IN_USE: (args?: Record<string, string>) =>
    new BusinessError(1000403, 'error.permission.in.use', args),

  // 角色已存在
  ROLE_ALREADY_EXISTS: (args?: Record<string, string>) =>
    new BusinessError(1000501, 'error.role.already.exists', args),
  // 角色不存在
  ROLE_NOT_EXIST: (args?: Record<string, string>) =>
    new BusinessError(1000502, 'error.role.not.exist', args),
  // 角色被引用，无法删除
  ROLE_IN_USE: (args?: Record<string, string>) =>
    new BusinessError(1000503, 'error.role.in.use', args),
  // 角色关联权限不存在
  ROLE_PERMISSION_NOT_EXIST: (args?: Record<string, string>) =>
    new BusinessError(1000504, 'error.role.permission.not.exist', args),
  // 角色为系统角色，无法删除
  ROLE_IS_SYSTEM: (args?: Record<string, string>) =>
    new BusinessError(1000505, 'error.role.is.system', args),

  // SM3密钥未配置
  CRYPTO_SM3_SECRET_NOT_SET: (args?: Record<string, string>) =>
    new BusinessError(1000601, 'error.crypto.sm3.secret.not.set', args),
  // SM3哈希失败
  CRYPTO_SM3_HASH_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000602, 'error.crypto.sm3.hash.failed', args),
  // SM4密钥未配置
  CRYPTO_SM4_SECRET_NOT_SET: (args?: Record<string, string>) =>
    new BusinessError(1000603, 'error.crypto.sm4.secret.not.set', args),
  // SM4加密失败
  CRYPTO_SM4_ENCRYPT_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000604, 'error.crypto.sm4.encrypt.failed', args),
  // SM4解密失败
  CRYPTO_SM4_DECRYPT_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000605, 'error.crypto.sm4.decrypt.failed', args),

  // COS临时凭证获取失败
  COS_CREDENTIAL_FETCH_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000701, 'error.cos.credential.fetch.failed', args),
  // COS实例初始化失败
  COS_INIT_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000702, 'error.cos.init.failed', args),
  // COS文件上传失败
  COS_UPLOAD_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000703, 'error.cos.upload.failed', args),
  // COS无权限访问对象
  COS_OBJECT_NO_ACCESS: (args?: Record<string, string>) =>
    new BusinessError(1000704, 'error.cos.object.no.access', args),
  // COS获取对象URL失败
  COS_GET_URL_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000705, 'error.cos.get.url.failed', args),
  // COS获取存储桶数据失败
  COS_GET_BUCKET_DATA_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000706, 'error.cos.get.bucket.data.failed', args),
  // COS对象已存在
  COS_OBJECT_HAS_EXISTS: (args?: Record<string, string>) =>
    new BusinessError(1000707, 'error.cos.object.has.exists', args),
  // COS删除文件夹失败
  COS_DELETE_FOLDER_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000708, 'error.cos.delete.folder.failed', args),
  // COS文件夹下仍存在对象
  COS_FOLDER_HAS_OBJECT: (args?: Record<string, string>) =>
    new BusinessError(1000709, 'error.cos.folder.has.object', args),
  // COS删除文件失败
  COS_DELETE_FILE_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000710, 'error.cos.delete.file.failed', args),
  // COS创建文件夹失败
  COS_CREATE_FOLDER_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000711, 'error.cos.create.folder.failed', args),

  // MinIO Origin 不允许访问
  MINIO_ORIGIN_NOT_ALLOWED: (args?: Record<string, string>) =>
    new BusinessError(1000801, 'error.minio.origin.not.allowed', args),
  // MinIO 对象名称缺失
  MINIO_OBJECT_NAME_NOT_FOUND: (args?: Record<string, string>) =>
    new BusinessError(1000802, 'error.minio.object.name.not.found', args),
  // MinIO 获取 URL 失败
  MINIO_GET_URL_FAILED: (args?: Record<string, string>) =>
    new BusinessError(1000803, 'error.minio.get.url.failed', args),

  // 祈愿auth key不存在
  GACHA_AUTH_KEY_NOT_FOUND: (args?: Record<string, string>) =>
    new BusinessError(1000901, 'error.gacha.auth.key.not.found', args),
  // 祈愿服务器区域不存在
  GACHA_SERVER_REGION_NOT_FOUND: (args?: Record<string, string>) =>
    new BusinessError(1000902, 'error.gacha.server.region.not.found', args),
  // 祈愿服务器区域与配置不一致
  GACHA_SERVER_REGION_MISMATCH: (args?: Record<string, string>) =>
    new BusinessError(1000912, 'error.gacha.server.region.mismatch', args),
  // 祈愿游戏类型不支持
  GACHA_GAME_TYPE_NOT_SUPPORTED: (args?: Record<string, string>) =>
    new BusinessError(1000903, 'error.gacha.game.type.not.supported', args),
  // 祈愿任务不存在
  GACHA_TASK_NOT_FOUND: (args?: Record<string, string>) =>
    new BusinessError(1000904, 'error.gacha.task.not.found', args),
  // 祈愿配置不存在
  GACHA_CONFIG_NOT_FOUND: (args?: Record<string, string>) =>
    new BusinessError(1000905, 'error.gacha.config.not.found', args),
  // 祈愿配置账号不匹配
  GACHA_CONFIG_ACCOUNT_MISMATCH: (args?: Record<string, string>) =>
    new BusinessError(1000906, 'error.gacha.config.account.mismatch', args),
  // 祈愿配置数量超过限制
  GACHA_CONFIG_LIMIT_EXCEEDED: (args?: Record<string, string>) =>
    new BusinessError(1000907, 'error.gacha.config.limit.exceeded', args),
  // 祈愿JSON文件UID与配置UID不一致
  GACHA_IMPORT_UID_MISMATCH: (args?: Record<string, string>) =>
    new BusinessError(1000908, 'error.gacha.import.uid.mismatch', args),
  // 祈愿记录为空，无数据可导出
  GACHA_EXPORT_EMPTY: (args?: Record<string, string>) =>
    new BusinessError(1000909, 'error.gacha.export.empty', args),
  // 祈愿导出文件类型不支持
  GACHA_EXPORT_FILE_TYPE_INVALID: (args?: Record<string, string>) =>
    new BusinessError(1000910, 'error.gacha.export.file.type.invalid', args),
  // 祈愿同步进行中
  GACHA_SYNC_IN_PROGRESS: (args?: Record<string, string>) =>
    new BusinessError(1000911, 'error.gacha.sync.in.progress', args),
  // 祈愿脚本文件不存在
  GACHA_SCRIPT_NOT_FOUND: (args?: Record<string, string>) =>
    new BusinessError(1000913, 'error.gacha.script.not.found', args),
  // 祈愿链接已过期
  GACHA_AUTHKEY_EXPIRED: (args?: Record<string, string>) =>
    new BusinessError(1000914, 'error.gacha.authkey.expired', args),
  // 祈愿 API 请求失败
  GACHA_API_ERROR: (args?: Record<string, string>) =>
    new BusinessError(1000915, 'error.gacha.api.error', args),
  // 系统配置不存在
  CONFIG_NOT_FOUND: (args?: Record<string, string>) =>
    new BusinessError(1001001, 'error.config.not.found', args),
};
