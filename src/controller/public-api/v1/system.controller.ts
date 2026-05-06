import { Controller, Get } from '@midwayjs/core';
import * as fs from 'fs';
import * as path from 'path';

@Controller('/public-api/v1/system')
export class PubV1SystemController {
  @Get('/version')
  async getVersion() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);
      const version = packageJson.version || '?';

      return {
        data: { version },
        group: 'system',
        msg: 'system.version.success',
      };
    } catch {
      return {
        data: { version: '?' },
        group: 'system',
        msg: 'system.version.failed',
      };
    }
  }
}
