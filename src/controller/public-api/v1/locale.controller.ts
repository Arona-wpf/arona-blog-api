import { Controller, Get, Query, Session } from '@midwayjs/core';

import { SwitchLocaleDto } from '@/dto/locale.dto';
import { IUserSession } from '@/interface';

@Controller('/public-api/v1/locale')
export class PubV1LocaleController {
  @Get('/get')
  async getLocale(@Session() session: IUserSession) {
    return {
      data: { locale: session.locale },
    };
  }

  @Get('/set')
  async setLocale(
    @Query() query: SwitchLocaleDto,
    @Session() session: IUserSession
  ) {
    session.locale = query.locale;

    return {
      data: { locale: query.locale },
      group: 'common',
      msg: 'locale.switch.success',
    };
  }
}
