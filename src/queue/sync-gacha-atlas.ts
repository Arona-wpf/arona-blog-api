import { IProcessor, Processor } from '@midwayjs/bullmq';
import { Config, FORMAT, Inject, Logger } from '@midwayjs/core';
import { MidwayI18nService } from '@midwayjs/i18n';
import { ILogger } from '@midwayjs/logger';
import { AxiosInstance } from 'axios';

import {
  GENSHIN_IMPACT_ELEMENT_TYPE_I18N_KEY_MAP,
  GENSHIN_IMPACT_WEAPON_TYPE_I18N_KEY_MAP,
  HONKAI_STAR_RAIL_COMBAT_TYPE_I18N_KEY_MAP,
  HONKAI_STAR_RAIL_PATH_TYPE_I18N_KEY_MAP,
  parseGenshinAndStarRailRankType,
  parseGenshinImpactCharacterElement,
  parseGenshinImpactCharacterWeaponType,
  parseGenshinImpactWeaponRankType,
  parseGenshinImpactWeaponType,
  parseHonkaiStarRailCharacterCombatType,
  parseHonkaiStarRailCharacterPath,
  parseHonkaiStarRailLightConePath,
  parseZenlessZoneZeroAgentAttribute,
  parseZenlessZoneZeroAgentSpecialty,
  parseZenlessZoneZeroRankType,
  parseZenlessZoneZeroWEngineSpecialty,
  ZENLESS_ZONE_ZERO_ATTRIBUTE_I18N_KEY_MAP,
  ZENLESS_ZONE_ZERO_SPECIALTY_I18N_KEY_MAP,
} from '@/definition/constants/gacha.constant';
import { GachaItemTypeEnum, GameTypeEnum } from '@/definition/enums/gacha.enum';
import { QueueNameEnum } from '@/definition/enums/queue.enum';
import {
  IMiyousheGenshinImpactWikiResponse,
  IMiyousheWikiResponse,
} from '@/definition/types/gacha.type';
import { GachaAtlasEntity } from '@/entity/gacha-atlas.entity';
import { AxiosHelper } from '@/helper/axios.helper';
import { ISyncGachaAtlasConfig } from '@/interface';
import { GachaAtlasService } from '@/service/gacha-atlas.service';

@Processor(QueueNameEnum.SYNC_GACHA_ATLAS, {
  repeat: {
    pattern: FORMAT.CRONTAB.EVERY_HOUR,
  },
})
export class SyncGachaAtlasProcessor implements IProcessor {
  @Config('syncGachaAtlas')
  syncGachaAtlasConfig: ISyncGachaAtlasConfig;

  @Inject()
  axiosHelper: AxiosHelper;

  @Inject()
  gachaAtlasService: GachaAtlasService;

  @Inject()
  i18nService: MidwayI18nService;

  @Logger('queueLogger')
  queueLogger: ILogger;

  /**
   * 获取中英文组合文本
   * @param enKey 英文值
   * @param i18nKeyMap i18n key 映射
   * @returns 格式化文本 "英文/中文"
   */
  private getEnZhText(
    enKey: string,
    i18nKeyMap: Record<string, string>
  ): string {
    if (!enKey) return '';
    const i18nKey = i18nKeyMap[enKey];
    if (!i18nKey) return enKey;
    const zh = this.i18nService.translate(i18nKey, {
      group: 'gacha',
      locale: 'zh-cn',
    });
    return `${enKey}/${zh}`;
  }

  async execute() {
    this.queueLogger.info(
      '[SyncGachaAtlasProcessor] Starting sync gacha atlas processor'
    );

    const axiosInstance = await this.axiosHelper.getAxiosInstance('miyoushe');

    // 同步原神祈愿物品图鉴
    try {
      await this.syncGenshinImpactGachaAtlas(axiosInstance);
    } catch (error) {
      this.queueLogger.error(
        '[SyncGachaAtlasProcessor] Sync genshin impact gacha atlas error',
        error
      );
    }

    // 同步崩坏：星穹铁道祈愿物品图鉴
    try {
      await this.syncHonkaiStarRailGachaAtlas(axiosInstance);
    } catch (error) {
      this.queueLogger.error(
        '[SyncGachaAtlasProcessor] Sync honkai star rail gacha atlas error',
        error
      );
    }

    // 同步绝区零祈愿物品图鉴
    try {
      await this.syncZenlessZoneZeroGachaAtlas(axiosInstance);
    } catch (error) {
      this.queueLogger.error(
        '[SyncGachaAtlasProcessor] Sync zenless zone zero gacha atlas error',
        error
      );
    }

    this.queueLogger.info(
      '[SyncGachaAtlasProcessor] Sync gacha atlas processor completed'
    );
  }

  /**
   * 同步原神祈愿物品图鉴
   * @param axiosInstance Axios实例
   */
  async syncGenshinImpactGachaAtlas(axiosInstance: AxiosInstance) {
    let skipCharacterSync = false;
    let skipWeaponSync = false;
    const characterPath =
      this.syncGachaAtlasConfig.api_path.genshin_impact.character;
    const weaponPath = this.syncGachaAtlasConfig.api_path.genshin_impact.weapon;

    if (!characterPath) {
      this.queueLogger.warn(
        '[SyncGachaAtlasProcessor] Character path is not set, skipping character sync'
      );
      skipCharacterSync = true;
    }
    if (!weaponPath) {
      this.queueLogger.warn(
        '[SyncGachaAtlasProcessor] Weapon path is not set, skipping weapon sync'
      );
      skipWeaponSync = true;
    }

    const currentTime = Date.now().valueOf();

    // 同步角色祈愿物品图鉴
    let newCharacterCount = 0;
    let updatedCharacterCount = 0;
    if (!skipCharacterSync) {
      try {
        const characterResponse =
          await axiosInstance.get<IMiyousheGenshinImpactWikiResponse>(
            characterPath
          );

        if (characterResponse.data.retcode !== 0) {
          this.queueLogger.error(
            '[SyncGachaAtlasProcessor] Character API returned error: retcode=%d, message=%s',
            characterResponse.data.retcode,
            characterResponse.data.message
          );
          return;
        }

        const characterCategory = characterResponse.data.data.list.find(
          item => item.id === 25 // 角色分类ID
        );

        if (!characterCategory || !characterCategory.list) {
          this.queueLogger.error(
            '[SyncGachaAtlasProcessor] Character category not found in response'
          );
          return;
        }

        // 过滤掉预告和奇偶
        const validCharacters = characterCategory.list.filter(
          item =>
            !item.title.includes('奇偶') &&
            !item.title.includes('预告') &&
            !item.title.includes('前瞻') &&
            !item.title.includes('卫星')
        );

        // 获取现有数据库中的角色数据
        const existingCharacters =
          await this.gachaAtlasService.findByContentIds(
            GameTypeEnum.GENSHIN_IMPACT,
            validCharacters.map(item => item.content_id)
          );

        const existingMap = new Map(
          existingCharacters.map(item => [item.content_id, item])
        );

        // 找出新增的角色
        const newCharacters = validCharacters.filter(
          item => !existingMap.has(item.content_id)
        );

        // 找出需要更新的角色（icon_url、rank_type、character_element或weapon_type有变化）
        const charactersToUpdate = validCharacters.filter(item => {
          const existing = existingMap.get(item.content_id);
          if (!existing) return false;
          const newRankType = parseGenshinAndStarRailRankType(item.ext, 25);
          const newCharacterElement = parseGenshinImpactCharacterElement(
            item.ext
          );
          const newWeaponType = parseGenshinImpactCharacterWeaponType(item.ext);
          return (
            existing.icon_url !== item.icon ||
            existing.rank_type !== newRankType ||
            existing.character_element !== newCharacterElement ||
            existing.weapon_type !== newWeaponType
          );
        });

        if (newCharacters.length > 0) {
          // 创建新增角色的图鉴数据
          const gachaAtlasEntities: GachaAtlasEntity[] = newCharacters.map(
            item => {
              const rankType = parseGenshinAndStarRailRankType(item.ext, 25);
              const characterElement = parseGenshinImpactCharacterElement(
                item.ext
              );
              const weaponType = parseGenshinImpactCharacterWeaponType(
                item.ext
              );
              this.queueLogger.info(
                '[SyncGachaAtlasProcessor] Creating new character: %s, rank_type: %s, element: %s, weapon: %s',
                item.title,
                rankType,
                this.getEnZhText(
                  characterElement,
                  GENSHIN_IMPACT_ELEMENT_TYPE_I18N_KEY_MAP
                ),
                this.getEnZhText(
                  weaponType,
                  GENSHIN_IMPACT_WEAPON_TYPE_I18N_KEY_MAP
                )
              );
              const gachaAtlasEntity = new GachaAtlasEntity();
              Object.assign(gachaAtlasEntity, {
                game_type: GameTypeEnum.GENSHIN_IMPACT,
                content_id: item.content_id,
                item_id: '', // 暂时为空，后续会通过别的地方同步
                item_name: item.title,
                item_type: GachaItemTypeEnum.CHARACTER,
                rank_type: rankType,
                character_element: characterElement,
                weapon_type: weaponType,
                icon_url: item.icon,
                created_at: currentTime,
                updated_at: currentTime,
              });
              return gachaAtlasEntity;
            }
          );

          await this.gachaAtlasService.batchCreateGachaAtlas(
            gachaAtlasEntities
          );
          newCharacterCount = gachaAtlasEntities.length;
        }

        if (charactersToUpdate.length > 0) {
          // 批量更新
          const updates = charactersToUpdate.map(item => ({
            content_id: item.content_id,
            updateData: {
              icon_url: item.icon,
              rank_type: parseGenshinAndStarRailRankType(item.ext, 25),
              character_element: parseGenshinImpactCharacterElement(item.ext),
              weapon_type: parseGenshinImpactCharacterWeaponType(item.ext),
              updated_at: currentTime,
            },
          }));

          await this.gachaAtlasService.batchUpdateByContentIds(
            GameTypeEnum.GENSHIN_IMPACT,
            updates
          );
          updatedCharacterCount = charactersToUpdate.length;
        }
      } catch (error) {
        this.queueLogger.error(
          '[SyncGachaAtlasProcessor] Error syncing characters',
          error
        );
      }
    }

    // 同步武器祈愿物品图鉴
    let newWeaponCount = 0;
    let updatedWeaponCount = 0;
    if (!skipWeaponSync) {
      try {
        const weaponResponse =
          await axiosInstance.get<IMiyousheGenshinImpactWikiResponse>(
            weaponPath
          );

        if (weaponResponse.data.retcode !== 0) {
          this.queueLogger.error(
            '[SyncGachaAtlasProcessor] Weapon API returned error: retcode=%d, message=%s',
            weaponResponse.data.retcode,
            weaponResponse.data.message
          );
          return;
        }

        const weaponCategory = weaponResponse.data.data.list.find(
          item => item.id === 5 // 武器分类ID
        );

        if (!weaponCategory || !weaponCategory.list) {
          this.queueLogger.error(
            '[SyncGachaAtlasProcessor] Weapon category not found in response'
          );
          return;
        }

        // 获取现有数据库中的武器数据
        const existingWeapons = await this.gachaAtlasService.findByContentIds(
          GameTypeEnum.GENSHIN_IMPACT,
          weaponCategory.list.map(item => item.content_id)
        );

        const existingMap = new Map(
          existingWeapons.map(item => [item.content_id, item])
        );

        // 找出新增的武器
        const newWeapons = weaponCategory.list.filter(
          item => !existingMap.has(item.content_id)
        );

        // 找出需要更新的武器（icon_url、rank_type或weapon_type有变化）
        const weaponsToUpdate = weaponCategory.list.filter(item => {
          const existing = existingMap.get(item.content_id);
          if (!existing) return false;
          const newRankType = parseGenshinImpactWeaponRankType(item.ext);
          const newWeaponType = parseGenshinImpactWeaponType(item.ext);
          return (
            existing.icon_url !== item.icon ||
            existing.rank_type !== newRankType ||
            existing.weapon_type !== newWeaponType
          );
        });

        if (newWeapons.length > 0) {
          // 创建新增武器的图鉴数据
          const gachaAtlasEntities: GachaAtlasEntity[] = newWeapons.map(
            item => {
              const rankType = parseGenshinImpactWeaponRankType(item.ext);
              const weaponType = parseGenshinImpactWeaponType(item.ext);
              this.queueLogger.info(
                '[SyncGachaAtlasProcessor] Creating new weapon: %s, rank_type: %s, weapon_type: %s',
                item.title,
                rankType,
                this.getEnZhText(
                  weaponType,
                  GENSHIN_IMPACT_WEAPON_TYPE_I18N_KEY_MAP
                )
              );
              const gachaAtlasEntity = new GachaAtlasEntity();
              Object.assign(gachaAtlasEntity, {
                game_type: GameTypeEnum.GENSHIN_IMPACT,
                content_id: item.content_id,
                item_id: '', // 暂时为空，后续会通过别的地方同步
                item_name: item.title,
                item_type: GachaItemTypeEnum.WEAPON,
                rank_type: rankType,
                weapon_type: weaponType,
                icon_url: item.icon,
                created_at: currentTime,
                updated_at: currentTime,
              });
              return gachaAtlasEntity;
            }
          );

          await this.gachaAtlasService.batchCreateGachaAtlas(
            gachaAtlasEntities
          );
          newWeaponCount = gachaAtlasEntities.length;
        }

        if (weaponsToUpdate.length > 0) {
          // 批量更新
          const updates = weaponsToUpdate.map(item => ({
            content_id: item.content_id,
            updateData: {
              icon_url: item.icon,
              rank_type: parseGenshinImpactWeaponRankType(item.ext),
              weapon_type: parseGenshinImpactWeaponType(item.ext),
              updated_at: currentTime,
            },
          }));

          await this.gachaAtlasService.batchUpdateByContentIds(
            GameTypeEnum.GENSHIN_IMPACT,
            updates
          );
          updatedWeaponCount = weaponsToUpdate.length;
        }
      } catch (error) {
        this.queueLogger.error(
          '[SyncGachaAtlasProcessor] Error syncing weapons',
          error
        );
      }
    }

    this.queueLogger.info(
      '[SyncGachaAtlasProcessor] Genshin impact gacha atlas sync completed: %d new characters, %d updated characters, %d new weapons, %d updated weapons',
      newCharacterCount,
      updatedCharacterCount,
      newWeaponCount,
      updatedWeaponCount
    );
  }

  /**
   * 同步崩坏：星穹铁道祈愿物品图鉴
   * @param axiosInstance Axios实例
   */
  async syncHonkaiStarRailGachaAtlas(axiosInstance: AxiosInstance) {
    this.queueLogger.info(
      '[SyncGachaAtlasProcessor] Syncing honkai star rail gacha atlas'
    );

    const allPath = this.syncGachaAtlasConfig.api_path.honkai_star_rail.all;

    if (!allPath) {
      this.queueLogger.warn(
        '[SyncGachaAtlasProcessor] Honkai star rail path is not set, skipping sync'
      );
      return;
    }

    const currentTime = Date.now().valueOf();

    try {
      const response = await axiosInstance.get<IMiyousheWikiResponse>(allPath);

      if (response.data.retcode !== 0) {
        this.queueLogger.error(
          '[SyncGachaAtlasProcessor] Honkai star rail API returned error: retcode=%d, message=%s',
          response.data.retcode,
          response.data.message
        );
        return;
      }

      // 找到游戏图鉴分类(id=17)
      const gameWikiCategory = response.data.data.list.find(
        item => item.id === 17
      );

      if (!gameWikiCategory || !gameWikiCategory.children) {
        this.queueLogger.error(
          '[SyncGachaAtlasProcessor] Game wiki category not found in response'
        );
        return;
      }

      // 同步角色(id=18)
      const characterCategory = gameWikiCategory.children.find(
        item => item.id === 18
      );
      let newCharacterCount = 0;
      let updatedCharacterCount = 0;

      if (characterCategory && characterCategory.list) {
        const validCharacters = characterCategory.list.filter(
          item =>
            !item.title.includes('预告') &&
            !item.title.includes('卫星') &&
            !item.title.includes('前瞻')
        );

        const existingCharacters =
          await this.gachaAtlasService.findByContentIds(
            GameTypeEnum.HONKAI_STAR_RAIL,
            validCharacters.map(item => item.content_id)
          );

        const existingMap = new Map(
          existingCharacters.map(item => [item.content_id, item])
        );

        const newCharacters = validCharacters.filter(item => {
          if (existingMap.has(item.content_id)) return false;
          const rankType = parseGenshinAndStarRailRankType(item.ext, 18);
          if (!rankType) {
            this.queueLogger.warn(
              '[SyncGachaAtlasProcessor] Skipping honkai star rail character %s: rank_type not found (may be preview/satellite)',
              item.title
            );
            return false;
          }
          return true;
        });

        const charactersToUpdate = validCharacters.filter(item => {
          const existing = existingMap.get(item.content_id);
          if (!existing) return false;
          const newRankType = parseGenshinAndStarRailRankType(item.ext, 18);
          if (!newRankType) return false;
          const newPath = parseHonkaiStarRailCharacterPath(item.ext);
          const newCombatType = parseHonkaiStarRailCharacterCombatType(
            item.ext
          );
          return (
            existing.icon_url !== item.icon ||
            existing.rank_type !== newRankType ||
            existing.path !== newPath ||
            existing.combat_type !== newCombatType
          );
        });

        if (newCharacters.length > 0) {
          const gachaAtlasEntities: GachaAtlasEntity[] = newCharacters.map(
            item => {
              const rankType = parseGenshinAndStarRailRankType(item.ext, 18);
              const path = parseHonkaiStarRailCharacterPath(item.ext);
              const combatType = parseHonkaiStarRailCharacterCombatType(
                item.ext
              );
              this.queueLogger.info(
                '[SyncGachaAtlasProcessor] Creating new honkai star rail character: %s, rank_type: %s, path: %s, combat_type: %s',
                item.title,
                rankType,
                this.getEnZhText(path, HONKAI_STAR_RAIL_PATH_TYPE_I18N_KEY_MAP),
                this.getEnZhText(
                  combatType,
                  HONKAI_STAR_RAIL_COMBAT_TYPE_I18N_KEY_MAP
                )
              );
              const gachaAtlasEntity = new GachaAtlasEntity();
              Object.assign(gachaAtlasEntity, {
                game_type: GameTypeEnum.HONKAI_STAR_RAIL,
                content_id: item.content_id,
                item_id: '',
                item_name: item.title,
                item_type: GachaItemTypeEnum.CHARACTER,
                rank_type: rankType,
                path: path,
                combat_type: combatType,
                icon_url: item.icon,
                created_at: currentTime,
                updated_at: currentTime,
              });
              return gachaAtlasEntity;
            }
          );

          await this.gachaAtlasService.batchCreateGachaAtlas(
            gachaAtlasEntities
          );
          newCharacterCount = gachaAtlasEntities.length;
        }

        if (charactersToUpdate.length > 0) {
          const updates = charactersToUpdate.map(item => ({
            content_id: item.content_id,
            updateData: {
              icon_url: item.icon,
              rank_type: parseGenshinAndStarRailRankType(item.ext, 18),
              path: parseHonkaiStarRailCharacterPath(item.ext),
              combat_type: parseHonkaiStarRailCharacterCombatType(item.ext),
              updated_at: currentTime,
            },
          }));

          await this.gachaAtlasService.batchUpdateByContentIds(
            GameTypeEnum.HONKAI_STAR_RAIL,
            updates
          );
          updatedCharacterCount = charactersToUpdate.length;
        }
      }

      // 同步光锥(id=19)
      const lightConeCategory = gameWikiCategory.children.find(
        item => item.id === 19
      );
      let newLightConeCount = 0;
      let updatedLightConeCount = 0;

      if (lightConeCategory && lightConeCategory.list) {
        const existingLightCones =
          await this.gachaAtlasService.findByContentIds(
            GameTypeEnum.HONKAI_STAR_RAIL,
            lightConeCategory.list.map(item => item.content_id)
          );

        const existingMap = new Map(
          existingLightCones.map(item => [item.content_id, item])
        );

        const newLightCones = lightConeCategory.list.filter(item => {
          if (existingMap.has(item.content_id)) return false;
          const rankType = parseGenshinAndStarRailRankType(item.ext, 19);
          if (!rankType) {
            this.queueLogger.warn(
              '[SyncGachaAtlasProcessor] Skipping honkai star rail light cone %s: rank_type not found (may be preview/satellite)',
              item.title
            );
            return false;
          }
          return true;
        });

        const lightConesToUpdate = lightConeCategory.list.filter(item => {
          const existing = existingMap.get(item.content_id);
          if (!existing) return false;
          const newRankType = parseGenshinAndStarRailRankType(item.ext, 19);
          if (!newRankType) return false;
          const newPath = parseHonkaiStarRailLightConePath(item.ext);
          return (
            existing.icon_url !== item.icon ||
            existing.rank_type !== newRankType ||
            existing.path !== newPath
          );
        });

        if (newLightCones.length > 0) {
          const gachaAtlasEntities: GachaAtlasEntity[] = newLightCones.map(
            item => {
              const rankType = parseGenshinAndStarRailRankType(item.ext, 19);
              const path = parseHonkaiStarRailLightConePath(item.ext);
              this.queueLogger.info(
                '[SyncGachaAtlasProcessor] Creating new honkai star rail light cone: %s, rank_type: %s, path: %s',
                item.title,
                rankType,
                this.getEnZhText(path, HONKAI_STAR_RAIL_PATH_TYPE_I18N_KEY_MAP)
              );
              const gachaAtlasEntity = new GachaAtlasEntity();
              Object.assign(gachaAtlasEntity, {
                game_type: GameTypeEnum.HONKAI_STAR_RAIL,
                content_id: item.content_id,
                item_id: '',
                item_name: item.title,
                item_type: GachaItemTypeEnum.WEAPON,
                rank_type: rankType,
                path: path,
                icon_url: item.icon,
                created_at: currentTime,
                updated_at: currentTime,
              });
              return gachaAtlasEntity;
            }
          );

          await this.gachaAtlasService.batchCreateGachaAtlas(
            gachaAtlasEntities
          );
          newLightConeCount = gachaAtlasEntities.length;
        }

        if (lightConesToUpdate.length > 0) {
          const updates = lightConesToUpdate.map(item => ({
            content_id: item.content_id,
            updateData: {
              icon_url: item.icon,
              rank_type: parseGenshinAndStarRailRankType(item.ext, 19),
              path: parseHonkaiStarRailLightConePath(item.ext),
              updated_at: currentTime,
            },
          }));

          await this.gachaAtlasService.batchUpdateByContentIds(
            GameTypeEnum.HONKAI_STAR_RAIL,
            updates
          );
          updatedLightConeCount = lightConesToUpdate.length;
        }
      }

      this.queueLogger.info(
        '[SyncGachaAtlasProcessor] Honkai star rail gacha atlas sync completed: %d new characters, %d updated characters, %d new light cones, %d updated light cones',
        newCharacterCount,
        updatedCharacterCount,
        newLightConeCount,
        updatedLightConeCount
      );
    } catch (error) {
      this.queueLogger.error(
        '[SyncGachaAtlasProcessor] Error syncing honkai star rail gacha atlas',
        error
      );
    }
  }

  /**
   * 同步绝区零祈愿物品图鉴
   * @param axiosInstance Axios实例
   */
  async syncZenlessZoneZeroGachaAtlas(axiosInstance: AxiosInstance) {
    this.queueLogger.info(
      '[SyncGachaAtlasProcessor] Syncing zenless zone zero gacha atlas'
    );

    const allPath = this.syncGachaAtlasConfig.api_path.zenless_zone_zero.all;

    if (!allPath) {
      this.queueLogger.warn(
        '[SyncGachaAtlasProcessor] Zenless zone zero path is not set, skipping sync'
      );
      return;
    }

    const currentTime = Date.now().valueOf();

    try {
      const response = await axiosInstance.get<IMiyousheWikiResponse>(allPath);

      if (response.data.retcode !== 0) {
        this.queueLogger.error(
          '[SyncGachaAtlasProcessor] Zenless zone zero API returned error: retcode=%d, message=%s',
          response.data.retcode,
          response.data.message
        );
        return;
      }

      // 找到游戏图鉴分类(id=2)
      const gameWikiCategory = response.data.data.list.find(
        item => item.id === 2
      );

      if (!gameWikiCategory || !gameWikiCategory.children) {
        this.queueLogger.error(
          '[SyncGachaAtlasProcessor] Game wiki category not found in response'
        );
        return;
      }

      // 同步代理人(id=43)
      const agentCategory = gameWikiCategory.children.find(
        item => item.id === 43
      );
      let newAgentCount = 0;
      let updatedAgentCount = 0;

      if (agentCategory && agentCategory.list) {
        const existingAgents = await this.gachaAtlasService.findByContentIds(
          GameTypeEnum.ZENLESS_ZONE_ZERO,
          agentCategory.list.map(item => item.content_id)
        );

        const existingMap = new Map(
          existingAgents.map(item => [item.content_id, item])
        );

        const newAgents = agentCategory.list.filter(item => {
          if (existingMap.has(item.content_id)) return false;
          const rankType = parseZenlessZoneZeroRankType(item.ext, 43);
          if (!rankType) {
            this.queueLogger.warn(
              '[SyncGachaAtlasProcessor] Skipping zenless zone zero agent %s: rank_type not found (may be preview/satellite)',
              item.title
            );
            return false;
          }
          return true;
        });

        const agentsToUpdate = agentCategory.list.filter(item => {
          const existing = existingMap.get(item.content_id);
          if (!existing) return false;
          const newRankType = parseZenlessZoneZeroRankType(item.ext, 43);
          if (!newRankType) return false;
          const newAttribute = parseZenlessZoneZeroAgentAttribute(item.ext);
          const newSpecialty = parseZenlessZoneZeroAgentSpecialty(item.ext);
          return (
            existing.icon_url !== item.icon ||
            existing.rank_type !== newRankType ||
            existing.attribute !== newAttribute ||
            existing.specialty !== newSpecialty
          );
        });

        if (newAgents.length > 0) {
          const gachaAtlasEntities: GachaAtlasEntity[] = newAgents.map(item => {
            const rankType = parseZenlessZoneZeroRankType(item.ext, 43);
            const attribute = parseZenlessZoneZeroAgentAttribute(item.ext);
            const specialty = parseZenlessZoneZeroAgentSpecialty(item.ext);
            this.queueLogger.info(
              '[SyncGachaAtlasProcessor] Creating new zenless zone zero agent: %s, rank_type: %s, attribute: %s, specialty: %s',
              item.title,
              rankType,
              this.getEnZhText(
                attribute,
                ZENLESS_ZONE_ZERO_ATTRIBUTE_I18N_KEY_MAP
              ),
              this.getEnZhText(
                specialty,
                ZENLESS_ZONE_ZERO_SPECIALTY_I18N_KEY_MAP
              )
            );
            const gachaAtlasEntity = new GachaAtlasEntity();
            Object.assign(gachaAtlasEntity, {
              game_type: GameTypeEnum.ZENLESS_ZONE_ZERO,
              content_id: item.content_id,
              item_id: '',
              item_name: item.title,
              item_type: GachaItemTypeEnum.CHARACTER,
              rank_type: rankType,
              attribute: attribute,
              specialty: specialty,
              icon_url: item.icon,
              created_at: currentTime,
              updated_at: currentTime,
            });
            return gachaAtlasEntity;
          });

          await this.gachaAtlasService.batchCreateGachaAtlas(
            gachaAtlasEntities
          );
          newAgentCount = gachaAtlasEntities.length;
        }

        if (agentsToUpdate.length > 0) {
          const updates = agentsToUpdate.map(item => ({
            content_id: item.content_id,
            updateData: {
              icon_url: item.icon,
              rank_type: parseZenlessZoneZeroRankType(item.ext, 43),
              attribute: parseZenlessZoneZeroAgentAttribute(item.ext),
              specialty: parseZenlessZoneZeroAgentSpecialty(item.ext),
              updated_at: currentTime,
            },
          }));

          await this.gachaAtlasService.batchUpdateByContentIds(
            GameTypeEnum.ZENLESS_ZONE_ZERO,
            updates
          );
          updatedAgentCount = agentsToUpdate.length;
        }
      }

      // 同步邦布(id=44)
      const banbooCategory = gameWikiCategory.children.find(
        item => item.id === 44
      );
      let newBanbooCount = 0;
      let updatedBanbooCount = 0;

      if (banbooCategory && banbooCategory.list) {
        const existingBanboos = await this.gachaAtlasService.findByContentIds(
          GameTypeEnum.ZENLESS_ZONE_ZERO,
          banbooCategory.list.map(item => item.content_id)
        );

        const existingMap = new Map(
          existingBanboos.map(item => [item.content_id, item])
        );

        const newBanboos = banbooCategory.list.filter(item => {
          if (existingMap.has(item.content_id)) return false;
          const rankType = parseZenlessZoneZeroRankType(item.ext, 44);
          if (!rankType) {
            this.queueLogger.warn(
              '[SyncGachaAtlasProcessor] Skipping zenless zone zero banboo %s: rank_type not found (may be preview/satellite)',
              item.title
            );
            return false;
          }
          return true;
        });

        const banboosToUpdate = banbooCategory.list.filter(item => {
          const existing = existingMap.get(item.content_id);
          if (!existing) return false;
          const newRankType = parseZenlessZoneZeroRankType(item.ext, 44);
          if (!newRankType) return false;
          return (
            existing.icon_url !== item.icon ||
            existing.rank_type !== newRankType
          );
        });

        if (newBanboos.length > 0) {
          const gachaAtlasEntities: GachaAtlasEntity[] = newBanboos.map(
            item => {
              const rankType = parseZenlessZoneZeroRankType(item.ext, 44);
              this.queueLogger.info(
                '[SyncGachaAtlasProcessor] Creating new zenless zone zero banboo: %s, rank_type: %s',
                item.title,
                rankType
              );
              const gachaAtlasEntity = new GachaAtlasEntity();
              Object.assign(gachaAtlasEntity, {
                game_type: GameTypeEnum.ZENLESS_ZONE_ZERO,
                content_id: item.content_id,
                item_id: '',
                item_name: item.title,
                item_type: GachaItemTypeEnum.BANBOO,
                rank_type: rankType,
                icon_url: item.icon,
                created_at: currentTime,
                updated_at: currentTime,
              });
              return gachaAtlasEntity;
            }
          );

          await this.gachaAtlasService.batchCreateGachaAtlas(
            gachaAtlasEntities
          );
          newBanbooCount = gachaAtlasEntities.length;
        }

        if (banboosToUpdate.length > 0) {
          const updates = banboosToUpdate.map(item => ({
            content_id: item.content_id,
            updateData: {
              icon_url: item.icon,
              rank_type: parseZenlessZoneZeroRankType(item.ext, 44),
              updated_at: currentTime,
            },
          }));

          await this.gachaAtlasService.batchUpdateByContentIds(
            GameTypeEnum.ZENLESS_ZONE_ZERO,
            updates
          );
          updatedBanbooCount = banboosToUpdate.length;
        }
      }

      // 同步音擎(id=45)
      const wEngineCategory = gameWikiCategory.children.find(
        item => item.id === 45
      );
      let newWEngineCount = 0;
      let updatedWEngineCount = 0;

      if (wEngineCategory && wEngineCategory.list) {
        const existingWEngines = await this.gachaAtlasService.findByContentIds(
          GameTypeEnum.ZENLESS_ZONE_ZERO,
          wEngineCategory.list.map(item => item.content_id)
        );

        const existingMap = new Map(
          existingWEngines.map(item => [item.content_id, item])
        );

        const newWEngines = wEngineCategory.list.filter(item => {
          if (existingMap.has(item.content_id)) return false;
          const rankType = parseZenlessZoneZeroRankType(item.ext, 45);
          if (!rankType) {
            this.queueLogger.warn(
              '[SyncGachaAtlasProcessor] Skipping zenless zone zero w-engine %s: rank_type not found (may be preview/satellite)',
              item.title
            );
            return false;
          }
          return true;
        });

        const wEnginesToUpdate = wEngineCategory.list.filter(item => {
          const existing = existingMap.get(item.content_id);
          if (!existing) return false;
          const newRankType = parseZenlessZoneZeroRankType(item.ext, 45);
          if (!newRankType) return false;
          const newSpecialty = parseZenlessZoneZeroWEngineSpecialty(item.ext);
          return (
            existing.icon_url !== item.icon ||
            existing.rank_type !== newRankType ||
            existing.specialty !== newSpecialty
          );
        });

        if (newWEngines.length > 0) {
          const gachaAtlasEntities: GachaAtlasEntity[] = newWEngines.map(
            item => {
              const rankType = parseZenlessZoneZeroRankType(item.ext, 45);
              const specialty = parseZenlessZoneZeroWEngineSpecialty(item.ext);
              this.queueLogger.info(
                '[SyncGachaAtlasProcessor] Creating new zenless zone zero w-engine: %s, rank_type: %s, specialty: %s',
                item.title,
                rankType,
                this.getEnZhText(
                  specialty,
                  ZENLESS_ZONE_ZERO_SPECIALTY_I18N_KEY_MAP
                )
              );
              const gachaAtlasEntity = new GachaAtlasEntity();
              Object.assign(gachaAtlasEntity, {
                game_type: GameTypeEnum.ZENLESS_ZONE_ZERO,
                content_id: item.content_id,
                item_id: '',
                item_name: item.title,
                item_type: GachaItemTypeEnum.WEAPON,
                rank_type: rankType,
                specialty: specialty,
                icon_url: item.icon,
                created_at: currentTime,
                updated_at: currentTime,
              });
              return gachaAtlasEntity;
            }
          );

          await this.gachaAtlasService.batchCreateGachaAtlas(
            gachaAtlasEntities
          );
          newWEngineCount = gachaAtlasEntities.length;
        }

        if (wEnginesToUpdate.length > 0) {
          const updates = wEnginesToUpdate.map(item => ({
            content_id: item.content_id,
            updateData: {
              icon_url: item.icon,
              rank_type: parseZenlessZoneZeroRankType(item.ext, 45),
              specialty: parseZenlessZoneZeroWEngineSpecialty(item.ext),
              updated_at: currentTime,
            },
          }));

          await this.gachaAtlasService.batchUpdateByContentIds(
            GameTypeEnum.ZENLESS_ZONE_ZERO,
            updates
          );
          updatedWEngineCount = wEnginesToUpdate.length;
        }
      }

      this.queueLogger.info(
        '[SyncGachaAtlasProcessor] Zenless zone zero gacha atlas sync completed: %d new agents, %d updated agents, %d new banboos, %d updated banboos, %d new w-engines, %d updated w-engines',
        newAgentCount,
        updatedAgentCount,
        newBanbooCount,
        updatedBanbooCount,
        newWEngineCount,
        updatedWEngineCount
      );
    } catch (error) {
      this.queueLogger.error(
        '[SyncGachaAtlasProcessor] Error syncing zenless zone zero gacha atlas',
        error
      );
    }
  }
}
