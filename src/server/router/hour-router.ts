import { HourExceptionType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { createHourZod } from 'common/validators';
import { cursorPaginationZod, DEFAULT_HOURS_PAGE_SIZE, getPagination } from 'utils/pagination';
import { z } from 'zod';
import { createRouter } from './context';

const diffStrArrays = (
  newValues: string[],
  oldValues: string[]
): [toCreate: string[], toDelete: string[]] => {
  const oldTagIdsSet = new Set(oldValues);
  const tagIdsSet = new Set(newValues);
  const disconnect: string[] = [];
  const connect: string[] = [];

  //? could I do this better without iterating twice?
  tagIdsSet.forEach((newTid) => {
    if (!oldTagIdsSet.has(newTid)) connect.push(newTid);
  });
  oldTagIdsSet.forEach((oldTid) => {
    if (!tagIdsSet.has(oldTid)) disconnect.push(oldTid);
  });

  return [connect, disconnect];
};

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
  .query('withTagAndProjectInfinite', {
    input: z.object({
      dateFilter: z
        .object({
          from: z.date(),
          to: z.date(),
        })
        .optional()
        .or(z.date())
    }).merge(cursorPaginationZod),
    async resolve({
      ctx,
      input: { cursor, limit: clientLimit = DEFAULT_HOURS_PAGE_SIZE, dateFilter },
    }) {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Need to be signed in to get this information',
        });
      }
      const limit = cursor?.limit ? cursor.limit : clientLimit
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
            ? { page: cursor.page + 1, limit }
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
      //? should we do this in the client?
      const [toConnect, toDisconnect] = diffStrArrays(tagIds, oldTagIds);

      const createManyQuery = toConnect?.length
        ? { data: toConnect.map((c) => ({ tagId: c })) }
        : undefined;
      //todo check if this can be replaced (or is the same) as deleteMany
      const deleteManyQuery = toDisconnect?.length
        ? toDisconnect.map((d) => ({
          tagId: d,
        }))
        : undefined;

      const edited = await ctx.prisma.hour.update({
        where: { id },
        data: {
          date,
          description,
          projectId,
          value,
          tags: {
            createMany: createManyQuery,
            deleteMany: deleteManyQuery,
          },
        },
      });

      return edited;
    },
  })
  .mutation('delete', {
    input: z.object({ id: z.string() }),
    async resolve({ ctx, input: { id } }) {
      return ctx.prisma.hour.delete({ where: { id } });
    },
  }).query('hourExceptionsInfinite', {
    input: cursorPaginationZod,
    async resolve({ ctx, input: { cursor, limit: clientLimit = DEFAULT_HOURS_PAGE_SIZE } }) {
      const limit = cursor?.limit ? cursor.limit : clientLimit
      const hourExceptions = await ctx.prisma.hourException.findMany({
        orderBy: {
          date: 'desc'
        },
        take: limit,
        skip: (cursor.page - 1) * limit
      })
      const nextCursor = hourExceptions.length === limit ? { page: cursor.page + 1, limit } : null
      return {
        hourExceptions, nextCursor
      }
    }
  }).mutation('createException', {
    input: z.object({
      hours: z.number(),
      date: z.date(),
      type: z.nativeEnum(HourExceptionType)
    }), async resolve({ ctx, input: { hours, date, type } }) {
      if (!ctx.session?.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Must be logged in to perform this request' })
      const hourException = await ctx.prisma.hourException.create({
        data: {
          hours: hours,
          userId: ctx.session.user.id,
          date,
          type,
        }
      })
      return hourException
    }
  });
