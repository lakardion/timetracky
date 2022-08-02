import { TRPCError } from '@trpc/server';
import { maskEmail } from 'utils';
import { createRouter } from './context';

export const authRouter = createRouter()
  .query('getSession', {
    resolve({ ctx }) {
      return ctx.session;
    },
  })
  .middleware(async ({ ctx, next }) => {
    // Any queries or mutations after this middleware will
    // raise an error unless there is a current session
    if (!ctx.session) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next();
  })
  .query('getSecretMessage', {
    async resolve({ ctx }) {
      return 'You are logged in and can see this secret message!';
    },
  })
  .query('getUsers', {
    async resolve({ ctx }) {
      if (!ctx.session?.user) {
        ctx.res?.status(401).json({ message: 'Unauthorized' });
      }
      //todo: will need pagination
      const users = await ctx.prisma.user.findMany({
        include: {
          hours: true,
          projects: true,
        },
      });
      return users.map((u) => {
        const maskedEmail = maskEmail(u.email ?? '');
        const hourCount = u.hours.reduce(
          (sum, h) => sum + h.value.toNumber(),
          0
        );
        const projectCount = u.projects.length;
        return {
          id: u.id,
          name: u.name,
          maskedEmail,
          image: u.image,
          hourCount,
          projectCount,
        };
      });
    },
  })
  .query('me', {
    resolve({ ctx }) {
      //I know this cannot be undefined because we do have session at this point
      return ctx.prisma.user.findUnique({
        where: { id: ctx.session!.user!.id },
      });
    },
  });
