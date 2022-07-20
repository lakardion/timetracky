import type { NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  if (!session) {
    return (
      <section className="flex flex-col gap-1 h-full w-full justify-center items-center">
        <h1 className="text-3xl">Welcome!</h1>
        <p>Please sign in to start using the app</p>
      </section>
    );
  } else {
    //TODO: this is causing a flashing in the screen, need to find a better way to handle this (see #2)
    router.push("/hours");
    return <></>;
  }
};

export default Home;
