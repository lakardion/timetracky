import { FC, ForwardedRef, forwardRef, SelectHTMLAttributes } from "react";

export const Select: FC<SelectHTMLAttributes<HTMLSelectElement>> = forwardRef(
  (
    { children, className = "", ...props },
    ref: ForwardedRef<HTMLSelectElement>
  ) => (
    <select
      {...props}
      className={`${className} border border-solid border-gray-400 rounded-md px-2 py-1 text-black h-9 placeholder:text-gray-500/80`}
      ref={ref}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
