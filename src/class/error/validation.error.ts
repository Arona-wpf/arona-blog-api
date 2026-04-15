import { cloneDeep } from 'lodash';

interface ICheckResult {
  code: string;
  local: Record<string, string>;
}

export class ValidationError {
  public message: string;
  public checkResult?: ICheckResult[];
  public field?: string;
  public group?: string;
  public args?: Record<string, string>;

  constructor(
    message: string,
    checkResult: ICheckResult[],
    field: string,
    group: string,
    args?: Record<string, string>
  ) {
    this.message = message;
    this.checkResult = cloneDeep(checkResult);
    this.field = field;
    this.group = group;
    this.args = cloneDeep(args);
  }
}
