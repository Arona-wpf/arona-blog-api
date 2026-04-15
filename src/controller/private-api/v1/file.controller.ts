import {
  Controller,
  Fields,
  Files,
  Get,
  Inject,
  Post,
  Query,
} from '@midwayjs/core';
import { UploadFileInfo } from '@midwayjs/upload';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { UploadFileDto } from '@/dto/file.dto';
import { MinioService } from '@/service/minio.service';

@Controller('/private-api/v1/file')
export class PriV1FileController {
  @Inject()
  minioService: MinioService;

  @Post('/upload')
  async upload(
    @Files('file') files: Array<UploadFileInfo<string>>,
    @Fields() fields: UploadFileDto
  ) {
    if (!files?.length) {
      throw BUSINESS_ERROR_CONSTANT.FILE_UPLOAD_NOT_FOUND();
    }
    const data = await this.minioService.uploadFile(files[0], fields.type);

    return {
      data,
      group: 'file',
      msg: 'file.upload.success',
    };
  }

  @Get('/download')
  async download(
    @Query('object_name') objectName: string,
    @Query('file_name') fileName?: string
  ) {
    if (!objectName) {
      throw BUSINESS_ERROR_CONSTANT.FILE_OBJECT_NAME_NOT_FOUND();
    }
    const url = await this.minioService.getAttachmentDownloadUrl(
      objectName,
      10 * 60,
      fileName
    );

    return {
      data: {
        url,
      },
      group: 'file',
      msg: 'file.download.success',
    };
  }
}
