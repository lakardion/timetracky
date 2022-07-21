import { FC } from "react";
import styles from "./tw-spinner.module.css";

export const Spinner: FC<{
  sizeClassNames?: string;
  className?: string;
}> = ({ sizeClassNames = "w-8 h-8", className = "" }) => {
  return (
    <div
      className={`${styles["spinner-border"]} animate-spin inline-block border-4 rounded-full ${sizeClassNames} ${className}`}
      role="status"
    ></div>
  );
};

/**
 * The parent of this component should be position-relative otherwise this is not going to work properly. It is based on the position relative of its parent so that it fills all the parent's space to position the loader and backdrop
 * @returns
 */
export const BackdropSpinner: FC<{
  isLoading: boolean;
  spinnerSizeClassNames?: string;
}> = ({ isLoading, spinnerSizeClassNames = "w-8 h-8" }) => {
  if (!isLoading) return null;
  return (
    <div className="absolute w-full h-full flex justify-center items-center">
      <div
        className="w-full h-full bg-gray-300"
        style={{ opacity: "50%" }}
      ></div>
      <Spinner className="absolute" sizeClassNames={spinnerSizeClassNames} />
    </div>
  );
};
