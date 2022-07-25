import { createHourZod } from "common/validators";
import { DEFAULT_HOURS_PAGE_SIZE, getPagination } from "utils/pagination";
import { z } from "zod";
import { createRouter } from "./context";

export const hourRouter = createRouter()
  .query("single", {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ ctx, input: { id } }) {
      if (!ctx.session?.user?.id) {
        return ctx.res?.status(401).json({ message: "Unauthorized" });
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
  .query("withTagAndProject", {
    input: z.object({
      page: z.number().optional(),
      size: z.number().optional(),
    }),
    async resolve({ ctx, input }) {
      if (!ctx.session?.user?.id) {
        return ctx.res?.status(401).json({ message: "Unauthorized" });
      }
      const { page = 1, size = DEFAULT_HOURS_PAGE_SIZE } = input;
      const totalHours = await ctx.prisma.hour.count({
        where: {
          userId: ctx.session.user.id,
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
          date: "desc",
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
  .mutation("create", {
    input: createHourZod,
    async resolve({
      ctx,
      input: { date, description, projectId, tagIds, value },
    }) {
      if (!ctx.session?.user?.id) {
        return ctx.res?.status(401).json({ message: "Unauthorized" });
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
  .mutation("edit", {
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
  .mutation("delete", {
    input: z.object({ id: z.string() }),
    async resolve({ ctx, input: { id } }) {
      return ctx.prisma.hour.delete({ where: { id } });
    },
  });
