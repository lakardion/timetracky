import { createTagZod } from 'common/validators';
import { z } from 'zod';
import { createRouter } from './context';

export const tagRouter = createRouter()
  .query('all', {
    async resolve({ ctx }) {
      const tags = await ctx.prisma.tag.findMany();
      return tags;
    },
  })
  .query('withHourCount', {
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
  .mutation('create', {
    input: createTagZod,
    async resolve({ ctx, input: { name } }) {
      const newTag = await ctx.prisma.tag.create({
        data: { name },
      });
      return newTag;
    },
  })
  .mutation('delete', {
    input: z.object({
      tagId: z.string(),
    }),
    async resolve({ ctx, input: { tagId } }) {
      await ctx.prisma.tag.delete({ where: { id: tagId } });
    },
  });
