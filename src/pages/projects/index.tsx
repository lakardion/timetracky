import { zodResolver } from "@hookform/resolvers/zod";
import { CreateProjectInputs, createProjectZod } from "common/validators";
import { Button } from "components/button";
import { FormValidationError, Input } from "components/form";
import { Modal } from "components/modal";
import Head from "next/head";
import { ChangeEventHandler, FC, ReactNode, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import ReactSelect from "react-select";
import { trpc } from "../../utils/trpc";

const placeholderTextClass = "text-gray-400";

const CreateProjectForm: FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const { data: clients } = trpc.useQuery(["clients.all"]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    getValues,
  } = useForm<CreateProjectInputs>({ resolver: zodResolver(createProjectZod) });

  const queryClient = trpc.useContext();

  const { mutateAsync, isLoading } = trpc.useMutation("projects.create", {
    onSuccess: () => {
      queryClient.invalidateQueries(["projects.all"]);
    },
  });

  const onSubmit = async (data: CreateProjectInputs) => {
    await mutateAsync(data);
    onFinished();
  };

  const [selectClassName, setSelectClassName] = useState(placeholderTextClass);
  const handleSelectChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    if (e.target.value === "-1") {
      setSelectClassName(placeholderTextClass);
      return;
    }
    setSelectClassName("");
  };

  const clientOptions = useMemo(() => {
    if (!clients) return [];
    return clients.map((c) => ({ value: c.id, label: c.name }));
  }, [clients]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3 justify-between flex-grow"
    >
      <h1 className="text-3xl font-semibold">Create a project</h1>
      <label htmlFor="name" className="font-medium">
        Name
      </label>
      <Input placeholder="Name" {...register("name")} />
      <FormValidationError error={errors.name} />
      <label htmlFor="clientId" className="font-medium">
        Client
      </label>
      <Controller
        name="clientId"
        control={control}
        defaultValue={undefined}
        render={({ field }) => (
          <ReactSelect
            options={clientOptions}
            ref={field.ref}
            onBlur={field.onBlur}
            className="text-black"
            value={clientOptions.find((co) => co.value === field.value)}
            onChange={(value) => {
              field.onChange(value?.value);
            }}
            placeholder="Select a client..."
          />
        )}
      />
      <FormValidationError error={errors.clientId} />
      <section className="flex gap-2">
        <Button
          className="flex-grow"
          type="submit"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Create project
        </Button>
        <Button className="flex-grow" onClick={onFinished} disabled={isLoading}>
          Cancel
        </Button>
      </section>
    </form>
  );
};
const CreateProjectModal: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [transition, setTransition] = useState(false);

  return (
    <Modal
      onBackdropClick={onClose}
      className="min-w-[400px] min-h-[300px] flex flex-col"
    >
      <CreateProjectForm onFinished={onClose} />
    </Modal>
  );
};

const ProjectsLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <section className="flex flex-col gap-2">
      <Head>
        <title>Timetracky - Projects</title>
      </Head>
      {children}
    </section>
  );
};

const ProjectList = () => {
  const { data: projects } = trpc.useQuery(["projects.all"]);

  if (!projects?.length) {
    return (
      <div className="w-full flex justify-center">
        <p className="italic">No projects found</p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-3 justify-center items-center">
      {projects.map((p) => {
        const hoursCount = p.hours?.length ?? 0;
        const hourPlural = "hour" + (hoursCount > 1 ? "s" : "");
        return (
          <li
            key={p.id}
            className="p-4 border border-solid border-gray-600/50 rounded hover:border-orange-400 flex justify-between w-full sm:max-w-2xl relative"
          >
            <section aria-label="project name" className="font-medium">
              {p.name}
            </section>
            <section aria-label="project hours">
              {hoursCount} {hourPlural}
            </section>
          </li>
        );
      })}
    </ul>
  );
};
const Projects = () => {
  const [showAddProject, setShowAddProject] = useState(false);
  const handleToggleShow = () => {
    setShowAddProject((s) => !s);
  };
  const { data: clients } = trpc.useQuery(["clients.all"]);

  if (!clients?.length) {
    //todo: detect if user is admin and add link to go to administration or invite user to ask an admin to add it
    return (
      <ProjectsLayout>
        <section>
          <p className="text-center italic text-base">
            No clients found. Clients are required to create projects
          </p>
        </section>
      </ProjectsLayout>
    );
  }

  return (
    <ProjectsLayout>
      <div className="w-full flex justify-center">
        <Button onClick={handleToggleShow}>Add a project</Button>
      </div>
      <ProjectList />
      {showAddProject && <CreateProjectModal onClose={handleToggleShow} />}
    </ProjectsLayout>
  );
};
export default Projects;
