import { Button } from 'components/button';
import { ConfirmForm } from 'components/confirm-form';
import { FormValidationError, Input } from 'components/form';
import { Modal } from 'components/modal';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChangeEventHandler,
  FC,
  MouseEvent,
  ReactNode,
  useMemo,
  useState,
} from 'react';
import { Controller, DeepPartial } from 'react-hook-form';
import { FaEllipsisH } from 'react-icons/fa';
import { MdDeleteOutline, MdOutlineModeEditOutline } from 'react-icons/md';
import ReactSelect from 'react-select';
import { useEntityAwareForm } from 'utils/forms';
import { z } from 'zod';
import { createTRPCVanillaClient, trpc } from '../utils/trpc';
import superjson from 'superjson';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { AuthGuard } from 'components/auth/auth-guard';
import { RoleType } from '@prisma/client';
import { NextPageWithLayout } from './_app';
import { CenteredSpinner } from 'components/tw-spinner';

const placeholderTextClass = 'text-gray-400';

const createProjectFormZod = z.object({
  name: z
    .string()
    .min(1, 'Required')
    .refine(async (value) => {
      try {
        const client = createTRPCVanillaClient();
        const result = await client.query('projects.exists', {
          search: value,
        });
        return !result;
      } catch (error) {
        console.error(error);
        return false;
      }
    }, 'Project name already exists, please choose another'),
  clientId: z
    .string()
    .min(1, 'Required')
    .refine(
      (data: string) => {
        return data !== '-1';
      },
      { message: 'Required' }
    ),
});

export type CreateProjectInputs = z.infer<typeof createProjectFormZod>;

const CreateEditForm: FC<{ onFinished: () => void; id: string }> = ({
  onFinished,
  id,
}) => {
  //TODO: paginate or make async select
  const { data: clients } = trpc.useQuery(['clients.all']);
  const { data: project } = trpc.useQuery(['projects.single', { id }], {
    enabled: Boolean(id),
  });
  const defaultValues: DeepPartial<CreateProjectInputs> = useMemo(
    () => ({
      clientId: project?.clientId ?? '',
      name: project?.name ?? '',
    }),
    [project]
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    getValues,
  } = useEntityAwareForm<CreateProjectInputs>(
    defaultValues,
    createProjectFormZod
  );

  const queryClient = trpc.useContext();
  const { mutateAsync: create, isLoading: isCreating } = trpc.useMutation(
    'projects.create',
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projects.all']);
      },
    }
  );
  const { mutateAsync: update, isLoading: isUpdating } = trpc.useMutation(
    'projects.update',
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects.all');
      },
    }
  );

  const onSubmit = async (data: CreateProjectInputs) => {
    id && project
      ? await update({ id, clientId: data.clientId, name: data.name })
      : await create(data);
    onFinished();
  };

  const [selectClassName, setSelectClassName] = useState(placeholderTextClass);
  const handleSelectChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    if (e.target.value === '-1') {
      setSelectClassName(placeholderTextClass);
      return;
    }
    setSelectClassName('');
  };

  const clientOptions = useMemo(() => {
    if (!clients) return [];
    return clients.map((c) => ({ value: c.id, label: c.name }));
  }, [clients]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-grow flex-col justify-between gap-3"
    >
      <h1 className="text-3xl font-semibold">
        {id ? 'Edit project' : 'Create project'}
      </h1>
      <label htmlFor="name" className="font-medium">
        Name
      </label>
      <Input placeholder="Name" {...register('name')} />
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
            classNamePrefix={'timetracky'}
            value={clientOptions.find((co) => co.value === field.value) ?? null}
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
          isLoading={isCreating || isUpdating}
          disabled={isCreating || isUpdating}
        >
          {id ? 'Edit project' : 'Create project'}
        </Button>
        <Button
          className="flex-grow"
          onClick={onFinished}
          disabled={isCreating || isUpdating}
        >
          Cancel
        </Button>
      </section>
    </form>
  );
};

const ProjectList: FC<{
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ onEdit, onDelete }) => {
  const [hoveringId, setHoveringId] = useState('');
  const { data: projects } = trpc.useQuery(['projects.all']);

  const [parent] = useAutoAnimate<HTMLUListElement>();

  if (!projects?.length) {
    return (
      <div className="flex w-full justify-center">
        <p className="italic">No projects found</p>
      </div>
    );
  }
  const createHoverHandler =
    (id: string) =>
    (e: MouseEvent<HTMLButtonElement> | MouseEvent<HTMLLIElement>) => {
      e?.stopPropagation();
      setHoveringId(id);
    };
  const createEditHandler =
    (id: string) => (e: MouseEvent<HTMLButtonElement>) => {
      e?.stopPropagation();
      onEdit(id);
    };
  const createDeleteHandler =
    (id: string) => (e: MouseEvent<HTMLButtonElement>) => {
      e?.stopPropagation();
      onDelete(id);
    };
  const clearHover = () => {
    setHoveringId('');
  };
  return (
    <ul
      className="flex flex-col items-center justify-center gap-3"
      ref={parent}
    >
      {projects.map((p) => {
        const hoursCount = p.hours?.length ?? 0;
        const hourPlural = 'h' + (hoursCount > 1 ? 's' : '');
        return (
          <li
            key={p.id}
            className="relative flex w-full justify-between rounded border border-solid border-gray-600/50 bg-gray-400/50 p-4 px-7 hover:border-orange-400 sm:max-w-2xl"
            onClick={clearHover}
            onMouseEnter={createHoverHandler(p.id)}
            onMouseLeave={createHoverHandler('')}
          >
            <section aria-label="project name" className="font-medium">
              {p.name}
            </section>
            <section aria-label="project hours">
              {hoursCount ? `${hoursCount} ${hourPlural}` : 'No hours'}
            </section>
            {hoveringId === p.id ? (
              <div
                className="absolute -right-3 -top-3 flex items-center justify-center gap-1 rounded"
                aria-label="hour actions"
              >
                <button
                  type="button"
                  onClick={createEditHandler(p.id)}
                  className="rounded-full bg-red-300 p-1"
                >
                  <MdOutlineModeEditOutline
                    className="fill-gray-900 hover:fill-orange-700"
                    size={20}
                  />
                </button>
                <button
                  type="button"
                  onClick={createDeleteHandler(p.id)}
                  className="rounded-full bg-red-300 p-1"
                >
                  <MdDeleteOutline
                    className="fill-gray-900 hover:fill-orange-700"
                    size={20}
                  />
                </button>
              </div>
            ) : (
              <div
                className="absolute right-3 top-1 lg:hidden"
                aria-label="display hour actions"
              >
                <button type="button" onClick={createHoverHandler(p.id)}>
                  <FaEllipsisH size={15} />
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};
const Projects: NextPageWithLayout = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState('');
  const handleCreateEditOpen = () => {
    setShowAddProject(true);
  };
  const handleFinished = () => {
    setCurrentProjectId('');
    setShowAddProject(false);
  };
  const queryClient = trpc.useContext();
  const { data: clients, isLoading: areClientsLoading } = trpc.useQuery([
    'clients.all',
  ]);
  const { isLoading: areProjectsLoading } = trpc.useQuery(['projects.all']);
  const {
    mutateAsync: deleteOne,
    isLoading: isDeleting,
    error: deleteError,
  } = trpc.useMutation(['projects.delete'], {
    onSuccess: () => {
      queryClient.invalidateQueries('projects.all');
    },
  });

  const handleEdit = (id: string) => {
    setCurrentProjectId(id);
    setShowAddProject(true);
  };
  const handleShowDeleteconfirmation = (id: string) => {
    setCurrentProjectId(id);
    setShowConfirmation(true);
  };
  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setCurrentProjectId('');
  };
  const handleSubmitDelete = async () => {
    await deleteOne({ id: currentProjectId });
    handleConfirmationClose();
  };

  if (areClientsLoading || areProjectsLoading) {
    return <CenteredSpinner />;
  }

  if (!clients?.length) {
    return (
      <>
        <section>
          <p className="text-center text-base italic">
            No clients found.{' '}
            <Link href="/administration/clients">
              <button
                type="button"
                className="text-blue-600 visited:text-purple-500 hover:underline"
              >
                Clients
              </button>
            </Link>{' '}
            are required to create projects
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="flex w-full justify-center">
        <Button onClick={handleCreateEditOpen}>Add a project</Button>
      </div>
      <ProjectList
        onDelete={handleShowDeleteconfirmation}
        onEdit={handleEdit}
      />
      {showAddProject && (
        <Modal
          onBackdropClick={handleFinished}
          className="flex flex-col md:min-h-[300px] md:min-w-[400px]"
        >
          <CreateEditForm onFinished={handleFinished} id={currentProjectId} />
        </Modal>
      )}
      {showConfirmation && (
        <Modal onBackdropClick={handleConfirmationClose}>
          <ConfirmForm
            body="Are you sure you want to delete this project?"
            onCancel={handleConfirmationClose}
            onConfirm={handleSubmitDelete}
            errorMessage={deleteError?.message}
            isConfirming={isDeleting}
          />
        </Modal>
      )}
    </>
  );
};

Projects.getLayout = (page) => {
  return (
    <AuthGuard requiredRoles={[RoleType.ADMIN]}>
      <section className="flex flex-col gap-2">
        <Head>
          <title>Timetracky - Projects</title>
        </Head>
        {page}
      </section>
    </AuthGuard>
  );
};

export default Projects;
