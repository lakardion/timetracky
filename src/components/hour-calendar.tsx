import { Calendar, dateFnsLocalizer, Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { FC, useEffect, useLayoutEffect, useMemo, useState } from "react";

const LG_WIDTH_BREAKPOINT_PX = 1024;

const locales = {
  "en-US": enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

/**
 *
 * @author https://stackoverflow.com/questions/19014250/rerender-view-on-browser-resize-with-react
 */
function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}

export const HoursCalendar: FC<{ events: Event[] }> = ({ events }) => {
  const [canSeeWeek, setCanSeeWeek] = useState(false);
  const size = useWindowSize();

  const views = useMemo(() => {
    const [w, h] = size;
    if (w && w > LG_WIDTH_BREAKPOINT_PX) {
      return { month: true, week: true };
    }
    return { month: true };
  }, [size]);

  return (
    <>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={views}
        className={"h-[300px] w-[300px]  lg:h-[600px] lg:w-auto"}
      />
    </>
  );
};
