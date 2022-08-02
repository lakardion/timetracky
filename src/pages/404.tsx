import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { trpc } from 'utils/trpc';

const NotFound = () => {
  const { data: session } = trpc.useQuery(['auth.getSession']);
  const signInToGoogle = () => {
    signIn('google');
  };
  return (
    <main className="flex h-full w-full flex-col items-center justify-center gap-3">
      <h1 className="text-4xl font-medium">Whoops, nothing around here</h1>
      <div className="flex flex-col gap-2">
        {session ? (
          <Link href="/">
            <p className="text-xl text-blue-600 hover:underline">Home</p>
          </Link>
        ) : (
          <p>
            You do not appear to be logged in,{' '}
            <button
              className="text-blue-600 hover:underline"
              onClick={signInToGoogle}
            >
              Log in here!
            </button>
          </p>
        )}
      </div>
    </main>
  );
};

export default NotFound;
