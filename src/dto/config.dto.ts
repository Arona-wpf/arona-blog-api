import { Rule } from '@midwayjs/validate';

import { PageDto } from './page.dto';
import { createStringRuleType } from '.';

/** 配置 key：小写英文字母，可用点号分隔，不能以点号开头或结尾 */
const CONFIG_KEY_PATTERN = /^[a-z]+(\.[a-z]+)*$/;

export class CreateConfigDto {
  @Rule(createStringRuleType('config.name', true, 'config', { max: 20 }))
  name: string;

  @Rule(
    createStringRuleType('config.key', true, 'config', {
      max: 32,
      pattern: CONFIG_KEY_PATTERN,
    })
  )
  key: string;

  @Rule(createStringRuleType('config.value', false, 'config', { max: 128 }))
  value?: string;

  @Rule(
    createStringRuleType('config.description', false, 'config', { max: 100 })
  )
  description?: string;
}

export class SetConfigDto {
  @Rule(
    createStringRuleType('config.key', true, 'config', {
      min: 1,
      max: 32,
      pattern: CONFIG_KEY_PATTERN,
    })
  )
  key: string;

  @Rule(
    createStringRuleType('config.value', true, 'config', { min: 1, max: 4096 })
  )
  value: string;
}

export class DeleteConfigDto {
  @Rule(createStringRuleType('config._id', true, 'config'))
  _id: string;
}

export class UpdateConfigDto {
  @Rule(createStringRuleType('config._id', true, 'config'))
  _id: string;

  @Rule(createStringRuleType('config.value', true, 'config', { max: 128 }))
  value: string;

  @Rule(createStringRuleType('config.updator', false, 'config'))
  updator?: string;
}

export class GetConfigListDto extends PageDto {
  @Rule(createStringRuleType('config.key', false, 'config', { max: 20 }))
  key?: string;

  @Rule(createStringRuleType('config.creator', false, 'config'))
  creator?: string;

  @Rule(createStringRuleType('config.updator', false, 'config'))
  updator?: string;
}
