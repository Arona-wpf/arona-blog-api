export interface IPageResult<T> {
  list: T[];
  total: number;
  current_page: number;
  page_size: number;
}
