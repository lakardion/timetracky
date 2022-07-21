import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateHourFormInputs,
  CreateHourInputs,
  createHourZodForm,
} from "common/validators";
import { Button } from "components/button";
import { Input, TextArea } from "components/form";
import { Spinner } from "components/tw-spinner";
import { format } from "date-fns";
import Head from "next/head";
import Link from "next/link";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import ReactSelect from "react-select";
import { parseDatepicker } from "utils/date";
import { trpc } from "../../utils/trpc";

const AddHour = () => {
  const { data: projects } = trpc.useQuery(["timetracky.projects"]);
  const { data: tags } = trpc.useQuery(["timetracky.tags"]);

  const { mutateAsync, isLoading } = trpc.useMutation("timetracky.createHour");
  const queryInvalidator = trpc.useContext();
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
    queryInvalidator.invalidateQueries(["timetracky.hoursWithProject"]);
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
      className="flex flex-col gap-2 bg-gray-700 p-4 pb-5 rounded-lg text-white max-w-[600px] md:max-w-max"
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

const HourList = () => {
  const { data: hours, isLoading } = trpc.useQuery([
    "timetracky.hoursWithProject",
  ]);

  if (isLoading) {
    return <Spinner />;
  }
  if (!hours?.length) {
    return <p className="italic">No hours</p>;
  }

  return (
    <ul className="w-full flex justify-center items-center flex-col gap-3">
      {hours?.map((h) => (
        <li key={h.id} className="bg-gray-300 w-full rounded-lg max-w-5xl p-3">
          <h1 className="text-3xl">
            {h.project.name} ({h.value})
          </h1>
          <p aria-label="date" className="italic">
            {format(h.date, "PPPP")}
          </p>
          <p aria-label="description" className="text-sm">
            {h.description}
          </p>
        </li>
      ))}
    </ul>
  );
};

const Hours = () => {
  return (
    <section className="flex flex-col gap-3">
      <Head>
        <title>Timetracky - Hours</title>
        <meta name="description" content="Generated by create-t3-app" />
      </Head>
      <section className="flex justify-center">
        <AddHour />
      </section>
      <section
        aria-label="hours list"
        className="flex flex-col items-center justify-center"
      >
        <HourList />
      </section>
    </section>
  );
};
export default Hours;
