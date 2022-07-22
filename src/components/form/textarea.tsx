import { FC, ForwardedRef, forwardRef, TextareaHTMLAttributes } from "react";

export const TextArea: FC<TextareaHTMLAttributes<HTMLTextAreaElement>> =
  forwardRef((props, ref: ForwardedRef<HTMLTextAreaElement>) => (
    <textarea
      {...props}
      ref={ref}
      className="border border-solid border-gray-400 rounded-md px-2 py-1 text-black placeholder:text-gray-500/80"
    />
  ));

TextArea.displayName = "TextArea";