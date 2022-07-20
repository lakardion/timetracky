import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC, ReactNode } from "react";
import { Button } from "./button";

const routes: { key: string; href: string; label: string }[] = [
  { key: "hours", href: "hours", label: "Hours" },
  { key: "projects", href: "projects", label: "Projects" },
  { key: "reports", href: "reports", label: "Reports" },
  { key: "admin", href: "administration", label: "Administration" },
];

const LoginActions = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const handleLogin = () => {
    router.push("api/auth/signin");
  };
  const handleLogout = () => {
    // router.push("api/auth/logout");
  };

  const handleGoToProfile = () => {
    // router.push("/profile")
  };

  if (!session) {
    return <Button onClick={handleLogin}>Login</Button>;
  }

  return (
    <section className="flex gap-4 items-center">
      <div>
        Welcome{" "}
        <button
          className="hover:text-orange-400"
          type="button"
          onClick={handleGoToProfile}
        >
          {session.user?.name}
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

const NavigationBar = () => {
  const { pathname } = useRouter();
  return (
    <aside>
      <nav className="bg-gradient-to-b from-gray-800 to-gray-700">
        <ul className="flex pl-2 gap-3 py-">
          {routes.map((r) => (
            <Link href={`/${r.href}`} key={r.key}>
              <button
                type="button"
                className={`text-white hover:text-orange-400 ${
                  pathname.includes("/" + r.href) ? "text-orange-400" : ""
                }`}
              >
                {r.label}
              </button>
            </Link>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
export const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const { data } = useSession();

  const router = useRouter();

  return (
    <>
      <Header />
      <section>
        <NavigationBar />
        <main className="p-4">{children}</main>
      </section>
    </>
  );
};
