import { Rule } from '@midwayjs/validate';

import { createStringRuleType } from '.';
import { LocaleEnum } from '@/definition/enums/common.enum';
import { LocaleType } from '@/definition/types/common.type';

export class SwitchLocaleDto {
  @Rule(
    createStringRuleType('locale', true, 'common', {
      enum: Object.values(LocaleEnum),
    })
  )
  locale: LocaleType;
}
