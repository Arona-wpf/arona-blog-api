import { FileTypeEnum } from '../enums/file.enum';

export type FileType = (typeof FileTypeEnum)[keyof typeof FileTypeEnum];
