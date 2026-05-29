/**
 * COS 桶目录查询范围枚举。
 */
export enum CosBucketSearchEnum {
  ROOT = 'root',
  PRIVATE = 'private',
  PUBLIC = 'public',
}

/**
 * COS 桶操作对象类型枚举。
 */
export enum CosBucketOperateObjectEnum {
  FOLDER = 'folder',
  FILE = 'file',
}

/**
 * COS 文件上传状态枚举。
 */
export enum CosUploadStatusEnum {
  INIT = 'init',
  UPLOADING = 'uploading',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERROR = 'error',
}
