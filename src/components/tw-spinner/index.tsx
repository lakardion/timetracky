import { FC } from "react";
import styles from "./tw-spinner.module.css";

export const Spinner: FC<{
  sizeClassNames?: string;
}> = ({ sizeClassNames = "w-8 h-8" }) => {
  return (
    <div className="flex justify-center items-center">
      <div
        className={`${styles["spinner-border"]} animate-spin inline-block border-4 rounded-full ${sizeClassNames}`}
        role="status"
      ></div>
    </div>
  );
};
