import { PrismaClient } from '../../../generated/prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Transaction client — PrismaClient without top-level lifecycle methods.
 * Passed into every seed step so all writes share the same transaction.
 */
export type Tx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/** Absolute path to the night_courier project data folder at E:\ComfyUI\night_courier\ */
export const PROJECT_ROOT = join(__dirname, '../../../../night_courier');

export function readJson<T>(relPath: string): T {
  return JSON.parse(
    readFileSync(join(PROJECT_ROOT, relPath), 'utf-8'),
  ) as T;
}
