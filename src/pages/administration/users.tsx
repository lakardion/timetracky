import { getAdministrationLayout } from 'components/administration';
import Head from 'next/head';
import Image from 'next/image';
import { NextPageWithLayout } from 'pages/_app';
import { trpc } from 'utils/trpc';

const Users: NextPageWithLayout = () => {
  const { data: users } = trpc.useQuery(['auth.getUsers']);

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
          const userExtraInfo =
            u.projectCount && u.hourCount
              ? `${u.hourCount} hours across ${u.projectCount} projects`
              : 'No hours registered yet';
          return (
            <li
              key={u.id}
              className="flex w-80 gap-3 rounded-lg bg-slate-400 p-4"
            >
              <section className="rounded-full border border-solid border-gray-400/30 bg-black/40">
                <Image
                  src={u.image ?? ''}
                  alt="User image"
                  height={100}
                  width={100}
                  className="rounded-full"
                />
              </section>
              <section className="flex flex-col items-center gap-2">
                <h1 className="text-2xl font-medium">{u.name}</h1>
                <p className="text-sm">{u.maskedEmail}</p>
                {userExtraInfo ? (
                  <p className="text-sm">{userExtraInfo}</p>
                ) : null}
              </section>
            </li>
          );
        })}
      </ul>
    </>
  );
};
Users.getLayout = getAdministrationLayout;
export default Users;
