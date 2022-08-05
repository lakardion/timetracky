import { getWeekArrayFromDate } from 'utils/date';
import { z } from 'zod';
import { createRouter } from './context';

const currentWeek = getWeekArrayFromDate(new Date());

//basecase report will be BY week. So we will accept from to but client will send a week. (not sure how that changes but...)

export const hourUserRouter = createRouter().query('status', {
  input: z
    .object({
      from: z.date(),
      to: z.date(),
    })
    .optional()
    .default({
      from: currentWeek[0] ?? new Date(),
      to: currentWeek[currentWeek.length - 1] ?? new Date(),
    }),
  async resolve({ ctx, input: { from, to } }) {
    const users = await ctx.prisma.user.findMany({
      select: {
        hours: true,
        name: true,
        image: true,
      },
    });
    const hours = await ctx.prisma.hour.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
        },
      },
    });
  },
});
