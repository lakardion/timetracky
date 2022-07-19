import { trpc } from "../../utils/trpc";

const Hours = () => {
  const { data: hours } = trpc.useQuery(["timetracky.hours"]);

  return <section>Hours</section>;
};
export default Hours;
