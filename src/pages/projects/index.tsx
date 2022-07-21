import { zodResolver } from "@hookform/resolvers/zod";
import { CreateProjectInputs, createProjectZod } from "common/validators";
import { Button } from "components/button";
import { FormValidationError, Input, Select } from "components/form";
import { Modal } from "components/modal";
import Head from "next/head";
import { ChangeEventHandler, FC, ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { trpc } from "../../utils/trpc";

const placeholderTextClass = "text-gray-400";

const CreateProjectForm: FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const { data: clients } = trpc.useQuery(["timetracky.clients"]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<CreateProjectInputs>({ resolver: zodResolver(createProjectZod) });

  const queryClient = trpc.useContext();

  const { mutateAsync, isLoading } = trpc.useMutation(
    "timetracky.createProject",
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["timetracky.projects"]);
      },
    }
  );

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
      <FormValidationError errors={errors} fieldKey="name" />
      <label htmlFor="clientId" className="font-medium">
        Client
      </label>
      <Select
        {...register("clientId")}
        placeholder="Select a client"
        defaultValue={-1}
        onChange={handleSelectChange}
        className={selectClassName}
      >
        <option key={-1} value={-1}>
          Select a client
        </option>
        {clients?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <FormValidationError errors={errors} fieldKey="clientId" />
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

  //? lol handcraft animation
  useEffect(() => {
    setTransition(true);
  }, []);

  const opacityValue = transition ? "opacity-100" : "opacity-0";
  return (
    <Modal
      onClose={onClose}
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
  const { data: projects } = trpc.useQuery(["timetracky.projects"]);

  if (!projects?.length) {
    return (
      <div className="w-full flex justify-center">
        <p className="italic">No projects found</p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {projects.map((p) => {
        const hoursCount = p.hours?.length ?? 0;
        const hourPlural = "hour" + (hoursCount > 1 ? "s" : "");
        return (
          <li
            key={p.id}
            className="p-4 border border-solid border-gray-600/50 rounded hover:border-orange-400 flex justify-between"
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
