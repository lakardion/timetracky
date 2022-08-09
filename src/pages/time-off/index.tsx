import { LinkCard, TileCardList } from 'components/tile-card-list';
import { FaRegCalendarTimes } from 'react-icons/fa';
import { MdOutlineWorkOutline } from 'react-icons/md';

const timeOffCardList: LinkCard[] = [
  {
    description: 'Register days or time off',
    href: 'regular',
    title: 'Time / Day off',
    icon: FaRegCalendarTimes,
  },
  {
    title: 'Holiday work',
    href: 'holidays-work',
    description: 'Register holidays you want to work',
    icon: MdOutlineWorkOutline,
  },
];

const TimeOff = () => {
  return (
    <>
      <section>
        <TileCardList cards={timeOffCardList} />
      </section>
    </>
  );
};

export default TimeOff;
