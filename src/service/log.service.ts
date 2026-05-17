import { App, Init, Inject, Logger, Provide } from '@midwayjs/core';
import { IMidwayApplication } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';
import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';

import { LogTypeEnum } from '@/definition/enums/log.enum';
import { LogFileInfo, LogSubscriber } from '@/definition/types/log.type';
import { SubscribeLogDto } from '@/dto/log.dto';
import { WsConnectionManager } from '@/manage/ws-connection.manage';

/**
 * 日志服务
 * 提供日志文件读取、监听和推送功能
 */
@Provide()
export class LogService {
  @App()
  app: IMidwayApplication;

  @Inject()
  wsConnectionManager: WsConnectionManager;

  @Logger('appLogger')
  logger: ILogger;

  // 日志目录路径
  private logDir: string;

  // 日志文件名模板（基于 config.default.ts 中的配置）
  private readonly logFilePrefix = 'arona-blog-api';

  // 活跃的订阅者
  private subscribers: Map<string, LogSubscriber> = new Map();

  // 文件监听器
  private fileWatchers: Map<string, chokidar.FSWatcher> = new Map();

  /**
   * 初始化服务
   */
  @Init()
  async initLogDir() {
    // 获取日志目录路径：baseDir/logs
    this.logDir = path.join(this.app.getBaseDir(), 'logs');
    this.logger.info(`[LogService] Log directory: ${this.logDir}`);
  }

  /**
   * 获取支持的日志类型列表
   */
  getLogTypes(): string[] {
    return Object.values(LogTypeEnum);
  }

  /**
   * 根据日志类型获取对应的文件名前缀
   * 错误日志类型返回 null，需要单独处理
   */
  private getLogFilePrefix(type: LogTypeEnum): string | null {
    switch (type) {
      case LogTypeEnum.APP:
        return `${this.logFilePrefix}-app`;
      case LogTypeEnum.CORE:
        return `${this.logFilePrefix}-core`;
      case LogTypeEnum.QUEUE:
        return `${this.logFilePrefix}-queue`;
      case LogTypeEnum.WS:
        return `${this.logFilePrefix}-ws`;
      case LogTypeEnum.ERROR:
        return null;
      default:
        return `${this.logFilePrefix}-app`;
    }
  }

  /**
   * 获取指定类型的日志文件列表
   * @param type 日志类型
   * @returns 日志文件信息列表
   */
  getLogFileList(type: LogTypeEnum): LogFileInfo[] {
    const prefix = this.getLogFilePrefix(type);
    const files: LogFileInfo[] = [];

    try {
      // 检查日志目录是否存在
      if (!fs.existsSync(this.logDir)) {
        this.logger.warn(
          `[LogService] Log directory does not exist: ${this.logDir}`
        );
        return files;
      }

      // 读取目录内容
      const filenames = fs.readdirSync(this.logDir);

      // 根据类型构建不同的正则
      let logFileRegex: RegExp;
      if (type === LogTypeEnum.ERROR) {
        // 错误日志匹配后缀: -error.log 或 -error.log.YYYY-MM-DD
        logFileRegex = new RegExp('-error\\.log(?:\\.\\d{4}-\\d{2}-\\d{2})?$');
      } else {
        // 其他日志匹配前缀: prefix.log 或 prefix.log.YYYY-MM-DD
        logFileRegex = new RegExp(
          `^${prefix}\\.log(?:\\.\\d{4}-\\d{2}-\\d{2})?$`
        );
      }

      for (const filename of filenames) {
        // 过滤匹配的日志文件
        if (logFileRegex.test(filename)) {
          const filePath = path.join(this.logDir, filename);
          const stats = fs.statSync(filePath);

          // 判断是否是历史日志（带日期后缀且日期在今天之前）
          const dateMatch = filename.match(/\.log\.(\d{4}-\d{2}-\d{2})$/);
          const fileDate = dateMatch ? dateMatch[1] : null;

          // 比较日期：只有日期在今天之前的才算历史日志
          const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
          const isHistory = fileDate !== null && fileDate < today;

          files.push({
            filename,
            size: stats.size,
            modifiedTime: stats.mtime.toISOString(),
            isHistory,
            date: fileDate,
          });
        }
      }

      // 按日期倒序排序（最新的排在前面）
      files.sort((a, b) => {
        // 当前日志（无日期后缀）排在最前面
        if (!a.isHistory && b.isHistory) return -1;
        if (a.isHistory && !b.isHistory) return 1;
        // 历史日志按日期倒序
        if (a.date && b.date) {
          return b.date.localeCompare(a.date);
        }
        return b.filename.localeCompare(a.filename);
      });
    } catch (error) {
      this.logger.error(`[LogService] Error reading log directory: ${error}`);
    }

    return files;
  }

  /**
   * 读取日志文件内容
   * @param filename 文件名
   * @param startLine 起始行号（从0开始）
   * @param limit 读取行数限制
   * @returns 日志内容（行数组）和总行数
   */
  readLogContent(
    filename: string,
    startLine = 0,
    limit = 500
  ): { lines: string[]; totalLines: number; hasMore: boolean } {
    const filePath = path.join(this.logDir, filename);

    try {
      if (!fs.existsSync(filePath)) {
        return { lines: [], totalLines: 0, hasMore: false };
      }

      // 读取文件内容
      const content = fs.readFileSync(filePath, 'utf-8');
      const allLines = content.split('\n');

      // 过滤掉空行
      const validLines = allLines.filter(line => line.trim().length > 0);
      const totalLines = validLines.length;

      // 计算读取范围
      const endLine = Math.min(startLine + limit, totalLines);
      const lines = validLines.slice(startLine, endLine);
      const hasMore = endLine < totalLines;

      return { lines, totalLines, hasMore };
    } catch (error) {
      this.logger.error(`[LogService] Error reading log file: ${error}`);
      return { lines: [], totalLines: 0, hasMore: false };
    }
  }

  /**
   * 从指定位置读取新增内容（用于增量推送）
   * @param filename 文件名
   * @param position 字节位置
   * @returns 新增内容和新的位置
   */
  readNewContent(
    filename: string,
    position: number
  ): {
    lines: string[];
    newPosition: number;
  } {
    const filePath = path.join(this.logDir, filename);

    try {
      if (!fs.existsSync(filePath)) {
        return { lines: [], newPosition: position };
      }

      const stats = fs.statSync(filePath);
      const currentSize = stats.size;

      // 如果文件变小了（可能是被清空或重新创建），重置位置
      if (currentSize < position) {
        position = 0;
      }

      // 如果没有新内容
      if (currentSize === position) {
        return { lines: [], newPosition: position };
      }

      // 创建读取流，从指定位置开始读取
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(currentSize - position);
      fs.readSync(fd, buffer, 0, buffer.length, position);
      fs.closeSync(fd);

      const newContent = buffer.toString('utf-8');
      const newLines = newContent
        .split('\n')
        .filter(line => line.trim().length > 0);

      return {
        lines: newLines,
        newPosition: currentSize,
      };
    } catch (error) {
      this.logger.error(`[LogService] Error reading new log content: ${error}`);
      return { lines: [], newPosition: position };
    }
  }

  /**
   * 获取当前监听的日志文件名（不带日期后缀的主日志文件）
   * @param type 日志类型
   * @param filename 用户选择的文件名（错误日志需要使用）
   * @returns 当前日志文件名
   */
  getCurrentLogFile(type: LogTypeEnum, filename?: string): string {
    const prefix = this.getLogFilePrefix(type);
    if (prefix === null) {
      // 错误日志没有固定前缀，返回用户选择的文件名（去掉日期后缀）
      if (filename) {
        const dateMatch = filename.match(/\.log\.\d{4}-\d{2}-\d{2}$/);
        return dateMatch
          ? filename.slice(0, dateMatch.index) + '.log'
          : filename;
      }
      return null;
    }
    return `${prefix}.log`;
  }

  /**
   * 获取文件当前大小
   * @param filename 文件名
   * @returns 文件大小（字节）
   */
  getFileSize(filename: string): number {
    const filePath = path.join(this.logDir, filename);
    try {
      if (!fs.existsSync(filePath)) {
        return 0;
      }
      return fs.statSync(filePath).size;
    } catch {
      return 0;
    }
  }

  /**
   * 订阅日志实时推送
   * @param account 用户账号
   * @param dto订阅参数
   * @returns 实际订阅的文件名，失败返回 null
   */
  subscribe(account: string, dto: SubscribeLogDto): string | null {
    const subscriberKey = `${account}:${dto.type}`;

    // 如果已经订阅了同类型的日志，先取消之前的订阅
    if (this.subscribers.has(subscriberKey)) {
      this.unsubscribe(account, dto.type);
    }

    // 判断是否是历史日志（带日期后缀且日期在今天之前）
    const dateMatch = dto.filename.match(/\.log\.(\d{4}-\d{2}-\d{2})$/);
    const today = new Date().toISOString().slice(0, 10);
    const isHistory = dateMatch !== null && dateMatch[1] < today;

    // 当天日志监听 .log 文件（实时写入），历史日志监听实际文件（静态）
    const actualFilename = isHistory
      ? dto.filename
      : this.getCurrentLogFile(dto.type, dto.filename);

    // 如果无法确定监听文件，返回 null
    if (!actualFilename) {
      this.logger.warn(
        `[LogService] Cannot determine log file for type ${dto.type}`
      );
      return null;
    }

    // 获取当前文件大小作为起始位置
    const position = this.getFileSize(actualFilename);

    // 创建订阅者（记录实际监听的文件名）
    this.subscribers.set(subscriberKey, {
      account,
      type: dto.type,
      filename: actualFilename,
      lastPosition: position,
    });

    // 启动文件监听
    this.startFileWatcher(dto.type, actualFilename);

    this.logger.info(
      `[LogService] User ${account} subscribed to log type ${dto.type}, file ${actualFilename}`
    );

    return actualFilename;
  }

  /**
   * 取消订阅日志
   * @param account 用户账号
   * @param type 日志类型
   */
  unsubscribe(account: string, type: LogTypeEnum): void {
    const subscriberKey = `${account}:${type}`;

    if (this.subscribers.has(subscriberKey)) {
      this.subscribers.delete(subscriberKey);
      this.logger.info(
        `[LogService] User ${account} unsubscribed from log type ${type}`
      );
    }

    // 检查是否还有其他订阅者监听该类型的日志，如果没有则关闭监听器
    const hasOtherSubscribers = Array.from(this.subscribers.values()).some(
      sub => sub.type === type
    );

    if (!hasOtherSubscribers) {
      this.stopFileWatcher(type);
    }
  }

  /**
   * 启动文件监听器
   * @param type 日志类型
   * @param filename 要监听的文件名（已经处理过，当天日志为 .log 文件）
   */
  private startFileWatcher(type: LogTypeEnum, filename: string): void {
    const watcherKey = type.toString();

    // 如果已经有监听器，不重复创建
    if (this.fileWatchers.has(watcherKey)) {
      return;
    }

    const filePath = path.join(this.logDir, filename);

    this.logger.info(`[LogService] Watching file path: ${filePath}`);

    try {
      // 使用 chokidar 监听文件变化
      const watcher = chokidar.watch(filePath, {
        ignoreInitial: true, // 忽略初始扫描
        awaitWriteFinish: {
          stabilityThreshold: 100, // 文件稳定100ms后才触发
          pollInterval: 50,
        },
      });

      watcher.on('change', () => {
        // this.logger.info(`[LogService] File changed: ${filename}`);
        this.onFileChange(type);
      });

      watcher.on('error', error => {
        this.logger.error(
          `[LogService] File watcher error for ${filename}: ${error}`
        );
        this.fileWatchers.delete(watcherKey);
      });

      this.fileWatchers.set(watcherKey, watcher);
      this.logger.info(`[LogService] Started watching file: ${filename}`);
    } catch (error) {
      this.logger.error(`[LogService] Failed to start file watcher: ${error}`);
    }
  }

  /**
   * 停止文件监听器
   * @param type 日志类型
   */
  private stopFileWatcher(type: LogTypeEnum): void {
    const watcherKey = type.toString();
    const watcher = this.fileWatchers.get(watcherKey);

    if (watcher) {
      watcher.close();
      this.fileWatchers.delete(watcherKey);
      this.logger.info(`[LogService] Stopped watching log type ${type}`);
    }
  }

  /**
   * 文件变化处理
   * @param type 日志类型
   */
  private onFileChange(type: LogTypeEnum): void {
    // this.logger.info(`[LogService] File change detected for type: ${type}`);

    // 找出所有订阅该类型日志的用户
    const subscribers = Array.from(this.subscribers.values()).filter(
      sub => sub.type === type
    );

    // this.logger.info(
    //   `[LogService] Found ${subscribers.length} subscribers for type ${type}`
    // );

    for (const subscriber of subscribers) {
      // 读取新增内容
      const result = this.readNewContent(
        subscriber.filename,
        subscriber.lastPosition
      );

      // this.logger.info(
      //   `[LogService] Read ${result.lines.length} new lines for ${subscriber.account}, position: ${subscriber.lastPosition} -> ${result.newPosition}`
      // );

      // 更新订阅者的读取位置
      subscriber.lastPosition = result.newPosition;

      // 如果有新内容，推送给用户
      if (result.lines.length > 0) {
        this.pushToUser(subscriber.account, type, result.lines);
      }
    }
  }

  /**
   * 推送日志内容给用户
   * @param account 用户账号
   * @param type 日志类型
   * @param lines 新增日志行
   */
  private pushToUser(
    account: string,
    type: LogTypeEnum,
    lines: string[]
  ): void {
    // this.logger.info(
    //   `[LogService] Pushing ${lines.length} lines to user ${account} for type ${type}`
    // );

    this.wsConnectionManager.sendToUser(account, 'log:update', {
      type,
      lines,
    });

    // this.logger.info(`[LogService] Push completed for user ${account}`);
  }

  /**
   * 获取用户当前的订阅信息
   * @param account 用户账号
   * @returns 订阅信息列表
   */
  getUserSubscriptions(account: string): LogTypeEnum[] {
    const types: LogTypeEnum[] = [];
    for (const subscriber of this.subscribers.values()) {
      if (subscriber.account === account) {
        types.push(subscriber.type);
      }
    }
    return types;
  }

  /**
   * 服务销毁时清理资源
   */
  async destroy() {
    // 关闭所有文件监听器
    for (const watcher of this.fileWatchers.values()) {
      watcher.close();
    }
    this.fileWatchers.clear();
    this.subscribers.clear();
    this.logger.info('[LogService] Service destroyed, all watchers closed');
  }
}
