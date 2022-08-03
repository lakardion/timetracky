import { RoleType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { identifiableZod } from 'common/validators';
import { z } from 'zod';
import { createRouter } from './context';

/**
 * Router to take care of properly authorizing the requests that attempt to change a user. Only self and admins can change a given user
 */
const selfOrAdminRouter = createRouter().middleware(
  async ({ rawInput, ctx, next }) => {
    const inputParseResult = identifiableZod.safeParse(rawInput);
    if (!inputParseResult.success)
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User routes require a user id to be passed',
      });
    if (inputParseResult.data.id === ctx.session?.user?.id) {
      return next();
    }
    //if the requester is no the user then we must check whether they're adming
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session?.user?.id },
    });
    if (user?.roleType === 'ADMIN') {
      return next();
    }
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Cannot operate on a user that is not you',
    });
  }
);

export const userRouter = createRouter()
  .merge(selfOrAdminRouter)
  .query('single', {
    input: identifiableZod,
    async resolve({ ctx, input: { id } }) {
      const user = await ctx.prisma.user.findUnique({ where: { id } });
      return user;
    },
  })
  .mutation('updateRole', {
    input: identifiableZod.merge(z.object({ role: z.nativeEnum(RoleType) })),
    async resolve({ ctx, input: { role, id } }) {
      const updated = await ctx.prisma.user.update({
        where: { id },
        data: {
          roleType: role,
        },
      });

      return updated;
    },
  });
