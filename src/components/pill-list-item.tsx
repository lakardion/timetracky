import { FC, HTMLAttributes, LiHTMLAttributes, ReactNode } from 'react';

export const PillListItem: FC<
  { content: string; children?: ReactNode } & LiHTMLAttributes<HTMLLIElement>
> = ({ content, children, ...props }) => {
  return (
    <li
      className="relative rounded-l-full rounded-r-full border border-solid border-orange-600/20 bg-orange-200 py-1 px-2 shadow-sm"
      {...props}
    >
      <p className="text-xs">{content}</p>
      {children ?? null}
    </li>
  );
};
