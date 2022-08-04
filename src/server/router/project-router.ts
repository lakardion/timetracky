import { TRPCError } from '@trpc/server';
import { identifiableZod, searchZod } from 'common/validators';
import { z } from 'zod';
import { createRouter } from './context';

export const projectRouter = createRouter()
  .query('exists', {
    input: z.object({ search: z.string() }),
    async resolve({ ctx, input: { search } }) {
      const existingProject = await ctx.prisma.project.findUnique({
        where: { name: search },
      });
      if (existingProject) {
        return true;
      }
      return false;
    },
  })
  .query('single', {
    input: identifiableZod,
    async resolve({ ctx, input: { id } }) {
      const project = await ctx.prisma.project.findUnique({ where: { id } });
      if (!project)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'The project you tried to get was not found',
        });
      return project;
    },
  })
  .query('all', {
    async resolve({ ctx }) {
      const projects = await ctx.prisma.project.findMany({
        include: { hours: true },
        orderBy: {
          name: 'asc',
        },
      });
      return projects;
    },
  })
  .query('any', {
    async resolve({ ctx }) {
      const firstProj = await ctx.prisma.project.findFirst();
      return !!firstProj;
    },
  })
  .query('search', {
    input: searchZod,
    async resolve({ ctx, input: { query } }) {
      // sigh typescript... It does not understand that 'insensitive' is a valid value
      const whereClause:
        | { name?: { contains?: string; mode?: 'insensitive' | 'default' } }
        | undefined = query
        ? { name: { contains: query, mode: 'insensitive' } }
        : undefined;
      return ctx.prisma.project.findMany({
        where: whereClause,
      });
    },
  })
  .mutation('create', {
    input: z.object({
      name: z.string(),
      clientId: z.string(),
    }),
    async resolve({ ctx, input: { name, clientId } }) {
      if (!ctx.session?.user?.id)
        return ctx.res?.status(401).json({ message: 'Unauthorized' });
      const newProject = prisma?.project.create({
        data: {
          name,
          clientId,
          creatorId: ctx.session.user.id,
        },
      });
      return newProject;
    },
  })
  .mutation('delete', {
    input: identifiableZod,
    async resolve({ ctx, input: { id } }) {
      const project = await ctx.prisma.project.findUnique({
        where: { id },
        select: {
          _count: {
            select: {
              hours: true,
            },
          },
        },
      });
      if (project?._count.hours) {
        return ctx.prisma.project.update({
          where: { id },
          data: {
            isActive: false,
          },
        });
      }
      return ctx.prisma.project.delete({ where: { id } });
    },
  })
  .mutation('update', {
    input: identifiableZod.merge(
      z.object({ name: z.string(), clientId: z.string() })
    ),
    async resolve({ ctx, input: { clientId, id, name } }) {
      return ctx.prisma.project.update({
        where: { id },
        data: {
          clientId,
          name,
        },
      });
    },
  });
