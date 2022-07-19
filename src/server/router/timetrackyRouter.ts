import { z } from "zod";
import { createRouter } from "./context";

export const timetrackyRouter = createRouter()
  .query("hours", {
    async resolve({ ctx }) {
      const hours = await ctx.prisma?.hour.findMany();
      return hours;
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
