import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/core';

import { Permission } from '@/decorator/permission.decorator';
import { GetLogContentDto, GetLogFileListDto } from '@/dto/log.dto';
import { LogService } from '@/service/log.service';

@Controller('/private-api/v1/log')
export class PriV1LogController {
  @Inject()
  logService: LogService;

  /**
   * 获取支持的日志类型列表
   */
  @Get('/types')
  @Permission({ permissionKeys: [] }) // 管理员直接放行，无需特定权限码
  async getLogTypeList() {
    const types = this.logService.getLogTypes();

    return {
      data: types,
      group: 'log',
      msg: 'log.type.list.success',
    };
  }

  /**
   * 获取指定类型的日志文件列表
   */
  @Get('/files')
  @Permission({ permissionKeys: [] })
  async getLogFileList(@Query() query: GetLogFileListDto) {
    const files = this.logService.getLogFileList(query.type);

    return {
      data: files,
      group: 'log',
      msg: 'log.file.list.success',
    };
  }

  /**
   * 获取当前（正在写入的）日志文件名
   */
  @Get('/current')
  @Permission({ permissionKeys: [] })
  async getCurrentLogFile(@Query() query: GetLogFileListDto) {
    const filename = this.logService.getCurrentLogFile(query.type);
    const fileSize = this.logService.getFileSize(filename);

    return {
      data: {
        filename,
        size: fileSize,
      },
      group: 'log',
      msg: 'log.current.success',
    };
  }

  /**
   * 读取日志文件内容
   * 支持分页读取历史日志
   */
  @Post('/content')
  @Permission({ permissionKeys: [] })
  async getLogContent(@Body() body: GetLogContentDto) {
    const startLine = body.startLine ?? 0;
    const limit = body.limit ?? 500;

    const result = this.logService.readLogContent(
      body.filename,
      startLine,
      limit
    );

    return {
      data: {
        lines: result.lines,
        totalLines: result.totalLines,
        hasMore: result.hasMore,
        startLine,
        limit,
      },
      group: 'log',
      msg: 'log.content.success',
    };
  }
}
