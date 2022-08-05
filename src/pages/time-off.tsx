import { zodResolver } from '@hookform/resolvers/zod';
import { HourExceptionType } from '@prisma/client';
import { Button } from 'components/button';
import { Modal } from 'components/modal';
import { FC, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import ReactSelect from 'react-select';
import { OptionValueLabel } from 'types';
import { FormValidationError, Input } from 'components/form';
import { dateInputValidateZod } from 'common/validators';

const mapHourExceptionTypeToLabel: Record<HourExceptionType, string> = {
  TIME_OFF: 'Time off',
  VACATION: 'Vacation',
};

const timeOffZod = z.object({
  hours: z
    .string()
    .min(1, 'Required')
    .refine((value) => {
      return !isNaN(parseInt(value));
    }),
  hourType: z.object({
    value: z.nativeEnum(HourExceptionType),
    label: z.string(),
  }),
  date: dateInputValidateZod,
});
type TimeOffInputs = z.infer<typeof timeOffZod>;

const TimeOffForm: FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const {
    formState: { errors },
    handleSubmit,
    register,
    control,
  } = useForm<TimeOffInputs>({
    resolver: zodResolver(timeOffZod),
  });
  const onSubmit = () => {};

  const hourExceptionTypeOptions: OptionValueLabel<HourExceptionType>[] = useMemo(
    () =>
      Object.entries(HourExceptionType).map(([key, value]) => ({
        value: key as HourExceptionType,
        label: value,
      })),
    []
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <label htmlFor="date">Date</label>
      <Input type="date" {...register('date')} />
      <FormValidationError error={errors.date} />
      <label htmlFor="hours">Hours</label>
      <Input type="text" placeholder="Hours..."  {...register('hours')} />
      <FormValidationError error={errors.hours} />
      <label htmlFor="hourType"></label>
      <Controller
        control={control}
        name="hourType"
        render={({ field }) => (
          <ReactSelect<OptionValueLabel<HourExceptionType>>
            ref={field.ref}
            onChange={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
            options={hourExceptionTypeOptions}
            className="text-black"
            placeholder="Select a type of absence"
            formatOptionLabel={(option) => <p>{option?.value ? mapHourExceptionTypeToLabel[option.value] : 'No option selected'}</p>}
          />
        )}
      />
      <FormValidationError error={errors.hourType} />
      <section className="flex gap-3">
        <Button type="submit" className="flex-grow">
          Create
        </Button>
        <Button type="button" onClick={onFinished} className="flex-grow">
          Cancel
        </Button>
      </section>
    </form>
  );
};

const TimeOff = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const handleCreateDayOff = () => {
    setShowCreateModal(true);
  };
  const hideCreateModal = () => {
    setShowCreateModal(false);
  };

  const onFinished = () => {
    setShowCreateModal(false);
  };

  return (
    <section>
      <p className="italic">Request a day off</p>
      <Button onClick={handleCreateDayOff}>Add days off</Button>
      {showCreateModal ? (
        <Modal onBackdropClick={hideCreateModal}>
          <TimeOffForm onFinished={onFinished} />
        </Modal>
      ) : null}
    </section>
  );
};

export default TimeOff;
