import { FileTypeEnum } from '../enums/file.enum';

// 文件类型
export type FileType = (typeof FileTypeEnum)[keyof typeof FileTypeEnum];
