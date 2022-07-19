import Link from "next/link";
import { FC, ReactNode } from "react";

const routes: { key: string; href: string; label: string }[] = [
  { key: "hours", href: "hours", label: "Hours" },
  { key: "projects", href: "projects", label: "Projects" },
  { key: "reports", href: "reports", label: "Reports" },
  { key: "admin", href: "administration", label: "Administration" },
];

export const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const handleLogin = () => {};
  return (
    <>
      <header className="bg-gray-800 text-white flex justify-between px-3 py-2 items-center">
        <section>Timetracky</section>
        <section>
          <button
            className="bg-orange-400 rounded px-2 py-0.5"
            type="button"
            onClick={handleLogin}
          >
            Login
          </button>
        </section>
      </header>
      <section>
        <aside>
          <nav className="bg-gradient-to-b from-gray-800 to-gray-700">
            <ul className="flex pl-2 gap-3 py-">
              {routes.map((r) => (
                <Link href={r.href} key={r.key}>
                  <button
                    type="button"
                    className="text-white hover:text-orange-400"
                  >
                    {r.label}
                  </button>
                </Link>
              ))}
            </ul>
          </nav>
        </aside>
        <main className="container mx-auto flex flex-col items-center justify-center h-screen p-4">
          {children}
        </main>
      </section>
    </>
  );
};
