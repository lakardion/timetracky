import {
  FC,
  ForwardedRef,
  forwardRef,
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
} from "react";

/**
 * These require forwarding refs because of how react hook forms works..
 */
export const Input: FC<InputHTMLAttributes<HTMLInputElement>> = forwardRef(
  (props, ref: ForwardedRef<HTMLInputElement>) => {
    return (
      <input
        {...props}
        className="border border-solid border-gray-400 rounded-md px-2 py-1 text-black h-9"
        ref={ref}
      />
    );
  }
);
Input.displayName = "Input";
