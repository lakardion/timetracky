import { AdminCard } from "components/admin-card";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { IconType } from "react-icons";
import { MdBusiness } from "react-icons/md";

interface AdminCard {
  title: string;
  description: string;
  href: string;
  icon: IconType;
}
const administrationCards: AdminCard[] = [
  {
    title: "Clients",
    description: "Create, edit, delete clients",
    href: "clients",
    icon: MdBusiness,
  },
];
const Administration = () => {
  const { asPath } = useRouter();
  return (
    <>
      <Head>
        <title>Timetracky - Administration</title>
        <meta name="description" content="Generated by create-t3-app" />
      </Head>
      <section>
        <ul className="flex gap flex-wrap">
          {administrationCards.map((ac) => (
            <li key={ac.href}>
              <Link href={`${asPath}/${ac.href}`}>
                <button type="button" className="hover:opacity-60">
                  <AdminCard
                    title={ac.title}
                    description={ac.description}
                    icon={ac.icon}
                  />
                </button>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};
export default Administration;
