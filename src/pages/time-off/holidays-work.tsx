import { zodResolver } from '@hookform/resolvers/zod';
import { nonWorkHourExceptionZod, refineStringIsNumberFn } from 'common/validators';
import { Button } from 'components/button';
import { FormValidationError, Input } from 'components/form';
import { Modal } from 'components/modal';
import { Spinner } from 'components/tw-spinner';
import { format, parse } from 'date-fns';
import { ChangeEvent, FC, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import ReactSelect from 'react-select';
import { trpc } from 'utils/trpc';
import { z } from 'zod';

const WORK_DAYS_IN_WEEK = 5;

const HolidayWorkForm: FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const { data: me } = trpc.useQuery(['auth.me']);
  const holidayWorkZod = useMemo(() => {
    return z.object({
      description: z.string(),
      hours: z
        .string()
        .refine(refineStringIsNumberFn, 'Invalid number format')
        .refine((v: string) => {
          const number = parseInt(v);

          return me?.workingHours && number <= me.workingHours / WORK_DAYS_IN_WEEK;
        }, 'Cannot request more hours than you usually work')
        .refine((v: string) => {
          return parseInt(v) > 0;
        }, 'Value cannot be zero'),
      type: nonWorkHourExceptionZod,
      dateOption: z.object({ value: z.string(), label: z.string(), description: z.string() }),
    });
  }, [me?.workingHours]);

  type HolidayWorkInput = z.infer<typeof holidayWorkZod>;

  const { data: holidays, isLoading: isHolidaysLoading } = trpc.useQuery(['gcal.holidays']);

  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
    setValue,
  } = useForm<HolidayWorkInput>({ resolver: zodResolver(holidayWorkZod), defaultValues: { description: '', hours: '0', type: 'HOLIDAY_WORK' } });
  const [isAllDay, setIsAllDay] = useState(false);
  const handleIsAllDayChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIsAllDay(e.target.checked);
    if (e.target.checked) {
      me && setValue('hours', (me.workingHours / WORK_DAYS_IN_WEEK).toString() ?? '0');
    }
  };

  const queryClient = trpc.useContext();
  const { mutateAsync: createHourException } = trpc.useMutation('hours.createException', {
    onSuccess: () => {
      queryClient.invalidateQueries(['hours.hourExceptionPaginated']);
      queryClient.invalidateQueries(['hours.hourExceptionsInfinite']);
    },
  });

  const onSubmit = async (data: HolidayWorkInput) => {
    await createHourException({
      date: parse(data.dateOption.value, 'yyyy-MM-dd', new Date()),
      hours: parseFloat(data.hours),
      type: 'HOLIDAY_WORK',
      notes: data.description,
    });
    onFinished();
  };

  const holidayOptions = useMemo(() => {
    return holidays?.map((ce) => ({ value: ce.start.date, label: `${format(parse(ce.start.date, 'yyyy-MM-dd', new Date()), 'MM-dd')} - ${ce.summary}`, description: ce.summary }));
  }, [holidays]);

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-3xl">Register a holiday work</h1>
      <Controller
        control={control}
        name="dateOption"
        render={({ field }) => (
          <ReactSelect
            className="text-black"
            isLoading={isHolidaysLoading}
            loadingMessage={() => <p>Getting holidays...</p>}
            options={holidayOptions}
            value={field.value}
            onBlur={field.onBlur}
            onChange={(option) => {
              field.onChange(option);
              setValue('description', option?.description ?? '');
            }}
          />
        )}
      />
      <FormValidationError error={errors.dateOption} />
      <div className="flex w-full justify-between">
        <label htmlFor="hours">Hours</label>
        <div className="flex items-center justify-center gap-3">
          <label className="text-sm" htmlFor="isAllDay">
            All day
          </label>
          <input checked={isAllDay} name="isAllDay" type="checkbox" value={isAllDay.toString()} onChange={handleIsAllDayChange} />
        </div>
      </div>
      <Input placeholder="Hours..." {...register('hours')} disabled={isAllDay} />
      <FormValidationError error={errors.hours} />
      <section aria-label="action buttons" className="flex gap-2">
        <Button className="flex-grow" type="submit">
          Confirm
        </Button>
        <Button className="flex-grow" onClick={onFinished}>
          Cancel
        </Button>
      </section>
    </form>
  );
};

const HolidayWorkList: FC<{ handleEdit: (id: string) => void; handleDelete: (id: string) => void }> = ({ handleDelete, handleEdit }) => {
  const [page, setPage] = useState(1);
  const { data: holidayWorkItems, isLoading: isHolidayItemsLoading } = trpc.useQuery(['hours.hourExceptionPaginated', { page, types: ['HOLIDAY_WORK'] }]);

  if (!holidayWorkItems && isHolidayItemsLoading) {
    return <Spinner />;
  }

  if (!holidayWorkItems?.results.length) return <p className="italic">There are no holiday work items registered</p>;

  return (
    <ul className="flex w-full flex-col gap-3 md:w-[40%]">
      {holidayWorkItems?.results.map((hwi) => (
        <li key={hwi.id} className="flex items-center gap-3 rounded-lg bg-gray-300">
          <section className="flex flex-col items-center justify-center p-3">
            <p className="text-xl font-medium">{hwi.hours}hs</p>
            <p>{format(hwi.date, 'MM-dd-yyyy')}</p>
          </section>
          <section>{hwi.notes}</section>
        </li>
      ))}
    </ul>
  );
};

const HolidaysWork = () => {
  const [currentId, setCurrentId] = useState('');
  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const onFinishCreate = () => {
    setShowCreateEditModal(false);
    setCurrentId('');
  };
  const handleAddHolidayWork = () => {
    setShowCreateEditModal(true);
  };
  const submitHolidayWork = () => {};

  const handleEdit = (id: string) => {};
  const handleDelete = (id: string) => {};

  return (
    <section aria-label="Holidays work main" className="flex flex-col items-center justify-center gap-3">
      <Button onClick={handleAddHolidayWork}>Add holiday work</Button>
      <HolidayWorkList handleDelete={handleDelete} handleEdit={handleEdit} />
      {showCreateEditModal ? (
        <Modal onBackdropClick={onFinishCreate}>
          <HolidayWorkForm onFinished={onFinishCreate} />
        </Modal>
      ) : null}
    </section>
  );
};

export default HolidaysWork;
