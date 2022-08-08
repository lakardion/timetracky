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
import { trpc } from 'utils/trpc';
import { parseDatepicker } from 'utils/date';
import Head from 'next/head';
import { Spinner } from 'components/tw-spinner';
import { format } from 'date-fns';

const TimeOffList = () => {
  const { data, isLoading, fetchNextPage } = trpc.useInfiniteQuery(['hours.hourExceptionsInfinite', {}], {
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor;
    },
  });
  //TODO: manage virtualization and attach listener for virtual fetchnext page
  const allPages = useMemo(() => {
    return data?.pages.flatMap((p) => p.hourExceptions) ?? [];
  }, [data?.pages]);
  if (isLoading) return <Spinner />;
  if (!allPages.length) return <p className="italic">No days off registered </p>;
  return (
    <ul className="flex flex-col gap-3">
      {allPages.map((to) => (
        <li key={to.id} className="rounded-lg bg-gray-200">
          <section className="px-4 py-2">
            <header>{mapHourExceptionTypeToLabel[to.type]}</header>
            <p className="text-sm">
              {to.hours}hs on {format(to.date, 'MM/dd/yyyy')}
            </p>
          </section>
        </li>
      ))}
    </ul>
  );
};

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
  const queryClient = trpc.useContext();
  const { mutateAsync: create } = trpc.useMutation('hours.createException', {
    onSuccess: () => {
      queryClient.invalidateQueries('hours.hourExceptionsInfinite');
    },
  });
  const onSubmit = async (data: TimeOffInputs) => {
    const reqBody = {
      type: data.hourType.value,
      date: parseDatepicker(data.date),
      hours: parseFloat(data.hours),
    };
    const zod = z.object({
      hours: z.number(),
      date: z.date(),
      type: z.nativeEnum(HourExceptionType),
    });
    const result = zod.safeParse(reqBody);
    const created = await create(reqBody);
    onFinished();
  };

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
      <Input type="text" placeholder="Hours..." {...register('hours')} />
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
    <>
      <section className="flex w-full flex-col gap-3 md:m-auto md:max-w-[60%]">
        <p className="text-center font-medium">Request a day off</p>
        <Button onClick={handleCreateDayOff}>Add days off</Button>
        <TimeOffList />
        {showCreateModal ? (
          <Modal onBackdropClick={hideCreateModal}>
            <TimeOffForm onFinished={onFinished} />
          </Modal>
        ) : null}
      </section>
    </>
  );
};

export default TimeOff;
