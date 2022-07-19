import { ButtonHTMLAttributes, FC, ReactNode } from "react";
import { Spinner } from "./tw-spinner";

export const Button: FC<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    overrides?: { className: string };
    isLoading?: boolean;
    spinnerSizeClassNames?: string;
  }
> = ({ children, overrides, isLoading, spinnerSizeClassNames, ...props }) => {
  return (
    <button
      {...props}
      className={
        overrides?.className
          ? overrides.className
          : "bg-orange-400 rounded px-2 py-0.5 hover:bg-orange-700 text-white flex items-center justify-center " +
            (props.className ?? "")
      }
      type={props.type ? props.type : "button"}
    >
      {isLoading ? (
        <Spinner sizeClassNames={spinnerSizeClassNames} />
      ) : (
        children
      )}
    </button>
  );
};
