import { parse } from "date-fns";

/**
 * Written for the need of parsing a local date from <input type="date"  />
 * @param date Date string valur from default input type=datepicker formatted (yyyy-M-dddd)
 */
export const parseDatepicker = (date: string) => {
  return parse(date, "yyyy-M-dddd", new Date());
};
