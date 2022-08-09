import { HourExceptionType } from '@prisma/client';
import { isMatch } from 'date-fns';
import { trpc } from 'utils/trpc';
import { z } from 'zod';

export const refineStringIsNumberFn = (v: string) => !isNaN(parseInt(v));

export const dateInputValidateZod = z.string().refine((date) => {
  if (!isMatch(date, 'yyyy-MM-dd')) return false;
  return true;
}, 'Required');

export const identifiableZod = z.object({
  id: z.string().min(1, 'Required'),
});
export const createHourZod = z.object({
  value: z.number().gt(0, 'Must be bigger than 0'),
  projectId: z.string().min(1, 'Required'),
  date: z.date(),
  description: z.string().min(1, 'Required'),
  tagIds: z.array(z.string()),
});
export const createHourZodForm = z.object({
  value: z
    .string()
    .min(1, 'Required')
    .refine((value) => {
      if (value === '0') return false;
      return true;
    }, 'Required'),
  projectId: z.string().min(1, 'Required'),
  date: dateInputValidateZod,
  description: z.string().min(1, 'Required'),
  tagIds: z.array(z.string()),
});
export type CreateHourInputs = z.infer<typeof createHourZod>;
export type CreateHourFormInputs = z.infer<typeof createHourZodForm>;

export const createTagZod = z.object({
  name: z.string().min(1, 'Required'),
});
export type CreateTagInputs = z.infer<typeof createTagZod>;

export const searchZod = z
  .object({
    query: z.string().optional(),
  })
  .default({});

const { HOLIDAY_WORK, ...WorkHourExceptionDestruct } = HourExceptionType;
// wow I did not know you could define a type with the same name of an obj
export const NonWorkHourException = { HOLIDAY_WORK };
export type NonWorkHourException = typeof NonWorkHourException[keyof typeof NonWorkHourException];
export const WorkHourException = { ...WorkHourExceptionDestruct };
export type WorkHourException = typeof WorkHourException[keyof typeof WorkHourException];

export const workHourExceptionZod = z.nativeEnum(WorkHourException);
export const nonWorkHourExceptionZod = z.nativeEnum(NonWorkHourException);
