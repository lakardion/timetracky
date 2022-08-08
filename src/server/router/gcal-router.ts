import { parse } from 'date-fns';
import { getHolidays } from 'server/gcal';
import { parseDatepicker } from 'utils/date';
import { createRouter } from './context';
import { z } from 'zod';

export const gcalRouter = createRouter().query('holidays', {
  input: z
    .object({
      excludePast: z.boolean().optional(),
    })
    .default({}),
  async resolve({ input: { excludePast = true } }) {
    //TODO: unhardcode some time
    const events = await getHolidays('en.ar');
    //filter by this year only
    const filtered = events.items.filter((e) => {
      const start = parseDatepicker(e.start.date);
      const isCurrentYear = start.getFullYear() === new Date().getFullYear();
      const isPast = new Date() > start;
      //I think I can do a one liner here but this it reads better this way
      if (excludePast && isPast) return false;
      return isCurrentYear;
    });
    filtered.sort((a, b) => (parseDatepicker(a.start.date) > parseDatepicker(b.start.date) ? 1 : -1));
    return filtered;
  },
});
