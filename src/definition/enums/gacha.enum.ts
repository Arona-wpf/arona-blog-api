/**
 * 游戏类型枚举。
 */
export enum GameTypeEnum {
  GENSHIN_IMPACT = 'genshin_impact',
  HONKAI_STAR_RAIL = 'honkai_star_rail',
  ZENLESS_ZONE_ZERO = 'zenless_zone_zero',
}

/**
 * 祈愿记录中的物品类型枚举。
 */
export enum GachaItemTypeEnum {
  CHARACTER = 'character',
  WEAPON = 'weapon',
  BANBOO = 'banboo',
}

/**
 * 原神服务器区域枚举。
 */
export enum GenshinImpactServerRegionEnum {
  CN_GF01 = 'cn_gf01', // 国服
  CN_QD01 = 'cn_qd01', // 渠道服
  OS_ASIA = 'os_asia', // 亚服
  OS_EURO = 'os_euro', // 欧服
  OS_USA = 'os_usa', // 美服
  OS_CHT = 'os_cht', // 港澳台服
}

/**
 * 崩坏：星穹铁道服务器区域枚举。
 */
export enum HonkaiStarRailServerRegionEnum {
  PROD_GF_CN = 'prod_gf_cn', // 国服
  PROD_QD_CN = 'prod_qd_cn', // 渠道服
  PROD_OFFICIAL_ASIA = 'prod_official_asia', // 亚服
  PROD_OFFICIAL_EURO = 'prod_official_euro', // 欧服
  PROD_OFFICIAL_USA = 'prod_official_usa', // 美服
  PROD_OFFICIAL_CHT = 'prod_official_cht', // 港澳台服
}

/**
 * 绝区零服务器区域枚举。
 */
export enum ZenlessZoneZeroServerRegionEnum {
  PROD_GF_CN = 'prod_gf_cn', // 国服
  PROD_QD_CN = 'prod_qd_cn', // 渠道服
  PROD_OFFICIAL_ASIA = 'prod_official_asia', // 亚服
  PROD_OFFICIAL_EURO = 'prod_official_euro', // 欧服
  PROD_OFFICIAL_USA = 'prod_official_usa', // 美服
  PROD_OFFICIAL_CHT = 'prod_official_cht', // 港澳台服
}

/**
 * 原神祈愿卡池类型枚举。
 */
export enum GenshinImpactGachaTypeEnum {
  NOVICE_WISH = '100', // 新手祈愿
  PERMANENT_WISH = '200', // 常驻祈愿
  CHARACTER_EVENT_WISH = '301', // 角色活动祈愿
  WEAPON_EVENT_WISH = '302', // 武器活动祈愿
  CHARACTER_EVENT_WISH_2 = '400', // 角色活动祈愿-2
  CHRONICLED_WISH = '401', // 集录祈愿
}

/**
 * 崩坏：星穹铁道跃迁类型枚举。
 */
export enum HonkaiStarRailGachaTypeEnum {
  REGULAR_WARP = '1', // 常驻跃迁
  STARTER_WARP = '2', // 新手跃迁
  CHARACTER_EVENT_WARP = '11', // 角色活动跃迁
  LIGHT_CONE_EVENT_WARP = '12', // 光锥活动跃迁
  CHARACTER_COLLABORATION_WARP = '21', // 角色联动跃迁
  LIGHT_CONE_COLLABORATION_WARP = '22', // 光锥联动跃迁
}

/**
 * 绝区零频段类型枚举。
 */
export enum ZenlessZoneZeroGachaTypeEnum {
  STABLE_CHANNEL = '1', // 常驻频段
  EXCLUSIVE_CHANNEL = '2', // 独家频段
  W_ENGINE_CHANNEL = '3', // 音擎频段
  BANBOO_CHANNEL = '5', // 邦布频段
}

/**
 * 祈愿同步任务状态枚举。
 */
export enum GachaTaskStatusEnum {
  PENDING = 'pending', // 待处理
  PROCESSING = 'processing', // 处理中
  COMPLETED = 'completed', // 已完成
  FAILED = 'failed', // 失败
}

/**
 * 原神祈愿角色元素类型枚举。
 */
export enum GenshinImpactGachaItemElementEnum {
  ANEMO = 'Anemo',
  GEO = 'Geo',
  ELECTRO = 'Electro',
  DENDRO = 'Dendro',
  HYDRO = 'Hydro',
  PYRO = 'Pyro',
  CRYO = 'Cryo',
}

/**
 * 原神祈愿武器类型枚举。
 */
export enum GenshinImpactGachaItemWeaponTypeEnum {
  SWORD = 'Sword',
  CLAYMORE = 'Claymore',
  POLEARM = 'Polearm',
  CATALYST = 'Catalyst',
  BOW = 'Bow',
}

/**
 * 崩坏：星穹铁道祈愿命途枚举。
 */
export enum HonkaiStarRailGachaItemPathEnum {
  DESTRUCTION = 'Destruction',
  THE_HUNT = 'The Hunt',
  ERUDITION = 'Erudition',
  HARMONY = 'Harmony',
  NIHILITY = 'Nihility',
  PRESERVATION = 'Preservation',
  ABUNDANCE = 'Abundance',
  REMEMBRANCE = 'Remembrance',
  ELATION = 'Elation',
  PROPAGATION = 'Propagation',
  VORACITY = 'Voracity',
  ORDER = 'Order',
  TRAILBLAZE = 'Trailblaze',
  EQUILIBRIUM = 'Equilibrium',
  FINALITY = 'Finality',
  ENIGMATA = 'Enigmata',
}

/**
 * 崩坏：星穹铁道祈愿属性枚举。
 */
export enum HonkaiStarRailGachaItemCombatTypeEnum {
  PHYSICAL = 'Physical',
  FIRE = 'Fire',
  ICE = 'Ice',
  LIGHTNING = 'Lightning',
  WIND = 'Wind',
  QUANTUM = 'Quantum',
  IMAGINARY = 'Imaginary',
}

/**
 * 绝区零祈愿属性枚举。
 */
export enum ZenlessZoneZeroGachaItemAttributeEnum {
  PHYSICAL = 'Physical',
  FIRE = 'Fire',
  ICE = 'Ice',
  ELECTRIC = 'Electric',
  ETHER = 'Ether',
}

/**
 * 绝区零祈愿特性枚举。
 */
export enum ZenlessZoneZeroGachaItemSpecialtyEnum {
  ATTACK = 'Attack',
  STUN = 'Stun',
  ANOMALY = 'Anomaly',
  SUPPORT = 'Support',
  DEFENSE = 'Defense',
  RUPTURE = 'Rupture',
}
