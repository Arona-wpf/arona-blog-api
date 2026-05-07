import { Inject, Provide } from '@midwayjs/core';

import { GachaDao } from '@/dao/gacha.dao';
import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { GameTypeEnum } from '@/definition/enums/gacha.enum';
import { GameType } from '@/definition/types/gacha.type';
import { AxiosHelper } from '@/helper/axios.helper';

@Provide()
export class GachaService {
  /** 米哈游游戏类型 */
  private mihoyoGameType: GameType[] = Object.values(GameTypeEnum);

  @Inject()
  gachaDao: GachaDao;

  @Inject()
  axiosHelper: AxiosHelper;

  /**
   * 修补米哈游祈愿URL
   * @param url 米哈游祈愿URL
   * @returns 修补后的米哈游祈愿URL
   */
  private verifyAndFixMihoyoGachaUrl(url: string) {
    const authkeyMatch = url.match(/authkey=([^&]+)/);
    if (
      authkeyMatch &&
      authkeyMatch.length > 1 &&
      !authkeyMatch[1].includes('%')
    ) {
      url = url.replace(
        /authkey=([^&]+)/,
        `authkey=${encodeURIComponent(authkeyMatch[1])}`
      );
    }
    return url;
  }

  /**
   * 同步祈愿数据
   * @param uid 用户ID
   * @param gameType 游戏类型
   * @param originUrl 原始祈愿URL
   */
  async syncGachaData(uid: string, gameType: GameType, originUrl: string) {
    let url = originUrl;
    if (this.mihoyoGameType.includes(gameType)) {
      url = this.verifyAndFixMihoyoGachaUrl(originUrl);
    }

    const { searchParams, host } = new URL(url);
    // 判断是否为全球服
    const isGlobalServer =
      host.includes('webstatic-sea') ||
      host.includes('api-os-takumi') ||
      host.includes('hoyoverse.com');

    const axiosInstance = await this.axiosHelper.getAxiosInstance(
      gameType + (isGlobalServer ? '_global' : '')
    );

    const authKey = searchParams.get('authkey');
    // 祈愿auth key不存在
    if (!authKey) {
      throw BUSINESS_ERROR_CONSTANT.GACHA_AUTH_KEY_NOT_FOUND();
    }

    // 删除祈愿参数，后面手动拼接
    searchParams.delete('page');
    searchParams.delete('size');
    searchParams.delete('gacha_type');
    searchParams.delete('end_id');
  }
}
