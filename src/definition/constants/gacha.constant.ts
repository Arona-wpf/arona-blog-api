import {
  GameTypeEnum,
  GenshinImpactGachaTypeEnum,
  HonkaiStarRailGachaTypeEnum,
  ZenlessZoneZeroGachaTypeEnum,
} from '../enums/gacha.enum';
import type { GameType } from '../types/gacha.type';

/**
 * 各游戏图鉴 5 星 / S 级 rank_type 取值。
 */
export const GACHA_ATLAS_GOLD_RANK_TYPE_MAP: Record<GameType, string[]> = {
  [GameTypeEnum.GENSHIN_IMPACT]: ['5'],
  [GameTypeEnum.HONKAI_STAR_RAIL]: ['5'],
  [GameTypeEnum.ZENLESS_ZONE_ZERO]: ['S'],
};

/**
 * 祈愿脚本文件名中的游戏标识映射。
 */
export const GACHA_SCRIPT_NAME_MAP: Record<GameType, string> = {
  [GameTypeEnum.GENSHIN_IMPACT]: 'Genshin',
  [GameTypeEnum.HONKAI_STAR_RAIL]: 'StarRail',
  [GameTypeEnum.ZENLESS_ZONE_ZERO]: 'ZenlessZoneZero',
};

/**
 * 原神祈愿类型到 i18n key 的映射。
 */
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

/**
 * 崩坏：星穹铁道跃迁类型到 i18n key 的映射。
 */
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

/**
 * 绝区零频段类型到 i18n key 的映射。
 */
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

/**
 * 游戏类型到 i18n key 的映射。
 */
export const GameTypeI18nKeyMap: Record<string, string> = {
  [GameTypeEnum.GENSHIN_IMPACT]: 'gacha.game_type.genshin_impact',
  [GameTypeEnum.HONKAI_STAR_RAIL]: 'gacha.game_type.honkai_star_rail',
  [GameTypeEnum.ZENLESS_ZONE_ZERO]: 'gacha.game_type.zenless_zone_zero',
};

/**
 * 星级中文文本到数字字符串的映射（原神/星铁通用）。
 */
const GENSIN_AND_STAR_RAIL_RANK_TYPE_MAP: Record<string, string> = {
  五星: '5',
  四星: '4',
  三星: '3',
  二星: '2',
  一星: '1',
};

/**
 * 原神元素中文到英文枚举值映射。
 */
export const GENSHIN_IMPACT_ELEMENT_TYPE_MAP: Record<string, string> = {
  风: 'Anemo',
  岩: 'Geo',
  雷: 'Electro',
  草: 'Dendro',
  水: 'Hydro',
  火: 'Pyro',
  冰: 'Cryo',
};

/**
 * 原神元素英文枚举值到 i18n key 的映射。
 */
export const GENSHIN_IMPACT_ELEMENT_TYPE_I18N_KEY_MAP: Record<string, string> =
  {
    Anemo: 'gacha.element.genshin_impact.anemo',
    Geo: 'gacha.element.genshin_impact.geo',
    Electro: 'gacha.element.genshin_impact.electro',
    Dendro: 'gacha.element.genshin_impact.dendro',
    Hydro: 'gacha.element.genshin_impact.hydro',
    Pyro: 'gacha.element.genshin_impact.pyro',
    Cryo: 'gacha.element.genshin_impact.cryo',
  };

/**
 * 原神武器中文到英文枚举值映射。
 */
export const GENSHIN_IMPACT_WEAPON_TYPE_MAP: Record<string, string> = {
  单手剑: 'Sword',
  双手剑: 'Claymore',
  长柄武器: 'Polearm',
  法器: 'Catalyst',
  弓: 'Bow',
};

/**
 * 原神武器英文枚举值到 i18n key 的映射。
 */
export const GENSHIN_IMPACT_WEAPON_TYPE_I18N_KEY_MAP: Record<string, string> = {
  Sword: 'gacha.weapon.genshin_impact.sword',
  Claymore: 'gacha.weapon.genshin_impact.claymore',
  Polearm: 'gacha.weapon.genshin_impact.polearm',
  Catalyst: 'gacha.weapon.genshin_impact.catalyst',
  Bow: 'gacha.weapon.genshin_impact.bow',
};

/**
 * 崩坏：星穹铁道命途中文到英文枚举值映射。
 */
export const HONKAI_STAR_RAIL_PATH_TYPE_MAP: Record<string, string> = {
  毁灭: 'Destruction',
  巡猎: 'The Hunt',
  智识: 'Erudition',
  同谐: 'Harmony',
  虚无: 'Nihility',
  存护: 'Preservation',
  丰饶: 'Abundance',
  记忆: 'Remembrance',
  欢愉: 'Elation',
  繁育: 'Propagation',
  贪饕: 'Voracity',
  秩序: 'Order',
  开拓: 'Trailblaze',
  均衡: 'Equilibrium',
  终末: 'Finality',
  神秘: 'Enigmata',
};

/**
 * 崩坏：星穹铁道命途英文枚举值到 i18n key 的映射。
 */
export const HONKAI_STAR_RAIL_PATH_TYPE_I18N_KEY_MAP: Record<string, string> = {
  Destruction: 'gacha.path.honkai_star_rail.destruction',
  TheHunt: 'gacha.path.honkai_star_rail.the_hunt',
  Erudition: 'gacha.path.honkai_star_rail.erudition',
  Harmony: 'gacha.path.honkai_star_rail.harmony',
  Nihility: 'gacha.path.honkai_star_rail.nihility',
  Preservation: 'gacha.path.honkai_star_rail.preservation',
  Abundance: 'gacha.path.honkai_star_rail.abundance',
  Remembrance: 'gacha.path.honkai_star_rail.remembrance',
  Elation: 'gacha.path.honkai_star_rail.elation',
  Propagation: 'gacha.path.honkai_star_rail.propagation',
  Voracity: 'gacha.path.honkai_star_rail.voracity',
  Order: 'gacha.path.honkai_star_rail.order',
  Trailblaze: 'gacha.path.honkai_star_rail.trailblaze',
  Equilibrium: 'gacha.path.honkai_star_rail.equilibrium',
  Finality: 'gacha.path.honkai_star_rail.finality',
  Enigmata: 'gacha.path.honkai_star_rail.enigmata',
};

/**
 * 崩坏：星穹铁道属性中文到英文枚举值映射。
 */
export const HONKAI_STAR_RAIL_COMBAT_TYPE_MAP: Record<string, string> = {
  物理: 'Physical',
  火: 'Fire',
  冰: 'Ice',
  雷: 'Lightning',
  风: 'Wind',
  量子: 'Quantum',
  虚数: 'Imaginary',
};

/**
 * 崩坏：星穹铁道属性英文枚举值到 i18n key 的映射。
 */
export const HONKAI_STAR_RAIL_COMBAT_TYPE_I18N_KEY_MAP: Record<string, string> =
  {
    Physical: 'gacha.combat.honkai_star_rail.physical',
    Fire: 'gacha.combat.honkai_star_rail.fire',
    Ice: 'gacha.combat.honkai_star_rail.ice',
    Lightning: 'gacha.combat.honkai_star_rail.lightning',
    Wind: 'gacha.combat.honkai_star_rail.wind',
    Quantum: 'gacha.combat.honkai_star_rail.quantum',
    Imaginary: 'gacha.combat.honkai_star_rail.imaginary',
  };

/**
 * 绝区零稀有度文本到标准值映射。
 */
export const ZENLESS_ZONE_ZERO_RANK_TYPE_MAP: Record<string, string> = {
  S: 'S',
  A: 'A',
  B: 'B',
};

/**
 * 绝区零属性中文到英文枚举值映射。
 */
export const ZENLESS_ZONE_ZERO_ATTRIBUTE_MAP: Record<string, string> = {
  物理: 'Physical',
  火: 'Fire',
  冰: 'Ice',
  电: 'Electric',
  以太: 'Ether',
  烈霜: 'Frost',
  凛刃: 'Rime',
  风: 'Wind',
  玄墨: 'Ink',
  流明: 'Luminescence',
  锋御: 'Edgeguard',
};

/**
 * 绝区零属性英文枚举值到 i18n key 的映射。
 */
export const ZENLESS_ZONE_ZERO_ATTRIBUTE_I18N_KEY_MAP: Record<string, string> =
  {
    Physical: 'gacha.attribute.zenless_zone_zero.physical',
    Fire: 'gacha.attribute.zenless_zone_zero.fire',
    Ice: 'gacha.attribute.zenless_zone_zero.ice',
    Electric: 'gacha.attribute.zenless_zone_zero.electric',
    Ether: 'gacha.attribute.zenless_zone_zero.ether',
    Frost: 'gacha.attribute.zenless_zone_zero.frost',
    Rime: 'gacha.attribute.zenless_zone_zero.rime',
    Wind: 'gacha.attribute.zenless_zone_zero.wind',
    Ink: 'gacha.attribute.zenless_zone_zero.ink',
    Luminescence: 'gacha.attribute.zenless_zone_zero.luminescence',
    Edgeguard: 'gacha.attribute.zenless_zone_zero.edgeguard',
  };

/**
 * 绝区零特性中文到英文枚举值映射。
 */
export const ZENLESS_ZONE_ZERO_SPECIALTY_MAP: Record<string, string> = {
  强攻: 'Attack',
  击破: 'Stun',
  异常: 'Anomaly',
  支援: 'Support',
  防护: 'Defense',
  命破: 'Rupture',
};

/**
 * 绝区零特性英文枚举值到 i18n key 的映射。
 */
export const ZENLESS_ZONE_ZERO_SPECIALTY_I18N_KEY_MAP: Record<string, string> =
  {
    Attack: 'gacha.specialty.zenless_zone_zero.attack',
    Stun: 'gacha.specialty.zenless_zone_zero.stun',
    Anomaly: 'gacha.specialty.zenless_zone_zero.anomaly',
    Support: 'gacha.specialty.zenless_zone_zero.support',
    Defense: 'gacha.specialty.zenless_zone_zero.defense',
    Rupture: 'gacha.specialty.zenless_zone_zero.rupture',
  };

/**
 * 从 ext 字段中解析 rank_type
 * @param ext ext JSON字符串
 * @param categoryId 分类ID（原神：角色为25，武器为5；崩坏：星穹铁道：角色为18，光锥为19）
 * @returns rank_type 星级数值字符串，解析失败返回空字符串
 */
export function parseGenshinAndStarRailRankType(
  ext: string,
  categoryId: number
): string {
  try {
    const extData = JSON.parse(ext);
    const categoryKey = `c_${categoryId}`;
    const filterText = extData?.[categoryKey]?.filter?.text;

    if (!filterText) {
      return '';
    }

    const filterArray = JSON.parse(filterText);
    const rankItem = filterArray.find((item: string) => item.includes('星级/'));

    if (!rankItem) {
      return '';
    }

    const rankName = rankItem.replace('星级/', '');
    return GENSIN_AND_STAR_RAIL_RANK_TYPE_MAP[rankName] || '';
  } catch {
    return '';
  }
}

/**
 * 从 ext 字段中解析原神角色的元素类型
 * @param ext ext JSON字符串
 * @returns 元素类型（英文），解析失败返回空字符串
 */
export function parseGenshinImpactCharacterElement(ext: string): string {
  try {
    const extData = JSON.parse(ext);
    const filterText = extData?.c_25?.filter?.text;

    if (!filterText) {
      return '';
    }

    const filterArray = JSON.parse(filterText);
    const elementItem = filterArray.find((item: string) =>
      item.includes('元素/')
    );

    if (!elementItem) {
      return '';
    }

    const elementName = elementItem.replace('元素/', '');
    return GENSHIN_IMPACT_ELEMENT_TYPE_MAP[elementName] || '';
  } catch {
    return '';
  }
}

/**
 * 从 ext 字段中解析原神角色的武器类型
 * @param ext ext JSON字符串
 * @returns 武器类型（英文），解析失败返回空字符串
 */
export function parseGenshinImpactCharacterWeaponType(ext: string): string {
  try {
    const extData = JSON.parse(ext);
    const filterText = extData?.c_25?.filter?.text;

    if (!filterText) {
      return '';
    }

    const filterArray = JSON.parse(filterText);
    const weaponItem = filterArray.find((item: string) =>
      item.includes('武器/')
    );

    if (!weaponItem) {
      return '';
    }

    const weaponName = weaponItem.replace('武器/', '');
    return GENSHIN_IMPACT_WEAPON_TYPE_MAP[weaponName] || '';
  } catch {
    return '';
  }
}

/**
 * 从 ext 字段中解析原神武器的星级
 * @param ext ext JSON字符串
 * @returns 星级数值字符串，解析失败返回空字符串
 */
export function parseGenshinImpactWeaponRankType(ext: string): string {
  try {
    const extData = JSON.parse(ext);
    const filterText = extData?.c_5?.filter?.text;

    if (!filterText) {
      return '';
    }

    const filterArray = JSON.parse(filterText);
    const rankItem = filterArray.find((item: string) =>
      item.includes('武器星级/')
    );

    if (!rankItem) {
      return '';
    }

    const rankName = rankItem.replace('武器星级/', '');
    return GENSIN_AND_STAR_RAIL_RANK_TYPE_MAP[rankName] || '';
  } catch {
    return '';
  }
}

/**
 * 从 ext 字段中解析原神武器的武器类型
 * @param ext ext JSON字符串
 * @returns 武器类型（英文），解析失败返回空字符串
 */
export function parseGenshinImpactWeaponType(ext: string): string {
  try {
    const extData = JSON.parse(ext);
    const filterText = extData?.c_5?.filter?.text;

    if (!filterText) {
      return '';
    }

    const filterArray = JSON.parse(filterText);
    const weaponItem = filterArray.find((item: string) =>
      item.includes('武器类型/')
    );

    if (!weaponItem) {
      return '';
    }

    const weaponName = weaponItem.replace('武器类型/', '');
    return GENSHIN_IMPACT_WEAPON_TYPE_MAP[weaponName] || '';
  } catch {
    return '';
  }
}

/**
 * 从 ext 字段中解析 rank_type
 * @param ext ext JSON字符串
 * @param categoryId 分类ID（代理人为43，邦布为44，音擎为45）
 * @returns rank_type 稀有度数值字符串，解析失败返回空字符串
 */
export function parseZenlessZoneZeroRankType(
  ext: string,
  categoryId: number
): string {
  try {
    const extData = JSON.parse(ext);
    const categoryKey = `c_${categoryId}`;
    const filterText = extData?.[categoryKey]?.filter?.text;

    if (!filterText) {
      return '';
    }

    const filterArray = JSON.parse(filterText);
    const rankItem = filterArray.find((item: string) =>
      item.includes('稀有度/')
    );

    if (!rankItem) {
      return '';
    }

    const rankName = rankItem.replace('稀有度/', '');
    return ZENLESS_ZONE_ZERO_RANK_TYPE_MAP[rankName] || '';
  } catch {
    return '';
  }
}

/**
 * 从 ext 字段中解析崩坏：星穹铁道角色的命途类型
 * @param ext ext JSON字符串
 * @returns 命途类型（英文），解析失败返回空字符串
 */
export function parseHonkaiStarRailCharacterPath(ext: string): string {
  try {
    const extData = JSON.parse(ext);
    const filterText = extData?.c_18?.filter?.text;

    if (!filterText) {
      return '';
    }

    const filterArray = JSON.parse(filterText);
    const pathItem = filterArray.find((item: string) => item.includes('命途/'));

    if (!pathItem) {
      return '';
    }

    const pathName = pathItem.replace('命途/', '');
    return HONKAI_STAR_RAIL_PATH_TYPE_MAP[pathName] || '';
  } catch {
    return '';
  }
}

/**
 * 从 ext 字段中解析崩坏：星穹铁道角色的属性类型
 * @param ext ext JSON字符串
 * @returns 属性类型（英文），解析失败返回空字符串
 */
export function parseHonkaiStarRailCharacterCombatType(ext: string): string {
  try {
    const extData = JSON.parse(ext);
    const filterText = extData?.c_18?.filter?.text;

    if (!filterText) {
      return '';
    }

    const filterArray = JSON.parse(filterText);
    const combatItem = filterArray.find((item: string) =>
      item.includes('属性/')
    );

    if (!combatItem) {
      return '';
    }

    const combatName = combatItem.replace('属性/', '');
    return HONKAI_STAR_RAIL_COMBAT_TYPE_MAP[combatName] || '';
  } catch {
    return '';
  }
}

/**
 * 从 ext 字段中解析崩坏：星穹铁道光锥的命途类型
 * @param ext ext JSON字符串
 * @returns 命途类型（英文），解析失败返回空字符串
 */
export function parseHonkaiStarRailLightConePath(ext: string): string {
  try {
    const extData = JSON.parse(ext);
    const filterText = extData?.c_19?.filter?.text;

    if (!filterText) {
      return '';
    }

    const filterArray = JSON.parse(filterText);
    const pathItem = filterArray.find((item: string) => item.includes('命途/'));

    if (!pathItem) {
      return '';
    }

    const pathName = pathItem.replace('命途/', '');
    return HONKAI_STAR_RAIL_PATH_TYPE_MAP[pathName] || '';
  } catch {
    return '';
  }
}

/**
 * 从 ext 字段中解析绝区零代理人的属性类型
 * @param ext ext JSON字符串
 * @returns 属性类型（英文），解析失败返回空字符串
 */
export function parseZenlessZoneZeroAgentAttribute(ext: string): string {
  try {
    const extData = JSON.parse(ext);
    const filterText = extData?.c_43?.filter?.text;

    if (!filterText) {
      return '';
    }

    const filterArray = JSON.parse(filterText);
    const attributeItem = filterArray.find((item: string) =>
      item.includes('属性/')
    );

    if (!attributeItem) {
      return '';
    }

    const attributeName = attributeItem.replace('属性/', '');
    return ZENLESS_ZONE_ZERO_ATTRIBUTE_MAP[attributeName] || '';
  } catch {
    return '';
  }
}

/**
 * 从 ext 字段中解析绝区零代理人的特性类型
 * @param ext ext JSON字符串
 * @returns 特性类型（英文），解析失败返回空字符串
 */
export function parseZenlessZoneZeroAgentSpecialty(ext: string): string {
  try {
    const extData = JSON.parse(ext);
    const filterText = extData?.c_43?.filter?.text;

    if (!filterText) {
      return '';
    }

    const filterArray = JSON.parse(filterText);
    const specialtyItem = filterArray.find((item: string) =>
      item.includes('特性/')
    );

    if (!specialtyItem) {
      return '';
    }

    const specialtyName = specialtyItem.replace('特性/', '');
    return ZENLESS_ZONE_ZERO_SPECIALTY_MAP[specialtyName] || '';
  } catch {
    return '';
  }
}

/**
 * 从 ext 字段中解析绝区零音擎的特性类型
 * @param ext ext JSON字符串
 * @returns 特性类型（英文），解析失败返回空字符串
 */
export function parseZenlessZoneZeroWEngineSpecialty(ext: string): string {
  try {
    const extData = JSON.parse(ext);
    const filterText = extData?.c_45?.filter?.text;

    if (!filterText) {
      return '';
    }

    const filterArray = JSON.parse(filterText);
    const specialtyItem = filterArray.find((item: string) =>
      item.includes('特性/')
    );

    if (!specialtyItem) {
      return '';
    }

    const specialtyName = specialtyItem.replace('特性/', '');
    return ZENLESS_ZONE_ZERO_SPECIALTY_MAP[specialtyName] || '';
  } catch {
    return '';
  }
}
