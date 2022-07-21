import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateHourFormInputs,
  CreateHourInputs,
  createHourZodForm,
} from "common/validators";
import { Button } from "components/button";
import { Input, TextArea } from "components/form";
import { BackdropSpinner } from "components/tw-spinner";
import { format } from "date-fns";
import Head from "next/head";
import Link from "next/link";
import { FC, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import ReactSelect from "react-select";
import { parseDatepicker } from "utils/date";
import { trpc } from "../../utils/trpc";

const AddHour = () => {
  //todo: might need to define pagination?. These could go wild otherwise
  const { data: projects } = trpc.useQuery(["timetracky.projects"]);
  const { data: tags } = trpc.useQuery(["timetracky.tags"]);

  const queryClient = trpc.useContext();

  const { mutateAsync, isLoading } = trpc.useMutation("timetracky.createHour", {
    onSuccess: () => {
      queryClient.invalidateQueries(["timetracky.hoursWithProject"]);
    },
  });
  const {
    register,
    formState: { errors },
    control,
    handleSubmit,
  } = useForm<CreateHourFormInputs>({
    resolver: zodResolver(createHourZodForm),
  });

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
    const newHour = await mutateAsync(parsedData);
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
    <form
      className="flex flex-col gap-2 bg-gray-700 p-4 pb-5 rounded-lg text-white max-w-[600px] md:max-w-max justify-center"
      onSubmit={handleSubmit(onSubmit)}
    >
      <h1 className="text-2xl text-center">Add an hour entry</h1>
      <section aria-label="hour date" className="flex gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="value" className="font-medium">
            Value
          </label>
          <Input type="number" {...register("value")} defaultValue={0} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="date" className="font-medium">
            Date
          </label>
          <Input type="date" {...register("date")} />
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
            className="text-black"
            value={projectOptions.find((po) => po.value === field.value)}
            onChange={(value) => {
              field.onChange(value?.value);
            }}
            placeholder="Select a project..."
          />
        )}
      />

      <label htmlFor="description" className="font-medium">
        Description
      </label>
      <TextArea
        {...register("description")}
        placeholder="Describe the activity"
      />
      <label htmlFor="tags" className="font-medium">
        Tags
      </label>
      <Controller
        name="tagIds"
        control={control}
        defaultValue={[]}
        render={({ field, fieldState, formState }) => (
          <ReactSelect
            isMulti
            options={tagOptions}
            onBlur={field.onBlur}
            ref={field.ref}
            className="text-black"
            onChange={(value) => {
              field.onChange(value.map((v) => v.value));
            }}
            value={tagOptions.filter((to) => field.value.includes(to.value))}
            placeholder="Select tags..."
          />
        )}
      />
      <section className="p-4 flex justify-center">
        <Button type="submit" isLoading={isLoading} className="w-56">
          Add
        </Button>
      </section>
    </form>
  );
};

const HourList: FC<{ page: number }> = ({ page }) => {
  const { data: paginatedHours } = trpc.useQuery(
    ["timetracky.hoursWithProject", { page }],
    { keepPreviousData: true }
  );

  if (!paginatedHours?.hours.length) {
    return <p className="italic">No hours</p>;
  }

  return (
    <ul className="w-full flex justify-start items-center flex-col gap-3 h-[600px] overflow-auto">
      {paginatedHours.hours?.map((h) => (
        <li
          key={h.id}
          className="bg-gray-300 w-full rounded-lg max-w-5xl p-3  flex gap-3"
        >
          <section className="w-24 h-24 bg-gray-700 flex flex-col items-center justify-between rounded py-3 text-white border-4 border-gray-600 drop-shadow-lg">
            <h1 className="text-3xl">
              {h.value} <span className="text-sm italic"> hs</span>
            </h1>
            <p aria-label="date" className="italic ">
              {format(h.date, "M-dd-yyyy")}
            </p>
          </section>
          <section>
            <h1 className="text-3xl">{h.project.name}</h1>
            <p aria-label="description" className="text-sm">
              {h.description}
            </p>
          </section>
        </li>
      ))}
    </ul>
  );
};

const Hours = () => {
  const [page, setPage] = useState(1);
  const { isLoading } = trpc.useQuery([
    "timetracky.hoursWithProject",
    { page },
  ]);
  return (
    <section className="flex flex-col gap-3 md:flex-row md:gap-8 md:justify-around md:px-4">
      <Head>
        <title>Timetracky - Hours</title>
        <meta name="description" content="Generated by create-t3-app" />
      </Head>
      <section className="flex justify-center">
        <AddHour />
      </section>
      <section
        aria-label="hours list"
        className="flex flex-col items-center justify-center relative md:flex-grow"
      >
        <BackdropSpinner isLoading={isLoading} />
        <HourList page={page} />
      </section>
    </section>
  );
};

export default Hours;
