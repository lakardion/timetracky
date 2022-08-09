import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { IconType } from 'react-icons';
import { TileCard } from './tile-card';

export interface LinkCard {
  title: string;
  description: string;
  href: string;
  icon: IconType;
}

export const TileCardList: FC<{ cards: LinkCard[] }> = ({ cards }) => {
  const { asPath } = useRouter();

  return (
    <ul className="flex flex-col items-center justify-center gap-3 sm:justify-start md:flex-row">
      {cards.map((ac) => (
        <li key={ac.href}>
          <Link href={`${asPath}/${ac.href}`}>
            <button className="hover:opacity-60" type="button">
              <TileCard description={ac.description} icon={ac.icon} title={ac.title} />
            </button>
          </Link>
        </li>
      ))}
    </ul>
  );
};
