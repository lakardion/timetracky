import { RoleType } from '@prisma/client';
import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Home from 'pages';
import { FC, ReactNode } from 'react';
import { trpc } from 'utils/trpc';
import { Button } from './button';

const LoginActions = () => {
  const { data: session } = useSession();
  const handleLogin = () => {
    signIn('google');
  };
  const handleLogout = () => {
    signOut();
  };

  const handleGoToProfile = () => {
    // router.push("/profile")
  };

  if (!session) {
    return <Button onClick={handleLogin}>Login</Button>;
  }

  return (
    <section className="flex items-center gap-4">
      <div className="inline-flex flex-wrap items-center justify-end gap-1">
        <p className="hidden sm:inline-flex">Welcome</p>
        <button className="flex items-center gap-1 hover:text-orange-400" type="button" onClick={handleGoToProfile}>
          {session.user?.name}
          <Image alt="user image" className="rounded-full" height={30} src={session.user?.image ?? ''} width={30} />
        </button>
      </div>
      <Button onClick={handleLogout}>Logout</Button>
    </section>
  );
};

const Header = () => {
  return (
    <header className="flex items-center justify-between bg-gray-800 px-3 py-2 text-white">
      <section>Timetracky</section>
      <LoginActions />
    </header>
  );
};

const routes: {
  key: string;
  href: string;
  label: string;
  roleRequired: RoleType;
}[] = [
  { key: 'hours', href: 'hours', label: 'Hours', roleRequired: 'USER' },
  { key: 'time-off', href: 'time-off', label: 'Time off', roleRequired: 'USER' },
  {
    key: 'projects',
    href: 'projects',
    label: 'Projects',
    roleRequired: 'ADMIN',
  },
  { key: 'reports', href: 'reports', label: 'Reports', roleRequired: 'ADMIN' },
  {
    key: 'admin',
    href: 'administration',
    label: 'Administration',
    roleRequired: 'ADMIN',
  },
];

const NavigationLinkList = () => {
  const { pathname } = useRouter();
  const { data: session } = trpc.useQuery(['auth.getSession']);
  const { data: user } = trpc.useQuery(['auth.me'], {
    enabled: Boolean(session),
  });

  if (!user) return null;

  return (
    <ul className="flex gap-3 py-2 pl-2">
      {routes.flatMap((r) => {
        if (r.roleRequired === 'ADMIN' && user?.roleType !== 'ADMIN') return [];

        return [
          <Link key={r.key} href={`/${r.href}`}>
            <button className={`text-white hover:text-orange-400 ${pathname.includes('/' + r.href) ? 'text-orange-400' : ''}`} type="button">
              {r.label}
            </button>
          </Link>,
        ];
      })}
    </ul>
  );
};

const NavigationBar = () => {
  const { status, data: session } = useSession();

  if (status === 'loading') {
    return null;
  }

  return (
    <aside>
      <nav className="bg-gradient-to-b from-gray-800 to-gray-700">
        <NavigationLinkList />
      </nav>
    </aside>
  );
};

export const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const { data: session } = trpc.useQuery(['auth.getSession']);

  return (
    <>
      <Header />
      <section>
        <NavigationBar />
        <main className="p-4">{session ? children : <Home />}</main>
      </section>
    </>
  );
};
