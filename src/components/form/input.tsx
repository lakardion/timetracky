import {
  FC,
  ForwardedRef,
  forwardRef,
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
} from 'react';

/**
 * These require forwarding refs because of how react hook forms works..
 */
export const Input: FC<InputHTMLAttributes<HTMLInputElement>> = forwardRef(
  (props, ref: ForwardedRef<HTMLInputElement>) => {
    return (
      <input
        {...props}
        className="h-9 rounded-md border border-solid border-gray-400 px-2 py-1 text-black placeholder:text-gray-500/80 focus:outline-none focus:ring-2 focus:ring-orange-400"
        ref={ref}
      />
    );
  }
);
Input.displayName = 'Input';
