import { FC, ForwardedRef, forwardRef, SelectHTMLAttributes } from 'react';

export const Select: FC<SelectHTMLAttributes<HTMLSelectElement>> = forwardRef(({ children, className = '', ...props }, ref: ForwardedRef<HTMLSelectElement>) => (
  <select {...props} ref={ref} className={`${className} h-9 rounded-md border border-solid border-gray-400 px-2 py-1 text-black placeholder:text-gray-500/80`}>
    {children}
  </select>
));

Select.displayName = 'Select';
