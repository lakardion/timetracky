import { zodResolver } from '@hookform/resolvers/zod';
import { dateInputValidateZod, nonWorkHourExceptionZod, refineStringIsNumberFn } from 'common/validators';
import { Button } from 'components/button';
import { FormValidationError, Input } from 'components/form';
import { Modal } from 'components/modal';
import { format, parse } from 'date-fns';
import { ChangeEvent, FC, useEffect, useMemo, useState } from 'react';
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

  const onSubmit = (data: HolidayWorkInput) => {};

  const holidayOptions = useMemo(() => {
    return holidays?.map((ce) => ({ value: ce.start.date, label: `${format(parse(ce.start.date, 'yyyy-MM-dd', new Date()), 'MM-dd')} - ${ce.summary}`, description: ce.summary }));
  }, [holidays]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <h1 className="text-3xl">Register a holiday work</h1>
      <Controller
        control={control}
        name="dateOption"
        render={({ field }) => (
          <ReactSelect
            options={holidayOptions}
            className="text-black"
            onChange={(option) => {
              field.onChange(option);
              setValue('description', option?.description ?? '');
            }}
            onBlur={field.onBlur}
            value={field.value}
            isLoading={isHolidaysLoading}
            loadingMessage={() => <p>Getting holidays...</p>}
          />
        )}
      />
      <FormValidationError error={errors.dateOption} />
      <div className="flex w-full justify-between">
        <label htmlFor="hours">Hours</label>
        <div className="flex items-center justify-center gap-3">
          <label htmlFor="isAllDay" className="text-sm">
            All day
          </label>
          <input name="isAllDay" type="checkbox" value={isAllDay.toString()} checked={isAllDay} onChange={handleIsAllDayChange} />
        </div>
      </div>
      <Input placeholder="Hours..." {...register('hours')} disabled={isAllDay} />
      <FormValidationError error={errors.hours} />
      <section aria-label="action buttons" className="flex gap-2">
        <Button type="submit" className="flex-grow">
          Confirm
        </Button>
        <Button onClick={onFinished} className="flex-grow">
          Cancel
        </Button>
      </section>
    </form>
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

  return (
    <section aria-label="Holidays work main" className="flex justify-center">
      <Button onClick={handleAddHolidayWork}>Add holiday work</Button>

      {showCreateEditModal ? (
        <Modal onBackdropClick={onFinishCreate}>
          <HolidayWorkForm onFinished={onFinishCreate} />
        </Modal>
      ) : null}
    </section>
  );
};

export default HolidaysWork;
