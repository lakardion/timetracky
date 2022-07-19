import { Button } from "components/button";
import { Modal } from "components/modal";
import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "utils/trpc";
import { Spinner } from "components/tw-spinner";

type Inputs = {
  name: string;
};
const clientEditCreateValidator = z.object({
  name: z.string().min(1, "Required"),
});
const ClientEditCreateForm: FC<{
  onFinish: () => void;
  onSubmit: (data: Inputs) => void;
}> = ({ onFinish }) => {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(clientEditCreateValidator),
  });

  const queryInvalidator = trpc.useContext();
  const { isLoading, mutateAsync } = trpc.useMutation(
    "timetracky.createClient",
    {
      onSuccess: () => {
        queryInvalidator.invalidateQueries(["timetracky.clients"]);
      },
    }
  );

  const onSubmit = async (data: Inputs) => {
    const createdClient = await mutateAsync({ name: data.name });
    onFinish();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 p-4">
      <h1 className="text-3xl font-semibold">Create a client</h1>
      <label htmlFor="name" className="font-medium">
        Name
      </label>
      <input
        {...register("name")}
        className="border border-solid border-gray-400 rounded-md px-2 py-1 text-black"
      />
      <p className="text-red-500 font-medium">{errors.name?.message}</p>
      <div className="flex gap-3">
        <Button
          type="submit"
          className="flex-grow"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Create
        </Button>
        <Button className="flex-grow" onClick={onFinish} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

const ClientList = () => {
  const { data: clients, isLoading } = trpc.useQuery(["timetracky.clients"], {
    keepPreviousData: true,
  });

  if (!clients && isLoading) {
    return <Spinner />;
  }
  if (!clients?.length) {
    return <p className="text-xl">No clients to show</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {clients.map((c) => {
        const projectsCount = c.projects?.length ?? 0;
        const projectPlural = "project" + (projectsCount > 1 ? "s" : "");
        return (
          <li
            key={c.id}
            className="p-4 border border-solid border-gray-600/50 rounded hover:border-orange-400 flex justify-between"
          >
            <div className="font-semibold">{c.name}</div>
            <div>
              {c.projects?.length
                ? `${c.projects.length} ${projectPlural}`
                : "No projects for this client"}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

const Clients = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = () => {
    setIsOpen(false);
  };
  const handleOpen = () => {
    setIsOpen(true);
  };
  const handleSubmit = () => {};

  return (
    <>
      <section aria-label="actions" className="w-full flex justify-center">
        <Button onClick={handleOpen}>Add a client</Button>
      </section>
      <section className="pt-2">
        <ClientList />
      </section>
      {isOpen ? (
        <Modal onClose={handleClose}>
          <ClientEditCreateForm
            onFinish={handleClose}
            onSubmit={handleSubmit}
          />
        </Modal>
      ) : null}
    </>
  );
};
export default Clients;
