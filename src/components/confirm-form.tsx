import { FC } from 'react';
import { Button } from './button';

export const ConfirmForm: FC<{
  body: string;
  onConfirm: () => void;
  onCancel: () => void;
  errorMessage?: string;
  isConfirming?: boolean;
}> = ({ onConfirm, onCancel, body, errorMessage, isConfirming }) => {
  return (
    <section className="flex flex-col gap-3 p-3">
      <h1 className="text-center text-3xl">Are you sure?</h1>
      <p className="text-center text-sm">{body}</p>
      <section aria-label="action buttons" className="flex gap-3">
        <Button className="flex-grow" isLoading={isConfirming} spinnerSizeClassNames="w-6 h-6" onClick={onConfirm}>
          Confirm
        </Button>
        <Button className="flex-grow" onClick={onCancel}>
          Cancel
        </Button>
      </section>
      {errorMessage ? <p className="font-medium text-red-500">{errorMessage}</p> : null}
    </section>
  );
};
