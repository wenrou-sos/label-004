import { forwardRef } from 'react';
import { Select as AntSelect } from 'antd';
import type { SelectProps as AntSelectProps } from 'antd';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends AntSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

const Select = forwardRef<any, SelectProps>(
  ({ label, error, helperText, options, className, style, placeholder, size = 'large', allowClear = true, onChange, ...props }, ref) => {
    const handleChange: AntSelectProps['onChange'] = (value, option) => {
      if (onChange) {
        onChange(value, option);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <AntSelect
          ref={ref}
          size={size}
          style={{ width: '100%', ...style }}
          options={options}
          placeholder={placeholder}
          allowClear={allowClear}
          status={error ? 'error' : undefined}
          className={cn(className)}
          onChange={handleChange}
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

Select.displayName = 'Select';

export { Select };
export default Select;
