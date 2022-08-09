import { parse } from 'date-fns';
import { CalendarsType, getHolidays } from 'server/gcal';
import { parseDatepicker } from 'utils/date';
import { createRouter } from './context';
import { z } from 'zod';

const observanceQueryByLocaleKey: Record<CalendarsType, string> = {
  'es.ar': 'Celebración',
  'en.us': 'Observance',
  'en.ar': 'Observance',
};

export const gcalRouter = createRouter().query('holidays', {
  input: z
    .object({
      excludePast: z.boolean().optional(),
    })
    .default({}),
  //? quite unsure if we want to exclude past or not by default, hot take is we're excluding them to avoid pollution of the options
  async resolve({ input: { excludePast = true } }) {
    //TODO: unhardcode some time
    const localeKey: CalendarsType = 'en.ar';
    const events = await getHolidays(localeKey);
    //filter by this year only
    const filtered = events.items.filter((e) => {
      const isObservance = e.description.includes(observanceQueryByLocaleKey[localeKey]);

      if (isObservance) return false;
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
