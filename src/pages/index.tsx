import { CenteredSpinner, Spinner } from "components/tw-spinner";
import type { NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  // const router = useRouter();
  // const { data: session, isLoading: isSessionLoading } = trpc.useQuery([
  //   "auth.getSession",
  // ]);
  // if (isSessionLoading) {
  //   return <CenteredSpinner />;
  // }
  // if (!session) {
  //   return (
  //     <section className="flex flex-col gap-1 h-full w-full justify-center items-center">
  //       <h1 className="text-3xl">Welcome!</h1>
  //       <p>Please sign in to start using the app</p>
  //     </section>
  //   );
  // } else {
  // if (router.asPath === "/") router.push("/hours");
  return <CenteredSpinner />;
  // }
};

export default Home;
