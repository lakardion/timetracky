import { createProjectZod } from "common/validators";
import { createRouter } from "./context";

export const projectRouter = createRouter()
  .query("all", {
    async resolve({ ctx }) {
      const projects = await ctx.prisma.project.findMany({
        include: { hours: true },
      });
      return projects;
    },
  })
  .mutation("create", {
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
  });
