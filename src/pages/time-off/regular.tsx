import { zodResolver } from '@hookform/resolvers/zod';
import { HourExceptionType } from '@prisma/client';
import { dateInputValidateZod, WorkHourException, workHourExceptionZod } from 'common/validators';
import { Button } from 'components/button';
import { FormValidationError, Input } from 'components/form';
import { Modal } from 'components/modal';
import { Spinner } from 'components/tw-spinner';
import { format } from 'date-fns';
import { FC, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import ReactSelect from 'react-select';
import { OptionValueLabel } from 'types';
import { parseDatepicker } from 'utils/date';
import { trpc } from 'utils/trpc';
import { z } from 'zod';

const TimeOffList = () => {
  const { data, isLoading, fetchNextPage } = trpc.useInfiniteQuery(['hours.hourExceptionsInfinite', {}], {
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor;
    },
  });
  //TODO: manage virtualization and attach listener for virtual fetchnext page. We could even do pagination the old-school way. With month filtering
  const allPages = useMemo(() => {
    return data?.pages.flatMap((p) => p.hourExceptions) ?? [];
  }, [data?.pages]);

  if (isLoading) return <Spinner />;
  if (!allPages.length) return <p className="text-center italic">No days off registered </p>;

  return (
    <ul className="flex flex-col gap-3">
      {allPages.map((to) => (
        <li key={to.id} className="rounded-lg bg-gray-300">
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
  HOLIDAY_WORK: 'Holiday work',
};

const timeOffZod = z.object({
  hours: z
    .string()
    .min(1, 'Required')
    .refine((value) => {
      return !isNaN(parseInt(value));
    }),
  hourType: z.object({
    value: workHourExceptionZod,
    label: z.string(),
  }),
  date: dateInputValidateZod,
});

type TimeOffInputs = z.infer<typeof timeOffZod>;
type test = z.infer<typeof workHourExceptionZod>;

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

  const hourExceptionTypeOptions: OptionValueLabel<WorkHourException>[] = useMemo(
    () =>
      Object.entries(WorkHourException).map(([key, value]) => ({
        value: key as WorkHourException,
        label: value,
      })),
    []
  );

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="date">Date</label>
      <Input type="date" {...register('date')} />
      <FormValidationError error={errors.date} />
      <label htmlFor="hours">Hours</label>
      <Input placeholder="Hours..." type="text" {...register('hours')} />
      <FormValidationError error={errors.hours} />
      <label htmlFor="hourType"></label>
      <Controller
        control={control}
        name="hourType"
        render={({ field }) => (
          <ReactSelect<OptionValueLabel<WorkHourException>>
            ref={field.ref}
            className="text-black"
            formatOptionLabel={(option) => <p>{option?.value ? mapHourExceptionTypeToLabel[option.value] : 'No option selected'}</p>}
            options={hourExceptionTypeOptions}
            placeholder="Select a type of absence"
            value={field.value}
            onBlur={field.onBlur}
            onChange={field.onChange}
          />
        )}
      />
      <FormValidationError error={errors.hourType} />
      <section className="flex gap-3">
        <Button className="flex-grow" type="submit">
          Create
        </Button>
        <Button className="flex-grow" type="button" onClick={onFinished}>
          Cancel
        </Button>
      </section>
    </form>
  );
};

const RegularTimeOff = () => {
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
    <section className="flex w-full flex-col gap-3 md:m-auto md:max-w-[50%]">
      <p className="text-center font-medium">Request some time off</p>
      <div className="flex justify-center">
        <Button onClick={handleCreateDayOff}>Add time off</Button>
      </div>
      <TimeOffList />
      {showCreateModal ? (
        <Modal onBackdropClick={hideCreateModal}>
          <TimeOffForm onFinished={onFinished} />
        </Modal>
      ) : null}
    </section>
  );
};

export default RegularTimeOff;
