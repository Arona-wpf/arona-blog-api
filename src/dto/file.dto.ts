import { Rule } from '@midwayjs/validate';

import { FileTypeEnum } from '@/definition/enums/file.enum';
import { FileType } from '@/definition/types/file.type';

import { createStringRuleType } from '.';

export class UploadFileDto {
  @Rule(
    createStringRuleType('file.type', true, 'file', {
      enum: Object.values(FileTypeEnum),
    })
  )
  type: FileType;
}
