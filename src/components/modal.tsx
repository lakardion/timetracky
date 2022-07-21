import { FC, ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Do not call this component until the dom has rendered fully, else we'd get an error with document not being found
 * @param param0
 * @returns
 */
export const Modal: FC<{
  onClose: () => void;
  children: ReactNode;
  className?: string;
}> = ({ onClose, className = "", children }) => {
  const [hasFaded, setHasFaded] = useState(false);

  useEffect(() => {
    setHasFaded(true);
  }, []);

  const [blurOrBackdrop, setBlurOrBackdrop] = useState("");

  useEffect(() => {
    // for some reason firefox does not support backdrop blur
    //needed to do this within client else window is possibly undefined
    const agent = window.navigator.userAgent;
    const isFirefox = agent.indexOf("Firefox") !== -1;
    const blurOrBackdrop = isFirefox
      ? "bg-gray-300/50"
      : "bg-transparent backdrop-blur-sm";
    setBlurOrBackdrop(blurOrBackdrop);
  }, []);

  const opacityValue = hasFaded ? "opacity-100" : "opacity-0";

  return createPortal(
    <>
      <section
        aria-label="backdrop"
        className={`absolute  top-0 right-0 h-screen w-screen transition-opacity ease-in duration-200 ${blurOrBackdrop} ${opacityValue}`}
        onClick={onClose}
      ></section>
      <section
        aria-label="modal body"
        className={`absolute bg-gray-700 rounded-lg text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-gray-500 p-3 backdrop-blur-3xl  transition-opacity ease-in duration-200 ${opacityValue} ${className}`}
      >
        {children}
      </section>
      ,
    </>,
    document.body
  );
};
