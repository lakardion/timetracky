import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateHourFormInputs,
  CreateHourInputs,
  createHourZodForm,
} from "common/validators";
import { Button } from "components/button";
import { ConfirmForm } from "components/confirm-form";
import { FormValidationError, Input, TextArea } from "components/form";
import {
  HoursCalendar,
  RangeChangeEventHandler,
} from "components/hour-calendar";
import LongParagraph from "components/long-paragraph";
import { Modal } from "components/modal";
import { PillListItem } from "components/pill-list-item";
import { BackdropSpinner } from "components/tw-spinner";
import { format, formatRelative, isDate, isSameDay } from "date-fns";
import Head from "next/head";
import Link from "next/link";
import {
  FC,
  MouseEvent,
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Event } from "react-big-calendar";
import { Controller, useForm } from "react-hook-form";
import { FaEllipsisH } from "react-icons/fa";
import { MdDeleteOutline, MdOutlineModeEditOutline } from "react-icons/md";
import ReactSelect from "react-select";
import { formatDatepicker, localizeUTCDate, parseDatepicker } from "utils/date";
import { trpc } from "utils/trpc";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useVirtualizer } from "@tanstack/react-virtual";

const PARAGRAPH_CHAR_LIMIT = 200;

type DateFilter = {
  from: Date;
  to: Date;
};

const emptyDefaultValues: Partial<CreateHourFormInputs> = {
  date: formatDatepicker(new Date()),
  description: "",
  projectId: undefined,
  tagIds: [],
  value: "0",
};

const CreateEditHour: FC<{ hourId?: string; onFinishEdit: () => void }> = ({
  hourId,
  onFinishEdit,
}) => {
  //todo: might need to define pagination?. These could go wild otherwise
  //todo I think I might have to kick off this to the react select components rather
  const { data: projects } = trpc.useQuery(["projects.all"]);
  const { data: tags } = trpc.useQuery(["tags.all"]);

  const queryClient = trpc.useContext();

  const { mutateAsync: createHour, isLoading: isHourCreating } =
    trpc.useMutation("hours.create", {
      onSuccess: () => {
        queryClient.invalidateQueries(["hours.withTagAndProjectInfinite"]);
        queryClient.invalidateQueries(["hours.hoursByDate"]);
      },
    });
  const { mutateAsync: editHour, isLoading: isHourEditing } = trpc.useMutation(
    "hours.edit",
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["hours.withTagAndProjectInfinite"]);
      },
    }
  );
  const { data: hour } = trpc.useQuery(["hours.single", { id: hourId ?? "" }], {
    enabled: Boolean(hourId),
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

  const tagOptions = useMemo(() => {
    if (!tags) return [];
    return tags.map((t) => ({
      value: t.id,
      label: t.name,
    }));
  }, [tags]);

  const projectOptions = useMemo(() => {
    if (!projects) return [];
    return projects.map((p) => ({
      value: p.id,
      label: p.name,
    }));
  }, [projects]);

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

  if (!projects?.length) {
    return (
      <p className="italic">
        There are no projects created, go to{" "}
        <Link href="/projects">
          <button
            type="button"
            className="text-blue-600 visited:text-purple-600 hover:underline"
          >
            Projects
          </button>
        </Link>{" "}
        and add one
      </p>
    );
  }

  return (
    <>
      <form
        className="relative flex flex-col gap-2 bg-gray-700 p-4 pb-5 rounded-lg text-white justify-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        <BackdropSpinner isLoading={isHourEditing || isHourCreating} />
        <h1 className="text-2xl text-center">
          {hourId ? "Edit hour entry" : "Add an hour entry"}
        </h1>
        <section aria-label="hour date" className="flex gap-3 flex-wrap">
          <div className="flex flex-col gap-2 flex-grow">
            <label htmlFor="value" className="font-medium">
              Value
            </label>
            <Input
              type="number"
              {...register("value")}
              placeholder="Value..."
            />
            <FormValidationError error={errors.value} />
          </div>
          <div className="flex flex-col gap-2 flex-grow">
            <label htmlFor="date" className="font-medium">
              Date
            </label>
            <Input type="date" {...register("date")} />
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
              <ReactSelect
                options={projectOptions}
                ref={field.ref}
                onBlur={field.onBlur}
                className="text-black rounded"
                classNamePrefix="timetracky"
                value={
                  projectOptions.find((po) => po.value === field.value) ?? null
                }
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
          {...register("description")}
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
            <ReactSelect
              isMulti
              options={tagOptions}
              onBlur={field.onBlur}
              ref={field.ref}
              className="text-black"
              classNamePrefix="timetracky"
              onChange={(value) => {
                field.onChange(value.map((v) => v.value));
              }}
              value={tagOptions.filter((to) => field.value.includes(to.value))}
              placeholder="Select tags..."
            />
          )}
        />
        <FormValidationError error={errors.tagIds} />
        <section className="p-4 flex justify-center gap-3">
          <Button
            type="submit"
            isLoading={isHourEditing || isHourCreating}
            className="flex-grow"
          >
            {hourId ? "Edit" : "Add"}
          </Button>
          <Button
            className="flex-grow capitalize"
            onClick={isDirty ? () => reset() : handleClose}
          >
            {isDirty ? "reset" : "cancel"}
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

const HourList: FC<{
  page: number;
  onHourEdit: (id: string) => void;
  onHourDelete: (id: string) => void;
  selectedHourId?: string;
  dateFilter?: DateFilter | Date;
}> = ({ page, onHourEdit, onHourDelete, selectedHourId, dateFilter }) => {
  const {
    data: infiniteHours,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = trpc.useInfiniteQuery(
    [
      "hours.withTagAndProjectInfinite",
      {
        dateFilter,
      },
    ],
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
  const [hoveringId, setHoveringId] = useState("");

  const rVirtualRef = useRef<HTMLUListElement | null>(null);

  const allRows = useMemo(() => {
    return infiniteHours?.pages.flatMap((p) => p.hours) ?? [];
  }, [infiniteHours?.pages]);

  const { getTotalSize, getVirtualItems } = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => rVirtualRef.current,
    estimateSize: (index) => {
      return (allRows[index]?.description?.length ?? 0) > 100 ? 250 : 200;
    },
    overscan: 5,
    debug: true,
  });

  useEffect(() => {
    const [lastItem] = [...getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= allRows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasNextPage,
    fetchNextPage,
    allRows.length,
    isFetchingNextPage,
    //! not sure about this. This is how they pictured it in the example at @tanstack/react-virtual
    getVirtualItems(),
  ]);

  const createHoverHandler = (id: string) => (e: MouseEvent) => {
    e?.stopPropagation();
    setHoveringId(id);
  };
  const createEditHourHandler = (id: string) => () => {
    onHourEdit(id);
  };
  const createDeleteHourHandler = (id: string) => () => {
    onHourDelete(id);
  };

  const dateFilterParse =
    dateFilter instanceof Date
      ? `Filtering for ${format(dateFilter, "MM-dd-yyyy")}`
      : typeof dateFilter === "object"
      ? `Filtering from ${format(dateFilter.from, "MM-dd-yyyy")} to ${format(
          dateFilter.to,
          "MM-dd-yyyy"
        )}`
      : "Last loaded hours";

  return (
    <>
      <h1 className="text-2xl pb-2">{dateFilterParse}</h1>
      <section
        aria-label="scrollable hours container"
        className="w-full h-[700px] md:h-full md:max-w-[700px] overflow-auto"
        ref={rVirtualRef}
      >
        <ul
          className={`w-full relative`}
          style={{
            height: `${getTotalSize()}px`,
          }}
          onClick={createHoverHandler("")}
        >
          {!getVirtualItems()?.length ? (
            <li className="italic text-center pt-3">No hours</li>
          ) : null}
          {getVirtualItems().map((virtualRow) => {
            const isLoaderRow = virtualRow.index > allRows.length - 1;
            const h = allRows[virtualRow.index];
            const liClassName = h ? `absolute top-0 left-0 w-full` : "";
            if (virtualRow.start === undefined) return null;
            return (
              <li
                key={virtualRow.index}
                className={liClassName}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onMouseEnter={h ? createHoverHandler(h.id) : undefined}
                onMouseLeave={h ? createHoverHandler("") : undefined}
              >
                {isLoaderRow ? (
                  hasNextPage ? (
                    "Loading more..."
                  ) : (
                    "Nothing more to load"
                  )
                ) : (
                  <div
                    aria-label="hour card container"
                    className={`bg-gray-300 h-[95%] rounded-lg w-[98%] p-3 flex gap-3 ${
                      h?.id === selectedHourId
                        ? "ring-2 ring-orange-300/75 ring-inset"
                        : ""
                    }`}
                  >
                    <section
                      aria-label="hour and date box"
                      className="w-24 h-24 bg-gray-700 flex flex-col items-center justify-between rounded py-3 text-white border-4 border-gray-600 drop-shadow-lg basis-2/12"
                    >
                      <h1 className="text-3xl">
                        {h!.value} <span className="text-sm italic"> hs</span>
                      </h1>
                      <p aria-label="date" className="italic ">
                        {format(h!.date, "M-dd-yyyy")}
                      </p>
                    </section>
                    <section
                      aria-label="project name, tags, and description"
                      className="flex flex-col gap-2 basis-9/12"
                    >
                      <section>
                        <h1 className="text-2xl">{h!.project.name}</h1>
                        <ul className="flex flex-wrap gap-3 pt-1">
                          {h!.tags.flatMap((t, idx) => {
                            return (
                              <PillListItem
                                content={t.tag.name}
                                key={t.tag.id}
                              />
                            );
                          })}
                        </ul>
                      </section>
                      <LongParagraph charLimit={PARAGRAPH_CHAR_LIMIT}>
                        {h!.description}
                      </LongParagraph>
                    </section>
                    <section className="text-xs italic capitalize flex flex-col justify-end basis-1/12">
                      <p>Last updated:</p>
                      <p>
                        {formatRelative(new Date(h!.updatedAt), new Date())}
                      </p>
                    </section>
                    {hoveringId === h!.id ? (
                      <div
                        className="absolute right-4 top-1 flex gap-1 items-center justify-center rounded"
                        aria-label="hour actions"
                      >
                        <button
                          type="button"
                          onClick={createEditHourHandler(h!.id)}
                        >
                          <MdOutlineModeEditOutline
                            className="fill-gray-900 hover:fill-orange-700"
                            size={28}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={createDeleteHourHandler(h!.id)}
                        >
                          <MdDeleteOutline
                            className="fill-gray-900 hover:fill-orange-700"
                            size={28}
                          />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="absolute right-3 top-1 sm:hidden"
                        aria-label="display hour actions"
                      >
                        <button
                          type="button"
                          onClick={createHoverHandler(h!.id)}
                        >
                          <FaEllipsisH size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
};

const Hours = () => {
  const [page, setPage] = useState(1);
  const { isLoading } = trpc.useQuery(["hours.withTagAndProject", { page }]);
  const { data: projects } = trpc.useQuery(["projects.all"]);
  const [editingHourId, setEditingHourId] = useState("");
  const queryClient = trpc.useContext();
  const {
    mutateAsync: deleteOne,
    isLoading: isDeleting,
    error: deleteError,
  } = trpc.useMutation("hours.delete", {
    onSuccess: () => {
      queryClient.invalidateQueries("hours.withTagAndProjectInfinite");
    },
  });
  const [deletingHourId, setDeletingHourId] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const onHourEdit = (id: string) => {
    setEditingHourId(id);
  };
  const onHourDelete = (id: string) => {
    setDeletingHourId(id);
    setShowConfirmationModal(true);
  };
  const handleFinishEdit = () => {
    if (editingHourId) setEditingHourId("");
  };

  const handleCloseConfirm = () => {
    setShowConfirmationModal(false);
    setDeletingHourId("");
  };
  const handleSubmitDelete = async () => {
    await deleteOne({ id: deletingHourId });
    handleCloseConfirm();
  };

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
    "hours.hoursByDate",
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

  return (
    <section className="flex flex-col gap-3 lg:flex-row lg:gap-8 lg:justify-around lg:px-4 hours-container">
      <Head>
        <title>Timetracky - Hours</title>
        <meta name="description" content="Generated by create-t3-app" />
      </Head>
      <section className="flex justify-center  items-start">
        <CreateEditHour
          hourId={editingHourId}
          onFinishEdit={handleFinishEdit}
        />
      </section>
      <section className="flex flex-col gap-2 lg:flex-row-reverse md:flex-grow">
        <section
          aria-label="calendar"
          className=" lg:basis-8/12 flex justify-center"
        >
          <HoursCalendar
            events={events}
            onRangeChange={handleRangeChange}
            onSelectedChange={handleDateSelected}
            selected={datesSelected}
          />
        </section>
        {projects?.length ? (
          <section
            aria-label="hours list"
            className="flex flex-col items-center justify-start relative md:flex-grow md:basis-4/12"
          >
            <BackdropSpinner isLoading={isLoading} />
            <HourList
              page={page}
              onHourDelete={onHourDelete}
              onHourEdit={onHourEdit}
              selectedHourId={editingHourId}
              dateFilter={dateFilter}
            />
          </section>
        ) : null}
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
  );
};

export default Hours;
