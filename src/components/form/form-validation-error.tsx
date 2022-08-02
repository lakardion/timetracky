import { FieldError, Merge } from 'react-hook-form';

export const FormValidationError = ({
  error,
}: {
  error: Merge<FieldError, (FieldError | undefined)[]> | undefined;
}) => {
  if (Array.isArray(error))
    return (
      <p className="font-medium text-red-500">
        {error.flatMap((e) => (e?.message ? [e.message] : [])).join(' ') ?? ''}
      </p>
    );
  return error?.message ? (
    <p className="font-medium text-red-500">{error.message ?? ''}</p>
  ) : null;
};
