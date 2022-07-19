import { FC, ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Do not call this component until the dom has rendered fully, else we'd get an error with document not being found
 * @param param0
 * @returns
 */
export const Modal: FC<{
  onClose: () => void;
  children: ReactNode;
}> = ({ onClose, children }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    setFade(true);
  }, []);

  const opacityValue = fade ? "opacity-100" : "opacity-0";

  return createPortal(
    <>
      <section
        className={
          "absolute  top-0 right-0 h-screen w-screen bg-transparent backdrop-blur-sm transition-opacity ease-in duration-200 " +
          opacityValue
        }
        onClick={onClose}
      ></section>
      <section
        className={
          "absolute bg-gray-700 rounded-lg text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-gray-500 p-3 backdrop-blur-3xl  transition-opacity ease-in duration-200 " +
          opacityValue
        }
      >
        {children}
      </section>
      ,
    </>,
    document.body
  );
};
