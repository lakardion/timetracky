import { FC } from "react";
import { IconType } from "react-icons";

interface AdminCardProps {
  title: string;
  description: string;
  icon: IconType;
}
export const AdminCard: FC<AdminCardProps> = ({
  title,
  description,
  icon: Icon,
}) => {
  return (
    <article className="bg-orange-300 shadow-gray-500 shadow-md p-4 rounded-lg w-60 h-32 flex">
      <section aria-label="icon">
        <Icon size="2em" />
      </section>
      <section
        aria-label="card details"
        className="flex flex-col gap-1 align-baseline text-left pl-2 text-sm"
      >
        <h1 className="text-2xl">{title}</h1>
        <p>{description}</p>
      </section>
    </article>
  );
};
