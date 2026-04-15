import { cloneDeep } from 'lodash';

export class BusinessError {
  public statusCode?: number;
  public message: string;
  public args?: Record<string, string>;

  constructor(
    statusCode: number,
    message: string,
    args?: Record<string, string>
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.args = cloneDeep(args);
  }
}
