import { format, parse } from "date-fns";

/**
 * Written for the need of parsing a local date from <input type="date"  />
 * @param date Date string valur from default input type=datepicker formatted (yyyy-M-dddd)
 */
export const parseDatepicker = (date: string) => {
  return parse(date, "yyyy-MM-dd", new Date());
};

export const formatDatepicker = (date?: Date) => {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
};

export const localizeUTCDate = (date: Date) => {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};
