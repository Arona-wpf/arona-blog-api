export enum GameTypeEnum {
  GENSHIN_IMPACT = 'genshin_impact',
  HONKAI_STAR_RAIL = 'honkai_star_rail',
  ZENLESS_ZONE_ZERO = 'zenless_zone_zero',
}

export enum GenshinImpactServerRegionEnum {
  CN_GF01 = 'cn_gf01', // 国服
  CN_QD01 = 'cn_qd01', // 渠道服
  OS_ASIA = 'os_asia', // 亚服
  OS_EURO = 'os_euro', // 欧服
  OS_USA = 'os_usa', // 美服
  OS_CHT = 'os_cht', // 港澳台服
}

export enum HonkaiStarRailServerRegionEnum {
  PROD_GF_CN = 'prod_gf_cn', // 国服
  PROD_QD_CN = 'prod_qd_cn', // 渠道服
  PROD_OFFICIAL_ASIA = 'prod_official_asia', // 亚服
  PROD_OFFICIAL_EURO = 'prod_official_euro', // 欧服
  PROD_OFFICIAL_USA = 'prod_official_usa', // 美服
  PROD_OFFICIAL_CHT = 'prod_official_cht', // 港澳台服
}

export enum ZenlessZoneZeroServerRegionEnum {
  PROD_GF_CN = 'prod_gf_cn', // 国服
  PROD_QD_CN = 'prod_qd_cn', // 渠道服
  PROD_OFFICIAL_ASIA = 'prod_official_asia', // 亚服
  PROD_OFFICIAL_EURO = 'prod_official_euro', // 欧服
  PROD_OFFICIAL_USA = 'prod_official_usa', // 美服
  PROD_OFFICIAL_CHT = 'prod_official_cht', // 港澳台服
}

export enum GenshinImpactGachaTypeEnum {
  NOVICE_WISH = '100', // 新手祈愿
  PERMANENT_WISH = '200', // 常驻祈愿
  CHARACTER_EVENT_WISH = '301', // 角色活动祈愿
  WEAPON_EVENT_WISH = '302', // 武器活动祈愿
  CHARACTER_EVENT_WISH_2 = '400', // 角色活动祈愿-2
  CHRONICLED_WISH = '401', // 集录祈愿
}

export enum HonkaiStarRailGachaTypeEnum {
  REGULAR_WARP = '1', // 常驻跃迁
  STARTER_WARP = '2', // 新手跃迁
  CHARACTER_EVENT_WARP = '11', // 角色活动跃迁
  LIGHT_CONE_EVENT_WARP = '12', // 光锥活动跃迁
  CHARACTER_COLLABORATION_WARP = '21', // 角色联动跃迁
  LIGHT_CONE_COLLABORATION_WARP = '22', // 光锥联动跃迁
}

export enum ZenlessZoneZeroGachaTypeEnum {
  STABLE_CHANNEL = '1', // 常驻频段
  EXCLUSIVE_CHANNEL = '2', // 独家频段
  W_ENGINE_CHANNEL = '3', // 音擎频段
  BANBOO_CHANNEL = '5', // 邦布频段
}

// 原神祈愿类型国际化 key 映射
export const GenshinImpactGachaTypeI18nKeyMap: Record<string, string> = {
  [GenshinImpactGachaTypeEnum.NOVICE_WISH]:
    'gacha.type.genshin_impact.novice_wish',
  [GenshinImpactGachaTypeEnum.PERMANENT_WISH]:
    'gacha.type.genshin_impact.permanent_wish',
  [GenshinImpactGachaTypeEnum.CHARACTER_EVENT_WISH]:
    'gacha.type.genshin_impact.character_event_wish',
  [GenshinImpactGachaTypeEnum.WEAPON_EVENT_WISH]:
    'gacha.type.genshin_impact.weapon_event_wish',
  [GenshinImpactGachaTypeEnum.CHARACTER_EVENT_WISH_2]:
    'gacha.type.genshin_impact.character_event_wish_2',
  [GenshinImpactGachaTypeEnum.CHRONICLED_WISH]:
    'gacha.type.genshin_impact.chronicled_wish',
};

// 崩坏：星穹铁道跃迁类型国际化 key 映射
export const HonkaiStarRailGachaTypeI18nKeyMap: Record<string, string> = {
  [HonkaiStarRailGachaTypeEnum.REGULAR_WARP]:
    'gacha.type.honkai_star_rail.regular_warp',
  [HonkaiStarRailGachaTypeEnum.STARTER_WARP]:
    'gacha.type.honkai_star_rail.starter_warp',
  [HonkaiStarRailGachaTypeEnum.CHARACTER_EVENT_WARP]:
    'gacha.type.honkai_star_rail.character_event_warp',
  [HonkaiStarRailGachaTypeEnum.LIGHT_CONE_EVENT_WARP]:
    'gacha.type.honkai_star_rail.light_cone_event_warp',
  [HonkaiStarRailGachaTypeEnum.CHARACTER_COLLABORATION_WARP]:
    'gacha.type.honkai_star_rail.character_collaboration_warp',
  [HonkaiStarRailGachaTypeEnum.LIGHT_CONE_COLLABORATION_WARP]:
    'gacha.type.honkai_star_rail.light_cone_collaboration_warp',
};

// 绝区零频段类型国际化 key 映射
export const ZenlessZoneZeroGachaTypeI18nKeyMap: Record<string, string> = {
  [ZenlessZoneZeroGachaTypeEnum.STABLE_CHANNEL]:
    'gacha.type.zenless_zone_zero.stable_channel',
  [ZenlessZoneZeroGachaTypeEnum.EXCLUSIVE_CHANNEL]:
    'gacha.type.zenless_zone_zero.exclusive_channel',
  [ZenlessZoneZeroGachaTypeEnum.W_ENGINE_CHANNEL]:
    'gacha.type.zenless_zone_zero.w_engine_channel',
  [ZenlessZoneZeroGachaTypeEnum.BANBOO_CHANNEL]:
    'gacha.type.zenless_zone_zero.banboo_channel',
};

// 游戏类型国际化 key 映射
export const GameTypeI18nKeyMap: Record<string, string> = {
  [GameTypeEnum.GENSHIN_IMPACT]: 'gacha.game_type.genshin_impact',
  [GameTypeEnum.HONKAI_STAR_RAIL]: 'gacha.game_type.honkai_star_rail',
  [GameTypeEnum.ZENLESS_ZONE_ZERO]: 'gacha.game_type.zenless_zone_zero',
};