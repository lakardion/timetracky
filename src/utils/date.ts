import { format, parse } from 'date-fns';

/**
 * Written for the need of parsing a local date from <input type="date"  />
 * @param date Date string valur from default input type=datepicker formatted (yyyy-M-dddd)
 */
export const parseDatepicker = (date: string) => {
  return parse(date, 'yyyy-MM-dd', new Date());
};

export const formatDatepicker = (date?: Date) => {
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
};

export const localizeUTCDate = (date: Date) => {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

//from gists
const DAYS_IN_A_WEEK = 7;
/**
 * Add a certain amount of days to a date
 * @param {number} days number of days to add.
 * @returns a new date instance with the days already added
 */
export const addDays = (date: Date, days: number): Date => {
  if (days === 0) return date;
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);
  return newDate;
};

/**
 * Given a date, get the week this date belongs to.
 */
export const getWeekArrayFromDate = (date: Date) => {
  let offset = date.getDay() * -1;
  return [...Array(DAYS_IN_A_WEEK).keys()].map((dayIdx) => {
    if (dayIdx !== 0) {
      offset++;
    }
    return addDays(date, offset);
  });
};

export const getDateIndexesFromWeek = (week: Date[], dates: Date[]): number[] => {
  const dateIndexes: number[] = [];
  dates.forEach((d, idx) => {
    dateIndexes[idx] = week.findIndex((day) => day.toDateString() === d.toDateString());
  });
  return dateIndexes;
};

/**
 * Determines whether a date is between two dates.
 */
export const dateIsBetween = (date: Date, begin: Date, end: Date) => date > begin && date < end;

export const getDateRange = (initialDate: Date, endDate: Date): Date[] => {
  let currentDate = initialDate;
  const result: Date[] = [];
  while (currentDate <= endDate) {
    result.push(currentDate);
    currentDate = addDays(currentDate, 1);
  }
  return result;
};

export const getFollowingWeeks = (start: Date, weeks: number): Date[][] => {
  const weekList: Date[][] = [];
  for (let i = 0; i < weeks; i++) {
    const week = getWeekArrayFromDate(addDays(start, i * DAYS_IN_A_WEEK));
    weekList.push(week);
  }
  return weekList;
};

/**
 *
 * @param reference the date which month's we want to get
 * @param forward the amount of weeks forward we want to get from that month
 * @returns
 */
export const getMonthWeeks = (reference: Date, forward = 0): Date[][] => {
  const monthStart = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = forward === 0 ? new Date(reference.getFullYear(), reference.getMonth() + 1, 0) : addDays(monthStart, DAYS_IN_A_WEEK * forward);
  const result: Date[][] = [];
  let currentDate = monthStart;
  while (currentDate < end) {
    result.push(getWeekArrayFromDate(currentDate));
    currentDate = addDays(currentDate, DAYS_IN_A_WEEK);
  }
  return result;
};
