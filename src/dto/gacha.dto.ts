import { Rule, RuleType } from '@midwayjs/validate';

import { createArrayRuleType, createStringRuleType } from '.';
import {
  GachaExportFileTypeEnum,
  GameTypeEnum,
} from '@/definition/enums/gacha.enum';
import { GachaExportFileType } from '@/definition/types/gacha.type';
import { PageDto } from './page.dto';

export class CreateGachaTaskDTO {
  @Rule(createStringRuleType('gacha.dto.gacha_config_id', true, 'gacha'))
  gacha_config_id: string;

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

export class GetGachaAtlasListDTO {
  @Rule(
    createStringRuleType('gacha.dto.game_type', true, 'gacha', {
      enum: Object.values(GameTypeEnum),
    })
  )
  game_type: string;
}

export class GetGachaAtlasIconsDTO {
  @Rule(
    createStringRuleType('gacha.dto.game_type', true, 'gacha', {
      enum: Object.values(GameTypeEnum),
    })
  )
  game_type: string;

  @Rule(createArrayRuleType('gacha.dto.ids', false, 'gacha', RuleType.string()))
  ids?: string[];
}

export class CreateGachaConfigDTO {
  @Rule(
    createStringRuleType('gacha.dto.game_type', true, 'gacha', {
      enum: Object.values(GameTypeEnum),
    })
  )
  game_type: string;

  @Rule(createStringRuleType('gacha.dto.region', true, 'gacha'))
  region: string;

  @Rule(
    createStringRuleType('gacha.dto.game_uid', true, 'gacha', {
      min: 8,
      max: 10,
    })
  )
  game_uid: string;

  @Rule(
    createStringRuleType('gacha.dto.game_nickname', true, 'gacha', {
      max: 50,
    })
  )
  game_nickname: string;

  @Rule(createStringRuleType('gacha.dto.gacha_url', false, 'gacha'))
  gacha_url: string;
}

export class UpdateGachaConfigDTO {
  @Rule(createStringRuleType('gacha.dto._id', true, 'gacha'))
  _id: string;

  @Rule(
    createStringRuleType('gacha.dto.game_uid', false, 'gacha', {
      min: 9,
      max: 10,
    })
  )
  game_uid?: string;

  @Rule(
    createStringRuleType('gacha.dto.game_nickname', false, 'gacha', {
      max: 50,
    })
  )
  game_nickname?: string;

  @Rule(createStringRuleType('gacha.dto.gacha_url', false, 'gacha'))
  gacha_url?: string;
}

export class DeleteGachaConfigDTO {
  @Rule(createStringRuleType('gacha.dto._id', true, 'gacha'))
  _id: string;
}

export class GetGachaConfigListDTO {
  @Rule(
    createStringRuleType('gacha.dto.game_type', false, 'gacha', {
      enum: Object.values(GameTypeEnum),
    })
  )
  game_type?: string;
}

export class ImportGachaDTO {
  @Rule(
    createStringRuleType('gacha.dto.game_type', true, 'gacha', {
      enum: Object.values(GameTypeEnum),
    })
  )
  game_type: string;

  @Rule(createStringRuleType('gacha.dto.gacha_config_id', true, 'gacha'))
  gacha_config_id: string;
}

export class GetGachaRecordListDTO {
  @Rule(createStringRuleType('gacha.dto.gacha_config_id', true, 'gacha'))
  gacha_config_id: string;
}

export class DownloadGachaScriptDTO {
  @Rule(
    createStringRuleType('gacha.dto.game_type', true, 'gacha', {
      enum: Object.values(GameTypeEnum),
    })
  )
  game_type: string;
}

export class ExportGachaDTO {
  @Rule(createStringRuleType('gacha.dto.gacha_config_id', true, 'gacha'))
  gacha_config_id: string;

  @Rule(createStringRuleType('gacha.dto.file_name', true, 'gacha'))
  file_name: string;

  @Rule(
    createStringRuleType('gacha.dto.file_type', true, 'gacha', {
      enum: Object.values(GachaExportFileTypeEnum),
    })
  )
  file_type: GachaExportFileType;
}
