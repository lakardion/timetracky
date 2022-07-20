import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "components/button";
import { FormValidationError, Input, Select } from "components/form";
import { Modal } from "components/modal";
import Head from "next/head";
import { ChangeEventHandler, FC, ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { trpc } from "../../utils/trpc";

const createProjectValidationSchema = z.object({
  name: z.string().min(1, "Required"),
  clientId: z
    .string()
    .min(1, "Required")
    .refine(
      (data: string) => {
        return data !== "-1";
      },
      { message: "Required" }
    ),
});

const placeholderTextClass = "text-gray-400";

const CreateProjectForm: FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const { data: clients } = trpc.useQuery(["timetracky.clients"]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({ resolver: zodResolver(createProjectValidationSchema) });

  const onSubmit = (data: any) => {};

  const [selectClassName, setSelectClassName] = useState(placeholderTextClass);
  const handleSelectChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    console.log(e.target.value, e.target.value === "-1");
    if (e.target.value === "-1") {
      setSelectClassName(placeholderTextClass);
      return;
    }
    setSelectClassName("");
  };
  console.log("selectedClassName", selectClassName);

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
        <Button className="flex-grow" type="submit">
          Create project
        </Button>
        <Button className="flex-grow" onClick={onFinished}>
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
    <>
      <Head>
        <title>Timetracky - Projects</title>
      </Head>
      {children}
    </>
  );
};

const Projects = () => {
  const { data: projects } = trpc.useQuery(["timetracky.projects"]);
  const [showAddProject, setShowAddProject] = useState(false);

  const handleToggleShow = () => {
    setShowAddProject((s) => !s);
  };

  if (!projects?.length) {
    return (
      <ProjectsLayout>
        <div className="w-full flex justify-center">
          <Button onClick={handleToggleShow}>Add a project</Button>
        </div>
        {showAddProject && <CreateProjectModal onClose={handleToggleShow} />}
      </ProjectsLayout>
    );
  }

  return (
    <ProjectsLayout>
      <Button onClick={handleToggleShow}>Add a project</Button>
      <ul className="flex flex-col">
        {projects.map((p) => (
          <li key={p.id}>
            <section>{p.name}</section>
          </li>
        ))}
      </ul>
    </ProjectsLayout>
  );
};
export default Projects;
