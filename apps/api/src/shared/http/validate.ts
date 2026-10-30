import type { ZodTypeAny, z } from 'zod';
import { ValidationError } from '../errors.js';

export function parse<S extends ZodTypeAny>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError(
      'Some fields are missing or invalid',
      result.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
    );
  }
  return result.data;
}
