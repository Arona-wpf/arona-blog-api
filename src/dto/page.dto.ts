import { Rule } from '@midwayjs/validate';

import { createNumberRuleType } from '.';

export class PageDto {
  @Rule(createNumberRuleType('common.current.page', true, 'common', { min: 1 }))
  current_page: number;

  @Rule(createNumberRuleType('common.page.size', true, 'common', { max: 100 }))
  page_size: number;

  @Rule(
    createNumberRuleType('common.previous.page.indicator', false, 'common', {
      min: 1,
    })
  )
  previous_page_indicator?: number;

  @Rule(
    createNumberRuleType('common.next.page.indicator', false, 'common', {
      min: 1,
    })
  )
  next_page_indicator?: number;
}
