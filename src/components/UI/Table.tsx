import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TableColumn<T> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (record: T, index: number) => ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: keyof T | ((record: T) => string | number);
  loading?: boolean;
  emptyText?: string;
  className?: string;
  onRowClick?: (record: T, index: number) => void;
  striped?: boolean;
}

function getRowKey<T>(record: T, rowKey: TableProps<T>['rowKey'], index: number): string | number {
  if (typeof rowKey === 'function') {
    return rowKey(record);
  }
  const value = record[rowKey];
  return value !== undefined && value !== null ? String(value) : index;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyText = '暂无数据',
  className,
  onRowClick,
  striped = true,
}: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-gray-200', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider',
                  `text-${column.align || 'left'}`,
                  column.className
                )}
                style={column.width ? { width: typeof column.width === 'number' ? `${column.width}px` : column.width } : undefined}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="ml-2 text-sm text-gray-500">加载中...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <span className="text-sm text-gray-500">{emptyText}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <tr
                key={getRowKey(record, rowKey, index)}
                className={cn(
                  striped && index % 2 === 1 ? 'bg-gray-50' : 'bg-white',
                  onRowClick && 'cursor-pointer hover:bg-primary-50 transition-colors'
                )}
                onClick={onRowClick ? () => onRowClick(record, index) : undefined}
              >
                {columns.map((column) => {
                  const cellContent = column.render
                    ? column.render(record, index)
                    : column.dataIndex
                    ? String((record as Record<string, unknown>)[column.dataIndex as string] ?? '')
                    : null;

                  return (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 text-sm text-gray-700 whitespace-nowrap',
                        `text-${column.align || 'left'}`,
                        column.className
                      )}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
