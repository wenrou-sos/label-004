import { forwardRef } from 'react';
import { DatePicker as AntDatePicker } from 'antd';
import type { DatePickerProps as AntDatePickerProps } from 'antd';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';

interface DatePickerProps extends Omit<AntDatePickerProps, 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  format?: 'date' | 'datetime-local';
  value?: string;
  onChange?: (e: any) => void;
}

const DatePicker = forwardRef<any, DatePickerProps>(
  ({ label, error, helperText, format = 'date', className, style, value, onChange, size = 'large', placeholder, ...props }, ref) => {
    const handleChange: AntDatePickerProps['onChange'] = (date, dateString) => {
      if (onChange) {
        onChange({ target: { value: dateString || '' } });
      }
    };

    const antdFormat = format === 'datetime-local' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD';
    const dayjsValue = value ? dayjs(value) : undefined;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <AntDatePicker
          ref={ref}
          size={size}
          style={{ width: '100%', ...style }}
          format={antdFormat}
          value={dayjsValue}
          placeholder={placeholder || `请选择${label || '日期'}`}
          status={error ? 'error' : undefined}
          onChange={handleChange}
          showTime={format === 'datetime-local'}
          className={cn(className)}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export { DatePicker };
export default DatePicker;
