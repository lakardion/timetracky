import { FieldError, Merge } from "react-hook-form";

export const FormValidationError = ({
  error,
}: {
  error: Merge<FieldError, (FieldError | undefined)[]> | undefined;
}) => {
  if (Array.isArray(error))
    return (
      <p className="text-red-500 font-medium">
        {error.flatMap((e) => (e?.message ? [e.message] : [])).join(" ") ?? ""}
      </p>
    );
  return error?.message ? (
    <p className="text-red-500 font-medium">{error.message ?? ""}</p>
  ) : null;
};
