import {
  CosBucketOperateObjectEnum,
  CosBucketSearchEnum,
  CosUploadStatusEnum,
} from '../enums/cos.enum';

import * as STS from 'qcloud-cos-sts';

// 腾讯云 COS 配置
export interface ICredentialData extends STS.CredentialData {
  config: {
    bucket: string;
    region: string;
  };
}

// COS 桶目录查询类型
export type CosBucketSearchType =
  (typeof CosBucketSearchEnum)[keyof typeof CosBucketSearchEnum];

// COS 桶操作对象类型
export type CosBucketOperateObjectType =
  (typeof CosBucketOperateObjectEnum)[keyof typeof CosBucketOperateObjectEnum];

// COS 上传状态
export type CosUploadStatusType =
  (typeof CosUploadStatusEnum)[keyof typeof CosUploadStatusEnum];
