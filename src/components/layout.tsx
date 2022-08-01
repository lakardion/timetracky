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
  const handleLogin = () => {
    signIn("google");
  };
  const handleLogout = () => {
    signOut();
  };

  const handleGoToProfile = () => {
    // router.push("/profile")
  };

  return <Button onClick={handleLogin}>Login</Button>;
};

const Header = () => {
  return (
    <header className="flex items-center justify-between bg-gray-800 px-3 py-2 text-white">
      <section>Timetracky</section>
      <LoginActions />
    </header>
  );
};

const NavigationLinkList = () => {
  const { pathname } = useRouter();
  // const { data: session } = trpc.useQuery(["auth.getSession"]);
  // const { data: user } = trpc.useQuery(["auth.me"], {
  //   enabled: Boolean(session),
  // });

  // if (!user) return null;
  return (
    <ul className="flex gap-3 py-2 pl-2">
      {routes.flatMap((r) => {
        // if (r.roleRequired === "ADMIN" && user?.roleType !== "ADMIN") return [];
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
  return (
    <aside>
      <nav className="bg-gradient-to-b from-gray-800 to-gray-700">
        <NavigationLinkList />
      </nav>
    </aside>
  );
};
export const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  // const { data: session } = trpc.useQuery(["auth.getSession"]);
  const { data: helloworld } = trpc.useQuery(["public.hello-world"]);

  console.log("hellowworld variable", helloworld);
  return (
    <>
      <Header />
      <section>
        <NavigationBar />
        {/* <main className="p-4">{session ? children : <Home />}</main> */}
        <main className="p-4">{<Home />}</main>
      </section>
    </>
  );
};
