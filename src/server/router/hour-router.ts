import { TRPCError } from '@trpc/server';
import { createHourZod } from 'common/validators';
import { DEFAULT_HOURS_PAGE_SIZE, getPagination } from 'utils/pagination';
import { z } from 'zod';
import { createRouter } from './context';

export const hourRouter = createRouter()
  .query('single', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ ctx, input: { id } }) {
      if (!ctx.session?.user?.id) {
        return ctx.res?.status(401).json({ message: 'Unauthorized' });
      }
      const hour = await ctx.prisma.hour.findUnique({
        where: { id },
        include: {
          project: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      return { ...hour, value: hour?.value.toNumber() };
    },
  })
  .query('withTagAndProject', {
    input: z.object({
      page: z.number().optional(),
      size: z.number().optional(),
      dateFilter: z
        .object({
          from: z.date(),
          to: z.date(),
        })
        .optional()
        .or(z.date()),
    }),
    async resolve({ ctx, input }) {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Need to be signed in to get this information',
        });
      }
      const { page = 1, size = DEFAULT_HOURS_PAGE_SIZE, dateFilter } = input;
      let dateWhereClause = undefined;
      if (dateFilter instanceof Date) {
        dateWhereClause = dateFilter;
      } else if (dateFilter) {
        dateWhereClause = {
          gte: dateFilter.from,
          lte: dateFilter.to,
        };
      }
      const totalHours = await ctx.prisma.hour.count({
        where: {
          userId: ctx.session.user.id,
          date: dateWhereClause,
        },
      });
      const { count, next, previous } = getPagination({
        count: totalHours,
        size,
        page,
      });
      //TODO: might be able to improve this with selections
      const hours = await ctx.prisma?.hour.findMany({
        where: {
          userId: ctx.session?.user?.id,
          date: dateWhereClause,
        },
        skip: (page - 1) * size,
        take: size,
        include: {
          project: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
      return {
        hours: hours.map((h) => ({ ...h, value: h.value.toNumber() })),
        page,
        count,
        next,
        previous,
      };
    },
  })
  .query('withTagAndProjectInfinite', {
    input: z.object({
      dateFilter: z
        .object({
          from: z.date(),
          to: z.date(),
        })
        .optional()
        .or(z.date()),
      cursor: z.object({ page: z.number() }).default({ page: 1 }),
      limit: z.number().optional(),
    }),
    async resolve({
      ctx,
      input: { cursor, limit = DEFAULT_HOURS_PAGE_SIZE, dateFilter },
    }) {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Need to be signed in to get this information',
        });
      }
      let dateWhereClause = undefined;
      if (dateFilter instanceof Date) {
        dateWhereClause = dateFilter;
      } else if (dateFilter) {
        dateWhereClause = {
          gte: dateFilter.from,
          lte: dateFilter.to,
        };
      }
      const totalHours = await ctx.prisma.hour.count({
        where: {
          userId: ctx.session.user.id,
          date: dateWhereClause,
        },
      });
      //! doing offset pagination here since I don't have a proper cursor to do this and I refuse to set date as a unique field for Hour
      //TODO: might be able to improve this with selections
      const hours = await ctx.prisma?.hour.findMany({
        where: {
          userId: ctx.session?.user?.id,
          date: dateWhereClause,
        },
        skip: ((cursor.page ?? 1) - 1) * limit,
        take: limit,
        include: {
          project: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
      return {
        hours: hours.map((h) => ({ ...h, value: h.value.toNumber() })),
        nextCursor:
          Math.ceil(totalHours / limit) > cursor.page
            ? { page: cursor.page + 1 }
            : null,
      };
    },
  })
  .query('hoursByDate', {
    input: z.object({
      dateFrom: z.date(),
      dateTo: z.date(),
    }),
    async resolve({ ctx, input: { dateFrom, dateTo } }) {
      const currentUser = await ctx.prisma.user.findUnique({
        where: { id: ctx.session?.user?.id ?? '' },
      });
      if (!currentUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message:
            'You must be logged with the same user you are doing the request for',
        });
      }
      const hours = await ctx.prisma.hour.findMany({
        where: {
          userId: currentUser.id,
          date: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        include: {
          project: {
            select: {
              name: true,
            },
          },
        },
      });
      return hours.map((h) => ({ ...h, value: h.value.toNumber() }));
    },
  })
  .mutation('create', {
    input: createHourZod,
    async resolve({
      ctx,
      input: { date, description, projectId, tagIds, value },
    }) {
      if (!ctx.session?.user?.id) {
        return ctx.res?.status(401).json({ message: 'Unauthorized' });
      }
      const newHour = await ctx.prisma.hour.create({
        data: {
          date,
          description,
          projectId,
          value,
          userId: ctx.session?.user?.id,
          tags: {
            createMany: {
              data: tagIds.map((tid) => ({ tagId: tid })),
            },
          },
        },
      });
      return newHour;
    },
  })
  .mutation('edit', {
    input: z
      .object({ id: z.string(), oldTagIds: z.array(z.string()) })
      .extend(createHourZod.shape),
    async resolve({
      ctx,
      input: { id, date, description, projectId, tagIds, value, oldTagIds },
    }) {
      //! we need to know about the old tagIds so that we diff them, otherwise we can't replace relations looks like...
      const oldTagIdsSet = new Set(oldTagIds);
      const tagIdsSet = new Set(tagIds);
      const disconnect: string[] = [];
      const connect: string[] = [];

      //? could I do this better without iterating twice?
      tagIdsSet.forEach((newTid) => {
        if (!oldTagIdsSet.has(newTid)) connect.push(newTid);
      });
      oldTagIdsSet.forEach((oldTid) => {
        if (!tagIdsSet.has(oldTid)) disconnect.push(oldTid);
      });

      const edited = await ctx.prisma.hour.update({
        where: { id },
        data: {
          date,
          description,
          projectId,
          value,
        },
      });

      //? wonder whether I could do this properly with the same update transaction rather than have to do it separatedly
      connect.length &&
        (await ctx.prisma.hourTag.createMany({
          data: connect.map((c) => ({ tagId: c, hourId: id })),
        }));
      disconnect.length &&
        (await ctx.prisma.hourTag.deleteMany({
          where: {
            hourId: id,
            tagId: {
              in: disconnect,
            },
          },
        }));
      return edited;
    },
  })
  .mutation('delete', {
    input: z.object({ id: z.string() }),
    async resolve({ ctx, input: { id } }) {
      return ctx.prisma.hour.delete({ where: { id } });
    },
  });
