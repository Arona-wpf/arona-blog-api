import { Rule } from '@midwayjs/validate';

import { createStringRuleType } from '.';

import { GameTypeEnum } from '@/definition/enums/gacha.enum';
import { PageDto } from './page.dto';

export class CreateGachaTaskDTO {
  @Rule(
    createStringRuleType('gacha.dto.uid', true, 'gacha', {
      min: 9,
      max: 10,
    })
  )
  uid: string;

  @Rule(
    createStringRuleType('gacha.dto.game_type', true, 'gacha', {
      enum: Object.values(GameTypeEnum),
    })
  )
  game_type: string;

  @Rule(createStringRuleType('gacha.dto.gacha_url', true, 'gacha'))
  gacha_url: string;
}

export class GetGachaAtlasDTO extends PageDto {
  @Rule(
    createStringRuleType('gacha.dto.game_type', true, 'gacha', {
      enum: Object.values(GameTypeEnum),
    })
  )
  game_type: string;
}
