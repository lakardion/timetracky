import { isMatch } from "date-fns";
import { trpc } from "utils/trpc";
import { z } from "zod";

export const identifiableZod = z.object({
  id: z.string().min(1, "Required"),
});
export const createHourZod = z.object({
  value: z.number().gt(0, "Must be bigger than 0"),
  projectId: z.string().min(1, "Required"),
  date: z.date(),
  description: z.string().min(1, "Required"),
  tagIds: z.array(z.string()),
});
export const createHourZodForm = z.object({
  value: z
    .string()
    .min(1, "Required")
    .refine((value) => {
      if (value === "0") return false;
      return true;
    }, "Required"),
  projectId: z.string().min(1, "Required"),
  date: z.string().refine((date) => {
    if (!isMatch(date, "yyyy-MM-dd")) return false;
    return true;
  }, "Required"),
  description: z.string().min(1, "Required"),
  tagIds: z.array(z.string()),
});
export type CreateHourInputs = z.infer<typeof createHourZod>;
export type CreateHourFormInputs = z.infer<typeof createHourZodForm>;

export const createTagZod = z.object({
  name: z.string().min(1, "Required"),
});
export type CreateTagInputs = z.infer<typeof createTagZod>;
