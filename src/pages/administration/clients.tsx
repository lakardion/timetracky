import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'components/button';
import { FormValidationError } from 'components/form';
import { Modal } from 'components/modal';
import { Spinner } from 'components/tw-spinner';
import Head from 'next/head';
import { FC, MouseEventHandler, useState } from 'react';
import { useForm } from 'react-hook-form';
import { trpc } from 'utils/trpc';
import { z } from 'zod';
import { MdDeleteOutline } from 'react-icons/md';
import { ConfirmForm } from 'components/confirm-form';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { NextPageWithLayout } from 'pages/_app';
import { getAdministrationLayout } from 'components/administration';

type Inputs = {
  name: string;
};
const clientEditCreateValidator = z.object({
  name: z.string().min(1, 'Required'),
});
const ClientEditCreateForm: FC<{
  clientId?: string;
  onFinish: () => void;
}> = ({ onFinish, clientId = '' }) => {
  const queryInvalidator = trpc.useContext();
  const { data: client } = trpc.useQuery(
    ['clients.single', { clientId: clientId }],
    { enabled: Boolean(clientId) }
  );

  const { isLoading, mutateAsync: createClient } = trpc.useMutation(
    'clients.create',
    {
      onSuccess: () => {
        queryInvalidator.invalidateQueries(['clients.all']);
      },
    }
  );

  const { isLoading: isEditClientLoading, mutateAsync: updateClient } =
    trpc.useMutation('clients.update', {
      onSuccess: () => {
        queryInvalidator.invalidateQueries(['clients.all']);
      },
    });

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(clientEditCreateValidator),
    defaultValues: {
      name: client?.name,
    },
  });

  const onSubmit = async (data: Inputs) => {
    const createdClient = client?.id
      ? await updateClient({ id: client.id, name: data.name })
      : await createClient({ name: data.name });
    onFinish();
  };

  const formTitle = clientId ? 'Edit client' : 'Create client';
  const buttonLabel = clientId ? 'Edit' : 'Create';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
      <h1 className="text-3xl font-semibold">{formTitle}</h1>
      <label htmlFor="name" className="font-medium">
        Name
      </label>
      <input
        {...register('name')}
        className="rounded-md border border-solid border-gray-400 px-2 py-1 text-black"
      />
      <FormValidationError error={errors.name} />
      <div className="flex gap-3">
        <Button
          type="submit"
          className="flex-grow"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {buttonLabel}
        </Button>
        <Button className="flex-grow" onClick={onFinish} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

const AbsoluteDeleteButton: FC<{
  isHovering: boolean;
  onClick: MouseEventHandler;
}> = ({ isHovering, onClick }) => {
  return (
    <button
      className={`${
        isHovering ? '' : 'hidden'
      } absolute -top-3 -right-3 rounded-full border-2 border-solid border-gray-400 bg-red-300 p-1`}
      onClick={onClick}
    >
      <MdDeleteOutline size={20} />
    </button>
  );
};

const ClientList: FC<{
  onClientClick: (clientId: string) => void;
  onClientDelete: (clientId: string) => void;
}> = ({ onClientClick, onClientDelete }) => {
  const { data: clients, isLoading } = trpc.useQuery(['clients.all'], {
    keepPreviousData: true,
  });

  const [hoveringId, sethoveringId] = useState('');
  const createHoveringHandler = (id: string) => () => {
    sethoveringId(id);
  };
  const removeHover = () => {
    sethoveringId('');
  };
  const [parent] = useAutoAnimate<HTMLUListElement>();
  if (!clients && isLoading) {
    return <Spinner />;
  }
  if (!clients?.length) {
    return (
      <p className="pt-3 text-center text-base italic">No clients to show</p>
    );
  }
  const createClientClickHandler = (id: string) => () => onClientClick(id);
  const createClientDeleteHandler = (id: string) => () => onClientDelete(id);

  return (
    <ul
      className="flex flex-col items-center justify-center gap-3"
      ref={parent}
    >
      {clients.map((c) => {
        const projectsCount = c.projects?.length ?? 0;
        const projectPlural = 'project' + (projectsCount > 1 ? 's' : '');
        return (
          <li
            key={c.id}
            className={`relative w-full rounded border border-solid border-gray-600/50 hover:border-orange-400 sm:max-w-2xl ${
              c.isActive ? '' : 'opacity-50'
            }`}
            onMouseEnter={createHoveringHandler(c.id)}
            onMouseLeave={removeHover}
          >
            <button
              className="flex w-full justify-between p-4"
              type="button"
              onClick={createClientClickHandler(c.id)}
            >
              <p className="font-semibold">
                {c.name}
                {c.isActive ? '' : <span className="italic"> (Inactive)</span>}
              </p>
              <p>
                {c.projects?.length
                  ? `${c.projects.length} ${projectPlural}`
                  : 'No projects for this client'}
              </p>
            </button>
            <AbsoluteDeleteButton
              onClick={createClientDeleteHandler(c.id)}
              isHovering={hoveringId === c.id}
            />
          </li>
        );
      })}
    </ul>
  );
};

const Clients: NextPageWithLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [currentClientId, setCurrentClientId] = useState('');
  const { data: client } = trpc.useQuery(
    ['clients.single', { clientId: currentClientId }],
    {
      enabled: Boolean(currentClientId),
    }
  );
  const queryClient = trpc.useContext();
  const { isLoading: isDeleting, mutateAsync: deleteClient } = trpc.useMutation(
    'clients.delete',
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['clients.all']);
      },
    }
  );
  const handleClose = () => {
    setIsOpen(false);
    setCurrentClientId('');
  };
  const handleOpen = () => {
    setIsOpen(true);
  };
  const handleClientClick = (clientId: string) => {
    setCurrentClientId(clientId);
    setIsOpen(true);
  };

  const handleClientDelete = (clientId: string) => {
    setCurrentClientId(clientId);
    setIsConfirmModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    await deleteClient({ clientId: currentClientId });
    setIsConfirmModalOpen(false);
    setCurrentClientId('');
  };
  const clientIsLoading = Boolean(currentClientId && !client);

  const handleCancelDelete = () => {
    setCurrentClientId('');
    setIsConfirmModalOpen(false);
  };

  return (
    <>
      <Head>
        <title>Timetracky - Clients</title>
        <meta name="description" content="Generated by create-t3-app" />
      </Head>
      <section aria-label="actions" className="flex w-full justify-center">
        <Button onClick={handleOpen}>Add a client</Button>
      </section>
      <section className="pt-2">
        <ClientList
          onClientClick={handleClientClick}
          onClientDelete={handleClientDelete}
        />
      </section>
      {isOpen && !clientIsLoading ? (
        <Modal onBackdropClick={handleClose}>
          <ClientEditCreateForm
            onFinish={handleClose}
            clientId={currentClientId}
          />
        </Modal>
      ) : null}
      {isConfirmModalOpen ? (
        <Modal onBackdropClick={handleClose}>
          <ConfirmForm
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
            isConfirming={isDeleting}
            body="Confirm deleting client"
          />
        </Modal>
      ) : null}
    </>
  );
};

Clients.getLayout = getAdministrationLayout;
export default Clients;
