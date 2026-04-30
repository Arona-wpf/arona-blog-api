import { Rule } from '@midwayjs/validate';

import { TechStackTypeEnum } from '@/definition/enums/tech-stack.enum';
import { TechStackType } from '@/definition/types/tech-stack.type';
import { createStringRuleType } from '.';
import { PageDto } from './page.dto';

export class CreateTechStackDto {
  @Rule(
    createStringRuleType('techStack.type', true, 'techStack', {
      enum: Object.values(TechStackTypeEnum),
    })
  )
  type: TechStackType;

  @Rule(createStringRuleType('techStack.name', true, 'techStack', { max: 50 }))
  name: string;

  @Rule(createStringRuleType('techStack.version', true, 'techStack', { max: 20 }))
  version: string;

  @Rule(createStringRuleType('techStack.descriptionKey', true, 'techStack', { max: 100 }))
  descriptionKey: string;

  @Rule(createStringRuleType('techStack.creator', false, 'techStack'))
  creator?: string;

  @Rule(createStringRuleType('techStack.updator', false, 'techStack'))
  updator?: string;
}

export class UpdateTechStackDto {
  @Rule(createStringRuleType('techStack._id', true, 'techStack'))
  _id: string;

  @Rule(
    createStringRuleType('techStack.type', false, 'techStack', {
      enum: Object.values(TechStackTypeEnum),
    })
  )
  type?: TechStackType;

  @Rule(createStringRuleType('techStack.name', false, 'techStack', { max: 50 }))
  name?: string;

  @Rule(createStringRuleType('techStack.version', false, 'techStack', { max: 20 }))
  version?: string;

  @Rule(createStringRuleType('techStack.descriptionKey', false, 'techStack', { max: 100 }))
  descriptionKey?: string;

  @Rule(createStringRuleType('techStack.updator', false, 'techStack'))
  updator?: string;
}

export class DeleteTechStackDto {
  @Rule(createStringRuleType('techStack._id', true, 'techStack'))
  _id: string;
}

export class GetTechStackListDto extends PageDto {
  @Rule(
    createStringRuleType('techStack.type', false, 'techStack', {
      enum: Object.values(TechStackTypeEnum),
    })
  )
  type?: TechStackType;

  @Rule(createStringRuleType('techStack.creator', false, 'techStack'))
  creator?: string;

  @Rule(createStringRuleType('techStack.updator', false, 'techStack'))
  updator?: string;
}
