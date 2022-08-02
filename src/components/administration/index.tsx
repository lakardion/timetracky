import { RoleType } from '@prisma/client';
import { AuthGuard } from 'components/auth/auth-guard';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactElement, useMemo } from 'react';
import { getBreadcrumbArray } from 'utils';
import { MdKeyboardArrowRight } from 'react-icons/md';

const AdministrationBreadCrumbs = () => {
  const router = useRouter();

  const paths: { href: string; key: string }[] = useMemo(() => {
    return getBreadcrumbArray(router.pathname);
  }, [router.pathname]);

  if (paths.length === 1) return <></>;

  return (
    <section
      aria-label="breadcrumbs"
      className="-mt-4 w-full rounded-bl-lg rounded-br-lg bg-gray-200"
    >
      <ul className="flex items-center justify-start gap-3 p-3">
        {paths.map((p, idx) => (
          <>
            <li key={idx}>
              {idx === paths.length - 1 ? (
                <p className="capitalize">{p.key}</p>
              ) : (
                <>
                  <Link href={p.href}>
                    <p className="capitalize text-blue-600 hover:cursor-pointer hover:underline">
                      {p.key}
                    </p>
                  </Link>
                </>
              )}
            </li>
            {idx !== paths.length - 1 && (
              <li>
                <MdKeyboardArrowRight size={20} />
              </li>
            )}
          </>
        ))}
      </ul>
    </section>
  );
};

export const getAdministrationLayout = (page: ReactElement) => {
  return (
    <AuthGuard requiredRoles={[RoleType.ADMIN]}>
      <AdministrationBreadCrumbs />
      <div className="pt-2">{page}</div>
    </AuthGuard>
  );
};
