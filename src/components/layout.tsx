import { RoleType } from "@prisma/client";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Home from "pages";
import { FC, ReactNode } from "react";
import { trpc } from "utils/trpc";
import { Button } from "./button";

const routes: {
  key: string;
  href: string;
  label: string;
  roleRequired: RoleType;
}[] = [
  { key: "hours", href: "hours", label: "Hours", roleRequired: "USER" },
  {
    key: "projects",
    href: "projects",
    label: "Projects",
    roleRequired: "ADMIN",
  },
  { key: "reports", href: "reports", label: "Reports", roleRequired: "ADMIN" },
  {
    key: "admin",
    href: "administration",
    label: "Administration",
    roleRequired: "ADMIN",
  },
];

const LoginActions = () => {
  const { data: session } = useSession();
  const handleLogin = () => {
    signIn("google");
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
    <section className="flex gap-4 items-center">
      <div className="inline-flex flex-wrap gap-1 items-center justify-end">
        <p className="hidden sm:inline-flex">Welcome</p>
        <button
          className="hover:text-orange-400 flex items-center gap-1"
          type="button"
          onClick={handleGoToProfile}
        >
          {session.user?.name}
          <Image
            src={session.user?.image ?? ""}
            width={30}
            height={30}
            alt="user image"
            className="rounded-full"
          />
        </button>
      </div>
      <Button onClick={handleLogout}>Logout</Button>
    </section>
  );
};

const Header = () => {
  return (
    <header className="bg-gray-800 text-white flex justify-between px-3 py-2 items-center">
      <section>Timetracky</section>
      <LoginActions />
    </header>
  );
};

const NavigationLinkList = () => {
  const { pathname } = useRouter();
  const { data: user } = trpc.useQuery(["auth.me"]);

  if (!user) return null;
  return (
    <ul className="flex pl-2 gap-3 py-2">
      {routes.flatMap((r) => {
        if (r.roleRequired === "ADMIN" && user?.roleType !== "ADMIN") return [];
        return [
          <Link href={`/${r.href}`} key={r.key}>
            <button
              type="button"
              className={`text-white hover:text-orange-400 ${
                pathname.includes("/" + r.href) ? "text-orange-400" : ""
              }`}
            >
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
  if (status === "loading") {
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
  const { data: session } = trpc.useQuery(["auth.getSession"]);

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
