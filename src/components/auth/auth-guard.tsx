import { RoleType } from '@prisma/client';
import { Spinner } from 'components/tw-spinner';
import NotFound from 'pages/404';
import { FC, ReactNode } from 'react';
import { trpc } from 'utils/trpc';

export const AuthGuard: FC<{
  requiredRoles?: RoleType[];
  children: ReactNode;
}> = ({ requiredRoles = [RoleType.USER], children }) => {
  const { data: session } = trpc.useQuery(['auth.getSession']);
  const { data: user, isLoading: isUserLoading } = trpc.useQuery(['auth.me'], {
    enabled: Boolean(session?.user),
  });

  const hasProperRole = requiredRoles.some((rr) => rr === user?.roleType);

  if (isUserLoading) {
    return <Spinner />;
  }

  if (!session || !hasProperRole) {
    return <NotFound />;
  }
  return <>{children}</>;
};
