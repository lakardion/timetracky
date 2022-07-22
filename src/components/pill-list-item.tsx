import { FC, HTMLAttributes, LiHTMLAttributes, ReactNode } from "react";

export const PillListItem: FC<
  { content: string; children?: ReactNode } & LiHTMLAttributes<HTMLLIElement>
> = ({ content, children, ...props }) => {
  return (
    <li
      className="relative border border-solid border-orange-600/20 shadow-sm rounded-l-full rounded-r-full bg-orange-200 py-1 px-2"
      {...props}
    >
      <p className="text-xs">{content}</p>
      {children ?? null}
    </li>
  );
};
