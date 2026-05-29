import { FileTypeEnum } from '../enums/file.enum';

/**
 * 文件资源类型。
 */
export type FileType = (typeof FileTypeEnum)[keyof typeof FileTypeEnum];
