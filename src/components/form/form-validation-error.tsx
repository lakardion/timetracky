export const FormValidationError = ({
  errors,
  fieldKey,
}: {
  errors: any;
  fieldKey: string;
}) => {
  return errors?.[fieldKey]?.message ? (
    <p className="text-red-500 font-medium">{errors[fieldKey].message ?? ""}</p>
  ) : null;
};
