import { RoleType } from "@prisma/client";
import { AuthGuard } from "components/auth/auth-guard";
import { Layout } from "components/layout";
import { FC, ReactElement, ReactNode } from "react";

export const getAdministrationLayout = (page: ReactElement) => {
  return <AuthGuard requiredRoles={[RoleType.ADMIN]}>{page}</AuthGuard>;
};
