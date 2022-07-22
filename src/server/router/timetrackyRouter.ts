import {
  createHourZod,
  createProjectZod,
  createTagZod,
} from "common/validators";
import { maskEmail } from "utils";
import { z } from "zod";
import { createRouter } from "./context";

const DEFAULT_HOURS_PAGE_SIZE = 10;

const getPagination = ({
  count,
  size,
  page,
}: {
  count: number;
  size: number;
  page: number;
}) => {
  const maxPages = Math.ceil(count / size);
  return {
    count,
    next: page + 1 > maxPages ? undefined : page + 1,
    previous: page - 1 === 0 ? undefined : page - 1,
  };
};

export const timetrackyRouter = createRouter()
  .query("hoursWithTagNProject", {
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
  .mutation("createHour", {
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
  .query("tags", {
    async resolve({ ctx }) {
      const tags = await ctx.prisma.tag.findMany();
      return tags;
    },
  })
  .query("tagsWithHourCount", {
    async resolve({ ctx }) {
      //get nested from relation
      const tags = await ctx.prisma.tag.findMany({
        include: {
          hours: {
            include: {
              hour: true,
            },
          },
        },
      });
      return tags.map((t) => ({
        id: t.id,
        name: t.name,
        hourCount: t.hours.reduce((s, h) => {
          return s + h.hour.value.toNumber();
        }, 0),
      }));
    },
  })
  .mutation("createTag", {
    input: createTagZod,
    async resolve({ ctx, input: { name } }) {
      const newTag = await ctx.prisma.tag.create({
        data: { name },
      });
      return newTag;
    },
  })
  .mutation("deleteTag", {
    input: z.object({
      tagId: z.string(),
    }),
    async resolve({ ctx, input: { tagId } }) {
      await ctx.prisma.tag.delete({ where: { id: tagId } });
    },
  })
  .query("projects", {
    async resolve({ ctx }) {
      const projects = await ctx.prisma.project.findMany({
        include: { hours: true },
      });
      return projects;
    },
  })
  .mutation("createProject", {
    input: createProjectZod,
    async resolve({ ctx, input: { name, clientId } }) {
      if (!ctx.session?.user?.id)
        return ctx.res?.status(401).json({ message: "Unauthorized" });
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
  .query("getClient", {
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
  .mutation("updateClient", {
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
  .mutation("deleteClient", {
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
  .query("clients", {
    async resolve({ ctx }) {
      const clients = await ctx.prisma.client.findMany({
        include: { projects: true },
      });
      return clients;
    },
  })
  .mutation("createClient", {
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
  })
  .query("getUsers", {
    async resolve({ ctx }) {
      if (!ctx.session?.user) {
        ctx.res?.status(401).json({ message: "Unauthorized" });
      }
      //todo: will need pagination
      const users = await ctx.prisma.user.findMany({
        include: {
          hours: true,
          projects: true,
        },
      });
      return users.map((u) => {
        const maskedEmail = maskEmail(u.email ?? "");
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
  });
