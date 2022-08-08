// src/server/router/index.ts
import { createRouter } from './context';
import superjson from 'superjson';

import { authRouter } from './auth';
import { hourRouter } from './hour-router';
import { projectRouter } from './project-router';
import { tagRouter } from './tag-router';
import { clientRouter } from './client-router';
import { userRouter } from './user-router';
import { gcalRouter } from './gcal-router';

export const appRouter = createRouter()
  .transformer(superjson)
  .merge('auth.', authRouter)
  .merge('hours.', hourRouter)
  .merge('projects.', projectRouter)
  .merge('tags.', tagRouter)
  .merge('clients.', clientRouter)
  .merge('users.', userRouter)
  .merge('gcal.', gcalRouter);
// export type definition of API
export type AppRouter = typeof appRouter;
