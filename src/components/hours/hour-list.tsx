import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import { FC, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { trpc } from 'utils/trpc';
import { HourItem } from './hour-item';
import { DateFilter } from './types';

const useVirtualizedInfiniteHourList = (dateFilter?: DateFilter | Date) => {
  const {
    data: infiniteHours,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.useInfiniteQuery(
    [
      'hours.withTagAndProjectInfinite',
      {
        dateFilter,
      },
    ],
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
  const rVirtualRef = useRef<HTMLUListElement | null>(null);
  const allRows = useMemo(() => {
    return infiniteHours?.pages.flatMap((p) => p.hours) ?? [];
  }, [infiniteHours?.pages]);

  const { getTotalSize, getVirtualItems } = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => rVirtualRef.current,
    estimateSize: (index) => {
      return (allRows[index]?.description?.length ?? 0) > 100 ? 250 : 200;
    },
    overscan: 5,
    debug: true,
  });
  useEffect(
    () => {
      const [lastItem] = [...getVirtualItems()].reverse();

      if (!lastItem) {
        return;
      }

      if (lastItem.index >= allRows.length - 1 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      hasNextPage,
      fetchNextPage,
      allRows.length,
      isFetchingNextPage,
      //! not sure about this. This is how they pictured it in the example at @tanstack/react-virtual
      // eslint-disable-next-line react-hooks/exhaustive-deps
      getVirtualItems(),
    ]
  );
  return useMemo(
    () => ({
      rVirtualRef,
      getTotalSize,
      getVirtualItems,
      hasNextPage,
      allRows,
    }),
    [allRows, getTotalSize, getVirtualItems, hasNextPage]
  );
};

export const HourList: FC<{
  onHourEdit: (id: string) => void;
  onHourDelete: (id: string) => void;
  selectedHourId?: string;
  dateFilter?: DateFilter | Date;
}> = ({ onHourEdit, onHourDelete, selectedHourId, dateFilter }) => {
  const [hoveringId, setHoveringId] = useState('');

  const { allRows, getTotalSize, getVirtualItems, hasNextPage, rVirtualRef } = useVirtualizedInfiniteHourList(dateFilter);

  const createHoverHandler = (id: string) => (e: MouseEvent) => {
    e?.stopPropagation();
    setHoveringId(id);
  };
  const createEditHourHandler = (id: string) => () => {
    onHourEdit(id);
  };
  const createDeleteHourHandler = (id: string) => () => {
    onHourDelete(id);
  };

  const dateFilterParse =
    dateFilter instanceof Date
      ? `Filtering for ${format(dateFilter, 'MM-dd-yyyy')}`
      : typeof dateFilter === 'object'
      ? `Filtering from ${format(dateFilter.from, 'MM-dd-yyyy')} to ${format(dateFilter.to, 'MM-dd-yyyy')}`
      : 'Last loaded hours';

  return (
    <>
      <h1 className="pb-2 text-2xl">{dateFilterParse}</h1>
      <section aria-label="scrollable hours container" className="h-[700px] w-full overflow-auto md:max-w-[700px] 2xl:h-full" ref={rVirtualRef}>
        <ul
          className={`relative w-full`}
          style={{
            height: `${getTotalSize()}px`,
          }}
          onClick={createHoverHandler('')}
        >
          {!getVirtualItems()?.length ? <li className="pt-3 text-center italic">No hours</li> : null}
          {getVirtualItems().map((virtualRow) => {
            const isLoaderRow = virtualRow.index > allRows.length - 1;
            const h = allRows[virtualRow.index];
            const liClassName = h ? `absolute top-0 left-0 w-full` : '';
            if (virtualRow.start === undefined || !h) return null;
            return (
              <HourItem
                key={h.id}
                className={liClassName}
                hour={h}
                isSelected={selectedHourId === h.id}
                hoverHandlers={{
                  isHovering: hoveringId === h?.id,
                  onMouseEnter: h ? createHoverHandler(h.id) : undefined,
                  onMouseLeave: h ? createHoverHandler('') : undefined,
                }}
                pagination={{
                  hasNextPage,
                }}
                virtualRow={{
                  index: virtualRow.index,
                  isLoaderRow,
                  size: virtualRow.size,
                  start: virtualRow.start,
                }}
                onDeleteHour={createDeleteHourHandler(h?.id)}
                onEditHour={createEditHourHandler(h?.id)}
              />
            );
          })}
        </ul>
      </section>
    </>
  );
};
