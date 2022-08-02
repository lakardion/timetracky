import {
  Calendar,
  dateFnsLocalizer,
  Event,
  SlotInfo,
  View,
} from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  FC,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

const LG_WIDTH_BREAKPOINT_PX = 1024;

const locales = {
  'en-US': enUS,
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
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}

export type RangeChangeEventHandler = (
  range: Date[] | { start: Date; end: Date },
  view?: View
) => void | undefined;

export const HoursCalendar: FC<{
  events: Event[];
  onRangeChange: RangeChangeEventHandler;
  value?: Date;
  onChange?: (date: Date) => void;
  selected?: Date[];
  onSelectedChange?: (dates: Date[]) => void;
}> = ({
  events,
  onRangeChange,
  value: controlledValue,
  onChange: controlledOnChange,
  onSelectedChange: controlledOnSelectedChange,
  selected: controlledSelected,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(new Date());
  const [uncontrolledSelected, setUncontrolledSelected] = useState<Date[]>([]);

  const value = useMemo(() => {
    if (controlledValue) return controlledValue;
    return uncontrolledValue;
  }, [controlledValue, uncontrolledValue]);
  const handleDateChange = () => {};

  const handleNavigate = useMemo(() => {
    if (controlledOnChange) return controlledOnChange;
    return (newDate: Date) => {
      setUncontrolledValue(newDate);
    };
  }, [controlledOnChange]);

  const handleSelectedChange = useMemo(
    () => controlledOnSelectedChange || setUncontrolledSelected,
    [controlledOnSelectedChange]
  );

  const selected = useMemo(
    () => controlledSelected || uncontrolledSelected,
    [controlledSelected, uncontrolledSelected]
  );

  const handleSlotSelect = (slotInfo: SlotInfo) => {
    const { action, start, slots } = slotInfo;
    const callbackByAction: Record<
      'click' | 'doubleClick' | 'select',
      () => void
    > = {
      click: () => {
        handleSelectedChange(slots);
        handleNavigate(start);
      },
      doubleClick: () => {},
      select: () => {
        handleSelectedChange(slots);
      },
    };
    callbackByAction[action]?.();
  };

  const size = useWindowSize();

  const views = useMemo(() => {
    const [w, h] = size;
    if (w && w > LG_WIDTH_BREAKPOINT_PX) {
      return { month: true, week: true };
    }
    return { month: true };
  }, [size]);

  const dayPropGetter = useCallback(
    (date: Date) => {
      if (selected.some((s) => isSameDay(s, date)))
        return { className: 'bg-orange-300/20' };
      return { className: '' };
    },
    [selected]
  );

  return (
    <>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={views}
        className={
          'h-[300px] w-[300px]  lg:h-[600px] lg:w-[700px] lg:px-3 2xl:w-full'
        }
        onRangeChange={onRangeChange}
        date={value}
        onNavigate={handleNavigate}
        onSelectSlot={handleSlotSelect}
        popup
        selectable
        dayPropGetter={dayPropGetter}
        drilldownView={null}
      />
    </>
  );
};
