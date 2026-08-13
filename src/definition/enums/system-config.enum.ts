/**
 * 系统配置 key 枚举。
 */
export enum SystemConfigKeyEnum {
  // 原神祈愿物品图鉴第三方 API 请求参数（不含问号，代码中拼接 ? 后使用）
  GACHA_GENSHIN_ATLAS_PARAMS = 'gacha.genshin.atlas.params',
  // 原神常驻池图鉴配置
  GACHA_GENSHIN_CONFIG = 'gacha.genshin.config',
  // 崩坏：星穹铁道常驻池图鉴配置
  GACHA_STARRAIL_CONFIG = 'gacha.starrail.config',
  // 绝区零常驻池图鉴配置
  GACHA_ZZZ_CONFIG = 'gacha.zzz.config',
}
