import { Inject, Provide } from '@midwayjs/core';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { GACHA_SCRIPT_NAME_MAP } from '@/definition/constants/gacha.constant';
import { LocaleEnum } from '@/definition/enums/common.enum';
import { GameType } from '@/definition/types/gacha.type';
import { MinioService } from '@/service/minio.service';

@Provide()
export class GachaScriptService {
  @Inject()
  minioService: MinioService;

  /**
   * 根据游戏类型和语言环境获取祈愿脚本下载链接
   * @param gameType 游戏类型
   * @param locale 当前语言
   */
  async getScriptDownloadUrl(gameType: GameType, locale: string) {
    const scriptFileName = this.resolveScriptFileName(gameType, locale);
    const objectKey = `scripts/${scriptFileName}`;

    const exists = await this.minioService.objectExists(objectKey);
    if (!exists) {
      throw BUSINESS_ERROR_CONSTANT.GACHA_SCRIPT_NOT_FOUND();
    }

    return this.minioService.getAttachmentDownloadUrl(
      objectKey,
      10 * 60,
      scriptFileName
    );
  }

  private resolveScriptFileName(gameType: GameType, locale: string) {
    const scriptName = GACHA_SCRIPT_NAME_MAP[gameType];
    if (!scriptName) {
      throw BUSINESS_ERROR_CONSTANT.GACHA_GAME_TYPE_NOT_SUPPORTED();
    }

    const langSuffix = locale === LocaleEnum.EN_US ? 'en' : 'zh';
    return `Get-GachaLogUrl-${scriptName}_${langSuffix}.ps1`;
  }
}
