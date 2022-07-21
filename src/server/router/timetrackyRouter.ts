import {
  createHourZod,
  createProjectZod,
  createTagZod,
} from "common/validators";
import { z } from "zod";
import { createRouter } from "./context";

export const timetrackyRouter = createRouter()
  .query("hoursWithProject", {
    async resolve({ ctx }) {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
      const hours = await ctx.prisma?.hour.findMany({
        where: {
          userId: ctx.session?.user?.id,
        },
        include: {
          project: true,
        },
      });
      return hours.map((h) => ({ ...h, value: h.value.toNumber() }));
    },
  })
  .mutation("createHour", {
    input: createHourZod,
    async resolve({
      ctx,
      input: { date, description, projectId, tagIds, value },
    }) {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
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
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
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
  });
