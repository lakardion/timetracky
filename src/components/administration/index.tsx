import { RoleType } from "@prisma/client";
import { AuthGuard } from "components/auth/auth-guard";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactElement, useMemo } from "react";
import { getBreadcrumbArray } from "utils";
import { MdKeyboardArrowRight } from "react-icons/md";

const AdministrationBreadCrumbs = () => {
  const router = useRouter();

  const paths: { href: string; key: string }[] = useMemo(() => {
    console.log(router.pathname);
    return getBreadcrumbArray(router.pathname);
  }, [router.pathname]);

  if (paths.length === 1) return <></>;

  return (
    <section
      aria-label="breadcrumbs"
      className="w-full bg-gray-200 -mt-4 rounded-bl-lg rounded-br-lg"
    >
      <ul className="flex gap-3 justify-start items-center p-3">
        {paths.map((p, idx) => (
          <>
            <li key={idx}>
              {idx === paths.length - 1 ? (
                <p className="capitalize">{p.key}</p>
              ) : (
                <>
                  <Link href={p.href}>
                    <p className="hover:cursor-pointer hover:underline capitalize text-blue-600">
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
