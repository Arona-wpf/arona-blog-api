/**
 * 通用分页响应结构。
 * @template T 列表元素类型
 */
export interface IPageResult<T> {
  list: T[];
  total: number;
  current_page: number;
  page_size: number;
}
