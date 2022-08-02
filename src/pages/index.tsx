import { CenteredSpinner, Spinner } from 'components/tw-spinner';
import type { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { trpc } from '../utils/trpc';

const Home: NextPage = () => {
  const { data: session, isLoading: isSessionLoading } = trpc.useQuery([
    'auth.getSession',
  ]);
  const router = useRouter();
  if (isSessionLoading) {
    return <CenteredSpinner />;
  }
  if (!session) {
    return (
      <section className="flex h-full w-full flex-col items-center justify-center gap-1">
        <h1 className="text-3xl">Welcome!</h1>
        <p>Please sign in to start using the app</p>
      </section>
    );
  } else {
    if (router.asPath === '/') router.push('/hours');
    return <CenteredSpinner />;
  }
};

export default Home;
