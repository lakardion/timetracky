import { FC } from "react";
import { Button } from "./button";

export const ConfirmForm: FC<{
  body: string;
  onConfirm: () => void;
  onCancel: () => void;
  errorMessage?: string;
  isConfirming?: boolean;
}> = ({ onConfirm, onCancel, body, errorMessage, isConfirming }) => {
  return (
    <section className="p-3 flex flex-col gap-3">
      <h1 className="text-3xl text-center">Are you sure?</h1>
      <p className="text-sm text-center">{body}</p>
      <section aria-label="action buttons" className="flex gap-3">
        <Button
          onClick={onConfirm}
          isLoading={isConfirming}
          spinnerSizeClassNames="w-6 h-6"
          className="flex-grow"
        >
          Confirm
        </Button>
        <Button onClick={onCancel} className="flex-grow">
          Cancel
        </Button>
      </section>
      {errorMessage ? (
        <p className="text-red-500 font-medium">{errorMessage}</p>
      ) : null}
    </section>
  );
};
