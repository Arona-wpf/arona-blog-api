import { Inject, Logger, Provide } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';

import { GachaConfigDao } from '@/dao/gacha-config.dao';
import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import {
  GenshinImpactServerRegionEnum,
  HonkaiStarRailServerRegionEnum,
  ZenlessZoneZeroServerRegionEnum,
} from '@/definition/enums/gacha.enum';
import { GameTypeEnum } from '@/definition/enums/gacha.enum';
import { GameType } from '@/definition/types/gacha.type';
import { GachaConfigEntity } from '@/entity/gacha-config.entity';

const GAME_REGION_ENUM_MAP: Record<string, string[]> = {
  [GameTypeEnum.GENSHIN_IMPACT]: Object.values(GenshinImpactServerRegionEnum),
  [GameTypeEnum.HONKAI_STAR_RAIL]: Object.values(
    HonkaiStarRailServerRegionEnum
  ),
  [GameTypeEnum.ZENLESS_ZONE_ZERO]: Object.values(
    ZenlessZoneZeroServerRegionEnum
  ),
};

@Provide()
export class GachaConfigService {
  @Inject()
  gachaConfigDao: GachaConfigDao;

  @Logger()
  logger: ILogger;

  private validateRegion(gameType: GameType, region: string): boolean {
    const validRegions = GAME_REGION_ENUM_MAP[gameType];
    return validRegions?.includes(region) ?? false;
  }

  async createGachaConfig(
    account: string,
    gameType: GameType,
    region: string,
    gameUid: string,
    gameNickname: string,
    gachaUrl: string
  ) {
    this.logger.info(
      `[GachaConfigService] Creating gacha config for account: ${account}, gameType: ${gameType}, region: ${region}, uid: ${gameUid}`
    );

    if (!this.validateRegion(gameType, region)) {
      this.logger.error(
        `[GachaConfigService] Invalid region for gameType: ${gameType}, region: ${region}`
      );
      throw BUSINESS_ERROR_CONSTANT.GACHA_SERVER_REGION_NOT_FOUND();
    }

    const existingCount = await this.gachaConfigDao.count({
      account,
      game_type: gameType,
    });
    if (existingCount >= 10) {
      this.logger.error(
        `[GachaConfigService] Config limit exceeded for account: ${account}, gameType: ${gameType}`
      );
      throw BUSINESS_ERROR_CONSTANT.GACHA_CONFIG_LIMIT_EXCEEDED();
    }

    const config = await this.gachaConfigDao.createOne({
      account,
      game_type: gameType,
      region,
      game_uid: gameUid,
      game_nickname: gameNickname,
      gacha_url: gachaUrl,
    });

    this.logger.info(
      `[GachaConfigService] Gacha config created with id: ${config._id}`
    );

    return config;
  }

  async getGachaConfigById(id: string) {
    const config = await this.gachaConfigDao.findById(id);
    if (!config) {
      this.logger.error(`[GachaConfigService] Config not found: ${id}`);
      throw BUSINESS_ERROR_CONSTANT.GACHA_CONFIG_NOT_FOUND();
    }
    return config;
  }

  async getGachaConfigList(account: string) {
    return await this.gachaConfigDao.findMany({ account }, 1, 10, undefined, {
      created_at: -1,
    });
  }

  async getGachaConfigListByGameType(account: string, gameType: GameType) {
    return await this.gachaConfigDao.findMany(
      { account, game_type: gameType },
      1,
      10,
      undefined,
      { created_at: -1 }
    );
  }

  async updateGachaConfig(
    id: string,
    account: string,
    updateData: Partial<GachaConfigEntity>
  ) {
    const config = await this.gachaConfigDao.findById(id);
    if (!config) {
      this.logger.error(`[GachaConfigService] Config not found: ${id}`);
      throw BUSINESS_ERROR_CONSTANT.GACHA_CONFIG_NOT_FOUND();
    }

    if (config.account !== account) {
      this.logger.error(
        `[GachaConfigService] Account mismatch: ${config.account} vs ${account}`
      );
      throw BUSINESS_ERROR_CONSTANT.GACHA_CONFIG_ACCOUNT_MISMATCH();
    }

    return await this.gachaConfigDao.findByIdAndUpdate(id, {
      $set: updateData,
    });
  }

  async deleteGachaConfig(id: string, account: string) {
    const config = await this.gachaConfigDao.findById(id);
    if (!config) {
      this.logger.error(`[GachaConfigService] Config not found: ${id}`);
      throw BUSINESS_ERROR_CONSTANT.GACHA_CONFIG_NOT_FOUND();
    }

    if (config.account !== account) {
      this.logger.error(
        `[GachaConfigService] Account mismatch: ${config.account} vs ${account}`
      );
      throw BUSINESS_ERROR_CONSTANT.GACHA_CONFIG_ACCOUNT_MISMATCH();
    }

    return await this.gachaConfigDao.findByIdAndDelete(id);
  }
}
