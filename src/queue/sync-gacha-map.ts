import { IProcessor, Processor } from '@midwayjs/bullmq';
import { Config, FORMAT, Inject, Logger } from '@midwayjs/core';
import { MidwayI18nService } from '@midwayjs/i18n';
import { ILogger } from '@midwayjs/logger';
import { AxiosInstance } from 'axios';

import {
  GENSHIN_IMPACT_ELEMENT_TYPE_I18N_KEY_MAP,
  GENSHIN_IMPACT_WEAPON_TYPE_I18N_KEY_MAP,
  parseGenshinAndStarRailRankType,
  parseGenshinImpactCharacterElement,
  parseGenshinImpactCharacterWeaponType,
  parseGenshinImpactWeaponRankType,
  parseGenshinImpactWeaponType,
} from '@/definition/constants/gacha.constant';
import { GachaItemTypeEnum, GameTypeEnum } from '@/definition/enums/gacha.enum';
import { QueueNameEnum } from '@/definition/enums/queue.enum';
import { IMiyousheGenshinImpactWikiResponse } from '@/definition/types/gacha.type';
import { GachaMapEntity } from '@/entity/gacha-map.entity';
import { AxiosHelper } from '@/helper/axios.helper';
import { ISyncGachaMapConfig } from '@/interface';
import { GachaMapService } from '@/service/gacha-map.service';

@Processor(QueueNameEnum.SYNC_GACHA_MAP, {
  repeat: {
    // immediately: true,
    pattern: FORMAT.CRONTAB.EVERY_HOUR,
  },
})
export class SyncGachaMapProcessor implements IProcessor {
  @Config('syncGachaMap')
  syncGachaMapConfig: ISyncGachaMapConfig;

  @Inject()
  axiosHelper: AxiosHelper;

  @Inject()
  gachaMapService: GachaMapService;

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
      '[SyncGachaMapProcessor] Starting sync gacha map processor'
    );

    const axiosInstance = await this.axiosHelper.getAxiosInstance('miyoushe');

    // 同步原神祈愿物品映射
    try {
      await this.syncGenshinImpactGachaMap(axiosInstance);
    } catch (error) {
      this.queueLogger.error(
        '[SyncGachaMapProcessor] Sync genshin impact gacha map error',
        error
      );
    }

    // 同步崩坏：星穹铁道祈愿物品映射
    try {
      await this.syncHonkaiStarRailGachaMap(axiosInstance);
    } catch (error) {
      this.queueLogger.error(
        '[SyncGachaMapProcessor] Sync honkai star rail gacha map error',
        error
      );
    }

    // 同步绝区零祈愿物品映射
    try {
      await this.syncZenlessZoneZeroGachaMap(axiosInstance);
    } catch (error) {
      this.queueLogger.error(
        '[SyncGachaMapProcessor] Sync zenless zone zero gacha map error',
        error
      );
    }

    this.queueLogger.info(
      '[SyncGachaMapProcessor] Sync gacha map processor completed'
    );
  }

  /**
   * 同步原神祈愿物品映射
   * @param axiosInstance Axios实例
   */
  async syncGenshinImpactGachaMap(axiosInstance: AxiosInstance) {
    let skipCharacterSync = false;
    let skipWeaponSync = false;
    const characterPath =
      this.syncGachaMapConfig.api_path.genshin_impact.character;
    const weaponPath = this.syncGachaMapConfig.api_path.genshin_impact.weapon;

    if (!characterPath) {
      this.queueLogger.warn(
        '[SyncGachaMapProcessor] Character path is not set, skipping character sync'
      );
      skipCharacterSync = true;
    }
    if (!weaponPath) {
      this.queueLogger.warn(
        '[SyncGachaMapProcessor] Weapon path is not set, skipping weapon sync'
      );
      skipWeaponSync = true;
    }

    const currentTime = Date.now().valueOf();

    // 同步角色祈愿物品映射
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
            '[SyncGachaMapProcessor] Character API returned error: retcode=%d, message=%s',
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
            '[SyncGachaMapProcessor] Character category not found in response'
          );
          return;
        }

        // 过滤掉预告和奇偶
        const validCharacters = characterCategory.list.filter(
          item => !item.title.includes('预告') && !item.title.includes('奇偶')
        );

        // 获取现有数据库中的角色数据
        const existingCharacters = await this.gachaMapService.findByContentIds(
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
          // 创建新增角色的映射数据
          const gachaMapEntities: GachaMapEntity[] = newCharacters.map(item => {
            const rankType = parseGenshinAndStarRailRankType(item.ext, 25);
            const characterElement = parseGenshinImpactCharacterElement(
              item.ext
            );
            const weaponType = parseGenshinImpactCharacterWeaponType(item.ext);
            this.queueLogger.info(
              '[SyncGachaMapProcessor] Creating new character: %s, rank_type: %s, element: %s, weapon: %s',
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
            const gachaMapEntity = new GachaMapEntity();
            Object.assign(gachaMapEntity, {
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
            return gachaMapEntity;
          });

          await this.gachaMapService.batchCreateGachaMap(gachaMapEntities);
          newCharacterCount = gachaMapEntities.length;
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

          await this.gachaMapService.batchUpdateByContentIds(
            GameTypeEnum.GENSHIN_IMPACT,
            updates
          );
          updatedCharacterCount = charactersToUpdate.length;
        }
      } catch (error) {
        this.queueLogger.error(
          '[SyncGachaMapProcessor] Error syncing characters',
          error
        );
      }
    }

    // 同步武器祈愿物品映射
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
            '[SyncGachaMapProcessor] Weapon API returned error: retcode=%d, message=%s',
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
            '[SyncGachaMapProcessor] Weapon category not found in response'
          );
          return;
        }

        // 获取现有数据库中的武器数据
        const existingWeapons = await this.gachaMapService.findByContentIds(
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
          // 创建新增武器的映射数据
          const gachaMapEntities: GachaMapEntity[] = newWeapons.map(item => {
            const rankType = parseGenshinImpactWeaponRankType(item.ext);
            const weaponType = parseGenshinImpactWeaponType(item.ext);
            this.queueLogger.info(
              '[SyncGachaMapProcessor] Creating new weapon: %s, rank_type: %s, weapon_type: %s',
              item.title,
              rankType,
              this.getEnZhText(
                weaponType,
                GENSHIN_IMPACT_WEAPON_TYPE_I18N_KEY_MAP
              )
            );
            const gachaMapEntity = new GachaMapEntity();
            Object.assign(gachaMapEntity, {
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
            return gachaMapEntity;
          });

          await this.gachaMapService.batchCreateGachaMap(gachaMapEntities);
          newWeaponCount = gachaMapEntities.length;
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

          await this.gachaMapService.batchUpdateByContentIds(
            GameTypeEnum.GENSHIN_IMPACT,
            updates
          );
          updatedWeaponCount = weaponsToUpdate.length;
        }
      } catch (error) {
        this.queueLogger.error(
          '[SyncGachaMapProcessor] Error syncing weapons',
          error
        );
      }
    }

    this.queueLogger.info(
      '[SyncGachaMapProcessor] Genshin impact gacha map sync completed: %d new characters, %d updated characters, %d new weapons, %d updated weapons',
      newCharacterCount,
      updatedCharacterCount,
      newWeaponCount,
      updatedWeaponCount
    );
  }

  /**
   * 同步崩坏：星穹铁道祈愿物品映射
   * @param axiosInstance Axios实例
   */
  async syncHonkaiStarRailGachaMap(axiosInstance: AxiosInstance) {
    this.queueLogger.info(
      '[SyncGachaMapProcessor] Syncing honkai star rail gacha map'
    );
    // TODO: 待实现
  }

  /**
   * 同步绝区零祈愿物品映射
   * @param axiosInstance Axios实例
   */
  async syncZenlessZoneZeroGachaMap(axiosInstance: AxiosInstance) {
    this.queueLogger.info(
      '[SyncGachaMapProcessor] Syncing zenless zone zero gacha map'
    );
    // TODO: 待实现
  }
}
