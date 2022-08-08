import { RoleType } from '@prisma/client';
import { getAdministrationLayout } from 'components/administration';
import { Button } from 'components/button';
import { Modal } from 'components/modal';
import Head from 'next/head';
import Image from 'next/image';
import { NextPageWithLayout } from 'pages/_app';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactSelect, { SingleValue } from 'react-select';
import { OptionValueLabel } from 'types';
import { trpc } from 'utils/trpc';

const useUserData = (id: string) => {
  const [selectedRoleOption, setSelectedRoleOption] = useState<OptionValueLabel<RoleType>>(null);

  const oldValueRef = useRef<RoleType | null>(null);

  const queryClient = trpc.useContext();
  const { data: user } = trpc.useQuery(['users.single', { id }]);
  const { mutateAsync: updateRole } = trpc.useMutation('users.updateRole', {
    onSuccess: () => {
      queryClient.invalidateQueries(['users.single', { id }]);
    },
  });

  const roleOptions: OptionValueLabel<RoleType>[] = useMemo(
    () =>
      Object.entries(RoleType).map(([key, value]) => ({
        value: key as RoleType,
        label: value,
      })),
    []
  );

  const handleRoleOptionChange = useCallback((option: OptionValueLabel<RoleType>) => {
    setSelectedRoleOption(option);
  }, []);

  const handleUpdateRole = useCallback(async () => {
    if (selectedRoleOption && oldValueRef.current !== selectedRoleOption.value) {
      await updateRole({ id, role: selectedRoleOption.value });
      oldValueRef.current = selectedRoleOption.value;
    }
  }, [id, selectedRoleOption, updateRole]);

  //the easy one
  useEffect(() => {
    const roleOption = roleOptions.find((r) => r?.value === user?.roleType);
    roleOption && setSelectedRoleOption(roleOption);
    oldValueRef.current = user?.roleType ?? null;
  }, [user?.roleType, roleOptions]);

  return useMemo(
    () => ({
      roleOptions,
      selectedRoleOption,
      handleRoleOptionChange,
      handleUpdateRole,
    }),
    [handleRoleOptionChange, roleOptions, selectedRoleOption, handleUpdateRole]
  );
};

const UserForm: FC<{ id: string; onFinished: () => void }> = ({ id, onFinished }) => {
  const { roleOptions, handleRoleOptionChange, selectedRoleOption, handleUpdateRole } = useUserData(id);
  //Which is the harder and non-useEffecty way?
  // so we have the value from db: user but if we want to sync the information here we definitely need to have a useEffect.
  // how was I doing the other forms?, well I reset the things with A useEffect... so that means probably that these type of things
  // cannot be avoided, we're syncing server with app so it is okay to use useEffect. Maybe we can at least extract this

  const handleSubmit = () => {
    handleUpdateRole();
    onFinished();
  };

  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-3xl">Update user</h1>
      <label htmlFor="role" className="font-medium">
        Role
      </label>
      <ReactSelect<OptionValueLabel<RoleType>>
        options={roleOptions}
        onChange={handleRoleOptionChange}
        formatOptionLabel={(option) => <p className="capitalize">{option?.label}</p>}
        value={selectedRoleOption}
        className="text-black"
      />
      <section aria-label="action buttons" className="flex gap-3">
        <Button onClick={handleSubmit} className="flex-grow">
          Submit
        </Button>
        <Button onClick={onFinished} className="flex-grow">
          {' '}
          Cancel
        </Button>
      </section>
    </section>
  );
};

const Users: NextPageWithLayout = () => {
  const { data: users } = trpc.useQuery(['auth.getUsers']);
  const [showUserModal, setShowUserModal] = useState(false);
  const [currentId, setCurrentId] = useState('');
  const onFinished = () => {
    setCurrentId('');
    setShowUserModal(false);
  };
  const createUserClickHandler = (id: string) => () => {
    setCurrentId(id);
    setShowUserModal(true);
  };

  if (!users) {
    return <></>;
  }
  return (
    <>
      <Head>
        <title>Timetracky - Users</title>
        <meta name="description" content="Generated by create-t3-app" />
      </Head>
      <ul className="flex flex-wrap gap-3">
        {users.map((u) => {
          const userExtraInfo = u.projectCount && u.hourCount ? `${u.hourCount} hours across ${u.projectCount} projects` : 'No hours registered yet';
          return (
            <li key={u.id} className="flex w-80 cursor-pointer gap-3 rounded-lg bg-slate-400 p-4" onClick={createUserClickHandler(u.id)}>
              <section className="rounded-full border border-solid border-gray-400/30 bg-black/40">
                <Image src={u.image ?? ''} alt="User image" height={100} width={100} className="rounded-full" />
              </section>
              <section className="flex flex-col items-center gap-2">
                <h1 className="text-2xl font-medium">{u.name}</h1>
                <p className="text-sm">{u.maskedEmail}</p>
                {userExtraInfo ? <p className="text-sm">{userExtraInfo}</p> : null}
              </section>
            </li>
          );
        })}
        {showUserModal ? (
          <Modal onBackdropClick={onFinished} className="flex flex-col md:min-w-[400px]">
            <UserForm id={currentId} onFinished={onFinished} />
          </Modal>
        ) : null}
      </ul>
    </>
  );
};
Users.getLayout = getAdministrationLayout;
export default Users;
