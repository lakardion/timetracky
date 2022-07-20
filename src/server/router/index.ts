// src/server/router/index.ts
import { createRouter } from "./context";
import superjson from "superjson";

import { authRouter } from "./auth";
import { timetrackyRouter } from "./timetrackyRouter";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("auth.", authRouter)
  .merge("timetracky.", timetrackyRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
