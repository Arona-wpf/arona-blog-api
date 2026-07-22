import { Controller, Get } from '@midwayjs/core';
import * as fs from 'fs';
import * as path from 'path';

interface DependencyInfo {
  name: string;
  version: string;
}

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

  @Get('/dependencies')
  async getDependencies() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const dependencies: DependencyInfo[] = Object.entries(allDeps).map(
        ([name, version]) => ({
          name,
          version: (version as string).replace(/^[\^~>=<]+/, ''),
        })
      );

      return {
        data: { dependencies },
        group: 'system',
        msg: 'system.dependencies.success',
      };
    } catch {
      return {
        data: { dependencies: [] },
        group: 'system',
        msg: 'system.dependencies.failed',
      };
    }
  }
}
