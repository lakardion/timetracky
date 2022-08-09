import LongParagraph from 'components/long-paragraph';
import { PillListItem } from 'components/pill-list-item';
import { format, formatRelative } from 'date-fns';
import { FC, MouseEventHandler } from 'react';
import { FaEllipsisH } from 'react-icons/fa';
import { MdDeleteOutline, MdOutlineModeEditOutline } from 'react-icons/md';

const PARAGRAPH_CHAR_LIMIT = 200;

type HourItemProps = {
  virtualRow: {
    index: number;
    size: number;
    start: number;
    isLoaderRow: boolean;
  };
  pagination: { hasNextPage?: boolean };
  className: string;
  isSelected: boolean;
  hour: {
    value: number;
    tags: { tag: { name: string; id: string } }[];
    description: string;
    date: Date;
    project: {
      name: string;
      id: string;
    };
    updatedAt: Date;
  };
  hoverHandlers: {
    onMouseEnter?: MouseEventHandler;
    onMouseLeave?: MouseEventHandler;
    isHovering: boolean;
  };
  onEditHour: MouseEventHandler<HTMLButtonElement>;
  onDeleteHour: MouseEventHandler<HTMLButtonElement>;
};

export const HourItem: FC<HourItemProps> = ({ className, hour, isSelected, pagination, virtualRow, hoverHandlers, onDeleteHour, onEditHour }) => {
  return (
    <li
      key={virtualRow.index}
      className={className}
      style={{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
      onMouseEnter={hoverHandlers.onMouseEnter}
      onMouseLeave={hoverHandlers.onMouseLeave}
    >
      {virtualRow.isLoaderRow ? (
        pagination.hasNextPage ? (
          'Loading more...'
        ) : (
          'Nothing more to load'
        )
      ) : (
        <div aria-label="hour card container" className={`flex h-[95%] w-[98%] gap-3 rounded-lg bg-gray-300 p-3 ${isSelected ? 'ring-2 ring-inset ring-orange-300/75' : ''}`}>
          <section
            aria-label="hour and date box"
            className="flex h-24 w-24 basis-2/12 flex-col items-center justify-between rounded border-4 border-gray-600 bg-gray-700 py-3 text-white drop-shadow-lg"
          >
            <h1 className="text-3xl">
              {hour.value} <span className="text-sm italic"> hs</span>
            </h1>
            <p aria-label="date" className="italic ">
              {format(hour.date, 'M-dd-yyyy')}
            </p>
          </section>
          <section aria-label="project name, tags, and description" className="flex basis-9/12 flex-col gap-2">
            <section>
              <h1 className="text-2xl">{hour.project.name}</h1>
              <ul className="flex flex-wrap gap-3 pt-1">
                {hour.tags.flatMap((t, idx) => {
                  return <PillListItem key={t.tag.id} content={t.tag.name} />;
                })}
              </ul>
            </section>
            <LongParagraph charLimit={PARAGRAPH_CHAR_LIMIT}>{hour.description}</LongParagraph>
          </section>
          <section className="flex basis-1/12 flex-col justify-end text-xs capitalize italic">
            <p>Last updated:</p>
            <p>{formatRelative(new Date(hour.updatedAt), new Date())}</p>
          </section>
          {hoverHandlers.isHovering ? (
            <div aria-label="hour actions" className="absolute right-4 top-1 flex items-center justify-center gap-1 rounded">
              <button type="button" onClick={onEditHour}>
                <MdOutlineModeEditOutline className="fill-gray-900 hover:fill-orange-700" size={28} />
              </button>
              <button type="button" onClick={onDeleteHour}>
                <MdDeleteOutline className="fill-gray-900 hover:fill-orange-700" size={28} />
              </button>
            </div>
          ) : (
            <div aria-label="display hour actions" className="absolute right-6 top-4 sm:hidden">
              <button type="button" onClick={hoverHandlers.onMouseEnter}>
                <FaEllipsisH size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
};
