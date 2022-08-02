import { z } from 'zod';
import { createRouter } from './context';

export const clientRouter = createRouter()
  .query('single', {
    input: z.object({
      clientId: z.string(),
    }),
    async resolve({ ctx, input: { clientId } }) {
      const client = await ctx.prisma.client.findUnique({
        where: {
          id: clientId,
        },
      });
      return client;
    },
  })
  .mutation('update', {
    input: z.object({
      id: z.string(),
      name: z.string(),
    }),
    async resolve({ ctx, input: { id, name } }) {
      const updated = await ctx.prisma.client.update({
        where: {
          id,
        },
        data: { name },
      });
      return updated;
    },
  })
  .mutation('delete', {
    input: z.object({
      clientId: z.string(),
    }),
    async resolve({ ctx, input: { clientId } }) {
      const client = await ctx.prisma.client.findUnique({
        include: { projects: true },
        where: { id: clientId },
      });
      if (client?.projects.length) {
        await ctx.prisma.client.update({
          data: {
            isActive: false,
          },
          where: {
            id: clientId,
          },
        });
        return;
      }
      await ctx.prisma.client.delete({
        where: {
          id: clientId,
        },
      });
    },
  })
  .query('all', {
    async resolve({ ctx }) {
      const clients = await ctx.prisma.client.findMany({
        include: { projects: true },
      });
      return clients;
    },
  })
  .mutation('create', {
    input: z.object({
      name: z.string(),
    }),
    async resolve({ ctx, input }) {
      const newClient = await ctx.prisma.client.create({
        data: {
          name: input.name,
        },
      });

      return newClient;
    },
  });
