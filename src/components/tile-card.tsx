import { FC } from 'react';
import { IconType } from 'react-icons';

interface TileCardProps {
  title: string;
  description: string;
  icon: IconType;
}
export const TileCard: FC<TileCardProps> = ({ title, description, icon: Icon }) => {
  return (
    <article className="flex h-32 w-60 rounded-lg bg-orange-300 p-4 shadow-md shadow-gray-500">
      <section aria-label="icon">
        <Icon size="2em" />
      </section>
      <section aria-label="card details" className="flex flex-col gap-1 pl-2 text-left align-baseline text-sm">
        <h1 className="text-2xl">{title}</h1>
        <p>{description}</p>
      </section>
    </article>
  );
};
