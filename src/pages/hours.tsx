import { zodResolver } from '@hookform/resolvers/zod';
import { RoleType } from '@prisma/client';
import {
  CreateHourFormInputs,
  CreateHourInputs,
  createHourZodForm,
} from 'common/validators';
import { Button } from 'components/button';
import { ConfirmForm } from 'components/confirm-form';
import { FormValidationError, Input, TextArea } from 'components/form';
import {
  HoursCalendar,
  RangeChangeEventHandler,
} from 'components/hour-calendar';
import { HourList } from 'components/hours/hour-list';
import { DateFilter } from 'components/hours/types';
import { Modal } from 'components/modal';
import { BackdropSpinner } from 'components/tw-spinner';
import { isSameDay } from 'date-fns';
import Head from 'next/head';
import Link from 'next/link';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Event } from 'react-big-calendar';
import { Controller, useForm } from 'react-hook-form';
import AsyncReactSelect from 'react-select/async';
import { OptionValueLabel } from 'types';
import { formatDatepicker, localizeUTCDate, parseDatepicker } from 'utils/date';
import { debouncePromiseValue } from 'utils/delay';
import { createTRPCVanillaClient, trpc } from 'utils/trpc';

const emptyDefaultValues: Partial<CreateHourFormInputs> = {
  date: formatDatepicker(new Date()),
  description: '',
  projectId: undefined,
  tagIds: [],
  value: '0',
};

const searchProjects = async (value: string) => {
  const client = createTRPCVanillaClient();
  const projects = await client.query('projects.search', { query: value });
  return projects.map((p) => ({ value: p.id, label: p.name }));
};
const debouncedSearchProjects: typeof searchProjects = debouncePromiseValue(
  searchProjects,
  500
);

const searchTags = async (value: string) => {
  const client = createTRPCVanillaClient();
  const tags = await client.query('tags.search', { query: value });
  return tags.map((t) => ({ value: t.id, label: t.name }));
};
const debouncedSearchTags: typeof searchTags = debouncePromiseValue(
  searchTags,
  500
);

const CreateEditHour: FC<{ hourId?: string; onFinishEdit: () => void }> = ({
  hourId,
  onFinishEdit,
}) => {
  const queryClient = trpc.useContext();

  const { mutateAsync: createHour, isLoading: isHourCreating } =
    trpc.useMutation('hours.create', {
      onSuccess: () => {
        queryClient.invalidateQueries(['hours.withTagAndProjectInfinite']);
        queryClient.invalidateQueries(['hours.hoursByDate']);
      },
    });
  const { mutateAsync: editHour, isLoading: isHourEditing } = trpc.useMutation(
    'hours.edit',
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['hours.withTagAndProjectInfinite']);
      },
    }
  );
  const { data: hour } = trpc.useQuery(['hours.single', { id: hourId ?? '' }], {
    enabled: Boolean(hourId),
    refetchOnWindowFocus: false,
  });

  const defaultValues = useMemo(
    () => ({
      date: hour?.date ? formatDatepicker(hour?.date) : emptyDefaultValues.date,
      description: hour?.description ?? emptyDefaultValues.description,
      projectId: hour?.projectId ?? emptyDefaultValues.projectId,
      tagIds: hour?.tags?.map((t) => t.tagId) ?? emptyDefaultValues.tagIds,
      value: hour?.value?.toString() ?? emptyDefaultValues.value,
    }),
    [hour]
  );

  const {
    register,
    formState: { errors, isDirty },
    control,
    handleSubmit,
    reset,
    getValues,
  } = useForm<CreateHourFormInputs>({
    defaultValues,
    resolver: zodResolver(createHourZodForm),
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const handleClose = () => {
    onFinishEdit();
    reset(emptyDefaultValues);
  };

  const onSubmit = async (data: CreateHourFormInputs) => {
    const parsedData: CreateHourInputs = {
      ...data,
      date: parseDatepicker(data.date),
      value: parseFloat(data.value),
    };
    hour && hourId
      ? await editHour({
          id: hourId,
          oldTagIds: hour.tags?.map((t) => t.tagId) ?? [],
          ...parsedData,
        })
      : await createHour(parsedData);
    handleClose();
  };

  return (
    <>
      <form
        className="relative flex flex-col justify-center gap-2 rounded-lg bg-gray-700 p-4 pb-5 text-white"
        onSubmit={handleSubmit(onSubmit)}
      >
        <BackdropSpinner isLoading={isHourEditing || isHourCreating} />
        <h1 className="text-center text-2xl">
          {hourId ? 'Edit hour entry' : 'Add an hour entry'}
        </h1>
        <section aria-label="hour date" className="flex flex-wrap gap-3">
          <div className="flex flex-grow flex-col gap-2">
            <label htmlFor="value" className="font-medium">
              Value
            </label>
            <Input
              type="number"
              {...register('value')}
              placeholder="Value..."
            />
            <FormValidationError error={errors.value} />
          </div>
          <div className="flex flex-grow flex-col gap-2">
            <label htmlFor="date" className="font-medium">
              Date
            </label>
            <Input type="date" {...register('date')} />
            <FormValidationError error={errors.date} />
          </div>
        </section>
        <label htmlFor="projectId" className="font-medium">
          Project
        </label>
        <Controller
          name="projectId"
          control={control}
          defaultValue={undefined}
          render={({ field }) => {
            return (
              <AsyncReactSelect<OptionValueLabel<string>>
                defaultOptions
                loadOptions={debouncedSearchProjects}
                ref={field.ref}
                onBlur={field.onBlur}
                className="rounded text-black"
                classNamePrefix="timetracky"
                onChange={(value) => {
                  field.onChange(value?.value);
                }}
                placeholder="Select a project..."
              />
            );
          }}
        />
        <FormValidationError error={errors.projectId} />
        <label htmlFor="description" className="font-medium">
          Description
        </label>
        <TextArea
          {...register('description')}
          placeholder="Describe the activity..."
          className="flex-grow"
        />
        <FormValidationError error={errors.description} />
        <label htmlFor="tags" className="font-medium">
          Tags
        </label>
        <Controller
          name="tagIds"
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <AsyncReactSelect<OptionValueLabel<string>, true>
              isMulti
              defaultOptions
              loadOptions={debouncedSearchTags}
              onBlur={field.onBlur}
              ref={field.ref}
              className="text-black"
              classNamePrefix="timetracky"
              onChange={(value) => {
                field.onChange(value.map((v) => v?.value));
              }}
              placeholder="Select tags..."
            />
          )}
        />
        <FormValidationError error={errors.tagIds} />
        <section className="flex justify-center gap-3 p-4">
          <Button
            type="submit"
            isLoading={isHourEditing || isHourCreating}
            className="flex-grow"
          >
            {hourId ? 'Edit' : 'Add'}
          </Button>
          <Button
            className="flex-grow capitalize"
            onClick={isDirty ? () => reset() : handleClose}
          >
            {isDirty ? 'reset' : 'cancel'}
          </Button>
        </section>
      </form>
    </>
  );
};

const MAX_TAGS_DISPLAYED = 4;

const getMonthRangeForDate = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: firstDay, end: lastDay };
};

const HourCalendarContainer: FC<{
  handleDateSelected: (date: Date[]) => void | undefined;
  datesSelected: Date[] | undefined;
}> = ({ datesSelected, handleDateSelected }) => {
  const [currentCalendarRange, setCurrentCalendarRange] = useState(
    getMonthRangeForDate(new Date())
  );
  const handleRangeChange: RangeChangeEventHandler = (range) => {
    if (Array.isArray(range)) return; //don't want to address this rn
    //! range comes UTC-centered so I have to localize that seems like. We only care about what day this happened we don't care what the time was
    const { end, start } = range;
    const localizedStart = localizeUTCDate(start);
    const localizedEnd = localizeUTCDate(end);
    setCurrentCalendarRange({ start: localizedStart, end: localizedEnd });
  };
  const { data: hoursByDate } = trpc.useQuery([
    'hours.hoursByDate',
    { dateFrom: currentCalendarRange.start, dateTo: currentCalendarRange.end },
  ]);
  const events: Event[] = useMemo(
    () =>
      hoursByDate?.map(
        (hbd): Event => ({
          allDay: true,
          title: `${hbd.project.name}`,
          start: hbd.date,
          end: hbd.date,
        })
      ) ?? [],
    [hoursByDate]
  );

  return (
    <section
      aria-label="calendar"
      className=" flex justify-center lg:basis-8/12"
    >
      <HoursCalendar
        events={events}
        onRangeChange={handleRangeChange}
        onSelectedChange={handleDateSelected}
        selected={datesSelected}
      />
    </section>
  );
};

const HoursMain = () => {
  const [editingHourId, setEditingHourId] = useState('');
  const queryClient = trpc.useContext();
  const { data: user } = trpc.useQuery(['auth.me']);
  const { data: hasProjects } = trpc.useQuery(['projects.any']);
  const {
    mutateAsync: deleteOne,
    isLoading: isDeleting,
    error: deleteError,
  } = trpc.useMutation('hours.delete', {
    onSuccess: () => {
      queryClient.invalidateQueries('hours.withTagAndProjectInfinite');
    },
  });
  const [deletingHourId, setDeletingHourId] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const onHourEdit = (id: string) => {
    setEditingHourId(id);
  };
  const onHourDelete = (id: string) => {
    setDeletingHourId(id);
    setShowConfirmationModal(true);
  };
  const handleFinishEdit = () => {
    if (editingHourId) setEditingHourId('');
  };

  const handleCloseConfirm = () => {
    setShowConfirmationModal(false);
    setDeletingHourId('');
  };
  const handleSubmitDelete = async () => {
    await deleteOne({ id: deletingHourId });
    handleCloseConfirm();
  };

  //Calendar controls
  const [datesSelected, setDatesSelected] = useState<Date[]>([]);
  const handleDateSelected = useCallback((dates: Date[]) => {
    setDatesSelected((ds) => {
      return ds?.length === 1 &&
        dates.length === 1 &&
        isSameDay(ds[0]!, dates[0]!)
        ? []
        : dates;
    });
  }, []);

  const dateFilter: DateFilter | Date | undefined = useMemo(() => {
    if (!datesSelected?.length) return undefined;
    if (datesSelected.length === 1) {
      return datesSelected[0];
    }
    return {
      from: datesSelected[0]!,
      to: datesSelected[datesSelected.length - 1]!,
    };
  }, [datesSelected]);

  if (!hasProjects) {
    const noProjectsMessage =
      user && user.roleType === RoleType.ADMIN ? (
        <>
          go to{' '}
          <Link href="/projects">
            <button
              type="button"
              className="text-blue-600 visited:text-purple-600 hover:underline"
            >
              Projects
            </button>
          </Link>{' '}
          and add one
        </>
      ) : (
        'ask an administrator to add them'
      );
    return (
      <p className="text-center italic">
        There are no projects created, {noProjectsMessage}
      </p>
    );
  }

  return (
    <>
      <section
        aria-label="create edit hour form"
        className="flex items-start  justify-center"
      >
        <CreateEditHour
          hourId={editingHourId}
          onFinishEdit={handleFinishEdit}
        />
      </section>
      <section
        className="flex flex-col gap-2 md:flex-grow lg:flex-row-reverse 2xl:flex-row-reverse"
        aria-label="hours and calendar container"
      >
        <HourCalendarContainer
          datesSelected={datesSelected}
          handleDateSelected={handleDateSelected}
        />
        <section
          aria-label="hours list"
          className="relative flex flex-col items-center justify-start md:flex-grow md:basis-4/12"
        >
          <HourList
            onHourDelete={onHourDelete}
            onHourEdit={onHourEdit}
            selectedHourId={editingHourId}
            dateFilter={dateFilter}
          />
        </section>
        {showConfirmationModal ? (
          <Modal onBackdropClick={handleCloseConfirm}>
            <ConfirmForm
              body="Are you sure you want to delete an hour?"
              onCancel={handleCloseConfirm}
              onConfirm={handleSubmitDelete}
              errorMessage={deleteError?.message}
              isConfirming={isDeleting}
            />
          </Modal>
        ) : null}
      </section>
    </>
  );
};
const Hours = () => {
  return (
    <section className="hours-container flex flex-col gap-3 2xl:flex-row 2xl:justify-around 2xl:gap-8 2xl:px-4">
      <Head>
        <title>Timetracky - Hours</title>
        <meta name="description" content="Generated by create-t3-app" />
      </Head>
      <HoursMain />
    </section>
  );
};

export default Hours;
