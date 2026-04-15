import { Rule } from '@midwayjs/validate';

import { PageDto } from './page.dto';
import { createStringRuleType } from '.';

export class CreateConfigDto {
  @Rule(createStringRuleType('config.name', true, 'config', { max: 20 }))
  name: string;

  @Rule(createStringRuleType('config.key', true, 'config', { max: 20 }))
  key: string;

  @Rule(createStringRuleType('config.value', true, 'config', { max: 128 }))
  value: string;

  @Rule(
    createStringRuleType('config.description', false, 'config', { max: 100 })
  )
  description?: string;

  @Rule(createStringRuleType('config.creator', false, 'config'))
  creator?: string;

  @Rule(createStringRuleType('config.updator', false, 'config'))
  updator?: string;
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
