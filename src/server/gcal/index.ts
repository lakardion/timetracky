export enum Calendars {
  US = 'en.us',
  AR = 'es.ar',
  EN_AR = 'en.ar',
}
export type CalendarsType = `${Calendars}`;
const BASE_HOLIDAY_CAL_ID = `holiday@group.v.calendar.google.com`;

//FOR REAL GOOGLE???
// const gcal = calendar({ version: 'v3', auth: process.env.GOOGLE_CALENDAR_API_KEY });
// export const getHolidays = async (countryCode: CalendarsType) => {
//   const calendarId = `${countryCode}%23${BASE_HOLIDAY_CAL_ID}`;
//   const calendar = await gcal.calendars.get({ calendarId });

//   return calendar.data;
// };

//can't typesafe completely this if the gcal api is so bad that I can't even auth with a simple api key...
type CalendarEvent = {
  id: string;
  start: {
    date: string;
  };
  end: {
    date: string;
  };
  description: string;
  summary: string;
};
type CalendarEventResponse = {
  items: CalendarEvent[];
  summary: string;
};
export const getHolidays = async (countryCode: CalendarsType) => {
  const result = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${countryCode}%23${BASE_HOLIDAY_CAL_ID}/events?key=${process.env.GOOGLE_CALENDAR_API_KEY}`);
  const json: CalendarEventResponse = await result.json();

  return json;
};
