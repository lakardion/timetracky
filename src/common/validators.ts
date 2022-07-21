import { z } from "zod";

export const createHourZod = z.object({
  value: z.number().gt(0, "Must be bigger than 0"),
  projectId: z.string().min(1, "Required"),
  date: z.date(),
  description: z.string().min(1, "Required"),
  tagIds: z.array(z.string()),
});
export const createHourZodForm = z.object({
  value: z.string().refine((value) => {
    if (value === "0") return false;
    return true;
  }),
  projectId: z.string().min(1, "Required"),
  date: z.string(),
  description: z.string().min(1, "Required"),
  tagIds: z.array(z.string()),
});
export type CreateHourInputs = z.infer<typeof createHourZod>;
export type CreateHourFormInputs = z.infer<typeof createHourZodForm>;

export const createTagZod = z.object({
  name: z.string().min(1, "Required"),
});
export type CreateTagInputs = z.infer<typeof createTagZod>;

export const createProjectZod = z.object({
  name: z.string().min(1, "Required"),
  clientId: z
    .string()
    .min(1, "Required")
    .refine(
      (data: string) => {
        return data !== "-1";
      },
      { message: "Required" }
    ),
});
export type CreateProjectInputs = z.infer<typeof createProjectZod>;
