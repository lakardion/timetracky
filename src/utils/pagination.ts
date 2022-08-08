import { z } from 'zod';

export const DEFAULT_HOURS_PAGE_SIZE = 10;

export const getPagination = ({ count, size, page }: { count: number; size: number; page: number }) => {
  const maxPages = Math.ceil(count / size);
  return {
    count,
    next: page + 1 > maxPages ? undefined : page + 1,
    previous: page - 1 === 0 ? undefined : page - 1,
  };
};

export const cursorPaginationZod = z.object({
  cursor: z
    .object({
      page: z.number(),
      limit: z.number().optional(),
    })
    .optional()
    .default({ page: 1 }),
  //this is for the client to be able to set a limit, consecutive requests are going to be paginated with this size
  limit: z.number().optional(),
});
