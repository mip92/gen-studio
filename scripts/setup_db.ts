/**
 * Creates PostgreSQL user gen_studio + database gen_studio from scratch.
 * Connects as night_courier (or postgres superuser if needed).
 *
 * Usage: npx tsx scripts/setup_db.ts
 *    or: npx tsx scripts/setup_db.ts postgresql://postgres:PASSWORD@localhost:5432/postgres
 */

import { Client } from 'pg';

const TARGET_DB   = 'gen_studio';
const TARGET_USER = 'gen_studio';
const TARGET_PASS = 'gen_studio';

// Try these admin connections in order until one works
const ADMIN_URLS = process.argv[2]
  ? [process.argv[2]]
  : [
      `postgresql://postgres:postgres@localhost:5432/postgres`,
      `postgresql://postgres:@localhost:5432/postgres`,
      `postgresql://night_courier:night_courier@localhost:5432/postgres`,
    ];

async function getAdminClient(): Promise<Client> {
  for (const url of ADMIN_URLS) {
    const c = new Client({ connectionString: url });
    try {
      await c.connect();
      console.log(`Admin connected via: ${url.replace(/:\/\/.*@/, '://***@')}`);
      return c;
    } catch {
      await c.end().catch(() => {});
    }
  }
  throw new Error('Could not connect as admin. Pass superuser URL as argument.');
}

async function run() {
  const admin = await getAdminClient();

  // Create user gen_studio if not exists
  const userExists = await admin.query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [TARGET_USER]);
  if (userExists.rowCount === 0) {
    await admin.query(`CREATE USER ${TARGET_USER} WITH PASSWORD '${TARGET_PASS}';`);
    console.log(`Created user: ${TARGET_USER}`);
  } else {
    await admin.query(`ALTER USER ${TARGET_USER} WITH PASSWORD '${TARGET_PASS}';`);
    console.log(`User already exists, password updated: ${TARGET_USER}`);
  }

  // Create database gen_studio if not exists
  const dbExists = await admin.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [TARGET_DB]);
  if (dbExists.rowCount === 0) {
    await admin.query(`CREATE DATABASE ${TARGET_DB} OWNER ${TARGET_USER};`);
    console.log(`Created database: ${TARGET_DB}`);
  } else {
    await admin.query(`ALTER DATABASE ${TARGET_DB} OWNER TO ${TARGET_USER};`);
    console.log(`Database already exists, owner set: ${TARGET_DB}`);
  }

  await admin.query(`GRANT ALL PRIVILEGES ON DATABASE ${TARGET_DB} TO ${TARGET_USER};`);
  await admin.end();

  // Connect as gen_studio to grant schema access
  const db = new Client({ connectionString: `postgresql://${TARGET_USER}:${TARGET_PASS}@localhost:5432/${TARGET_DB}` });
  await db.connect();
  await db.query(`GRANT ALL ON SCHEMA public TO ${TARGET_USER};`);
  await db.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${TARGET_USER};`);
  await db.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${TARGET_USER};`);
  await db.end();

  console.log(`\nDone. DATABASE_URL=postgresql://${TARGET_USER}:${TARGET_PASS}@localhost:5432/${TARGET_DB}?schema=public`);
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
