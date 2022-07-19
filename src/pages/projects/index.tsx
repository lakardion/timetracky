import { trpc } from "../../utils/trpc";

const Projects = () => {
  const { data: projects } = trpc.useQuery(["timetracky.projects"]);

  if (!projects?.length) {
    return <section>No projects</section>;
  }
  return (
    <section className="flex flex-col">
      {projects.map((p) => (
        <article key={p.id}>
          <section>{p.name}</section>
        </article>
      ))}
    </section>
  );
};
export default Projects;
