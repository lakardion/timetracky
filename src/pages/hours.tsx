import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateHourFormInputs,
  CreateHourInputs,
  createHourZodForm,
} from "common/validators";
import { Button } from "components/button";
import { ConfirmForm } from "components/confirm-form";
import { FormValidationError, Input, TextArea } from "components/form";
import { Modal } from "components/modal";
import { PillListItem } from "components/pill-list-item";
import { BackdropSpinner } from "components/tw-spinner";
import { error } from "console";
import { format } from "date-fns";
import { formatRelative } from "date-fns";
import Head from "next/head";
import Link from "next/link";
import { FC, MouseEvent, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FaEllipsisH } from "react-icons/fa";
import { MdDeleteOutline, MdOutlineModeEditOutline } from "react-icons/md";
import ReactSelect from "react-select";
import { formatDatepicker, parseDatepicker } from "utils/date";
import { trpc } from "utils/trpc";

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
        queryClient.invalidateQueries(["hours.withTagAndProject"]);
      },
    });
  const { mutateAsync: editHour, isLoading: isHourEditing } = trpc.useMutation(
    "hours.edit",
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["hours.withTagAndProject"]);
      },
    }
  );
  const { data: hour } = trpc.useQuery(["hours.single", { id: hourId ?? "" }], {
    enabled: Boolean(hourId),
  });

  const defaultValues = useMemo(
    () => ({
      date: formatDatepicker(hour?.date),
      description: hour?.description,
      projectId: hour?.projectId,
      tagIds: hour?.tags?.map((t) => t.tagId) ?? [],
      value: hour?.value?.toString(),
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
      <BackdropSpinner isLoading={isHourEditing || isHourCreating} />
      <form
        className="flex flex-col gap-2 bg-gray-700 p-4 pb-5 rounded-lg text-white justify-center"
        onSubmit={handleSubmit(onSubmit)}
      >
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
          render={({ field }) => (
            <ReactSelect
              options={projectOptions}
              ref={field.ref}
              onBlur={field.onBlur}
              className="text-black rounded"
              classNamePrefix="timetracky"
              value={projectOptions.find((po) => po.value === field.value)}
              onChange={(value) => {
                field.onChange(value?.value);
              }}
              placeholder="Select a project..."
            />
          )}
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

const HourList: FC<{
  page: number;
  onHourEdit: (id: string) => void;
  onHourDelete: (id: string) => void;
  selectedHourId?: string;
}> = ({ page, onHourEdit, onHourDelete, selectedHourId }) => {
  const { data: paginatedHours } = trpc.useQuery(
    ["hours.withTagAndProject", { page }],
    { keepPreviousData: true }
  );
  const [hoveringId, setHoveringId] = useState("");

  if (!paginatedHours?.hours.length) {
    return <p className="italic">No hours</p>;
  }

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

  return (
    <ul
      className="w-full flex justify-start items-center flex-col gap-3 h-[600px] overflow-auto"
      onClick={createHoverHandler("")}
    >
      {paginatedHours.hours?.map((h) => (
        <li
          key={h.id}
          className={`relative bg-gray-300 w-full rounded-lg max-w-5xl p-3 flex gap-3 ${
            h.id === selectedHourId
              ? "ring-2 ring-orange-300/75 ring-inset"
              : ""
          }`}
          onMouseEnter={createHoverHandler(h.id)}
          onMouseLeave={createHoverHandler("")}
        >
          <section
            aria-label="hour and date box"
            className="w-24 h-24 bg-gray-700 flex flex-col items-center justify-between rounded py-3 text-white border-4 border-gray-600 drop-shadow-lg basis-2/12"
          >
            <h1 className="text-3xl">
              {h.value} <span className="text-sm italic"> hs</span>
            </h1>
            <p aria-label="date" className="italic ">
              {format(h.date, "M-dd-yyyy")}
            </p>
          </section>
          <section
            aria-label="project name, tags, and description"
            className="flex flex-col gap-2 basis-9/12"
          >
            <section>
              <h1 className="text-3xl">{h.project.name}</h1>
              <ul className="flex flex-wrap gap-3 pt-1">
                {h.tags.flatMap((t, idx) => {
                  return <PillListItem content={t.tag.name} key={t.tag.id} />;
                })}
              </ul>
            </section>
            <p aria-label="description" className="text-sm">
              {h.description}
            </p>
          </section>
          <section className="text-xs italic capitalize flex flex-col justify-end basis-1/12">
            <p>Last updated:</p>
            <p>{formatRelative(new Date(h.updatedAt), new Date())}</p>
          </section>
          {hoveringId === h.id ? (
            <div
              className="absolute right-1 top-1 flex gap-1 items-center justify-center rounded"
              aria-label="hour actions"
            >
              <button type="button" onClick={createEditHourHandler(h.id)}>
                <MdOutlineModeEditOutline
                  className="fill-gray-900 hover:fill-orange-700"
                  size={28}
                />
              </button>
              <button type="button" onClick={createDeleteHourHandler(h.id)}>
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
              <button type="button" onClick={createHoverHandler(h.id)}>
                <FaEllipsisH size={15} />
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
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
      queryClient.invalidateQueries("hours.withTagAndProject");
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

  return (
    <section className="flex flex-col gap-3 lg:flex-row lg:gap-8 lg:justify-around lg:px-4">
      <Head>
        <title>Timetracky - Hours</title>
        <meta name="description" content="Generated by create-t3-app" />
      </Head>
      <section className="flex justify-center">
        <CreateEditHour
          hourId={editingHourId}
          onFinishEdit={handleFinishEdit}
        />
      </section>
      {projects?.length ? (
        <section
          aria-label="hours list"
          className="flex flex-col items-center justify-center relative md:flex-grow"
        >
          <BackdropSpinner isLoading={isLoading} />
          <HourList
            page={page}
            onHourDelete={onHourDelete}
            onHourEdit={onHourEdit}
            selectedHourId={editingHourId}
          />
        </section>
      ) : null}
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