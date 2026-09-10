import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { relations } from './relations';

export type DrizzleDB = PostgresJsDatabase<typeof relations>;

/** Root client or transaction handle — same query/mutation API. */
export type DrizzleClient = DrizzleDB;
