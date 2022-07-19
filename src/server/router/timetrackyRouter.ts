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
  });
