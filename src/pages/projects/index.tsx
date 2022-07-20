import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "components/button";
import { Modal } from "components/modal";
import Head from "next/head";
import { FC, ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { trpc } from "../../utils/trpc";

const createProjectValidationSchema = z.object({
  name: z.string().min(1, "Required"),
  clientId: z.string().min(1, "Required"),
});

const CreateProjectForm: FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const { data: clients } = trpc.useQuery(["timetracky.clients"]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(createProjectValidationSchema) });

  const onSubmit = (data: any) => {};

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 ">
      <h1 className="text-3xl font-semibold">Create a project</h1>
      <label htmlFor="name" className="font-medium">
        Name
      </label>
      <input
        placeholder="Name"
        {...register("name")}
        className="p-1 text-black h-8"
      />
      <label htmlFor="clientId" className="font-medium">
        Client
      </label>
      <select {...register("clientId")} className="text-black h-8">
        {clients?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
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
    <Modal onClose={onClose}>
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
        <Button onClick={handleToggleShow}>Add a project</Button>
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
