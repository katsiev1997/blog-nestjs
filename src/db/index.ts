import 'dotenv/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { relations } from './relations';

const db: NodePgDatabase<typeof relations> = drizzle(
  process.env.DATABASE_URL!,
  { relations },
);

export default db;
