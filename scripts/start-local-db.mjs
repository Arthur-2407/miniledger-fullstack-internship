import fs from 'fs';
import path from 'path';
import EmbeddedPostgres from 'embedded-postgres';

const dataDir = path.resolve(process.cwd(), 'postgres_data');

const pg = new EmbeddedPostgres({
  port: 5432,
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  persistent: true,
});

async function main() {
  console.log('🐘 Starting Native PostgreSQL on port 5432...');

  // If data directory does not exist or is empty, initialise cluster
  if (!fs.existsSync(dataDir) || fs.readdirSync(dataDir).length === 0) {
    console.log('🔧 Initializing fresh database cluster in ./postgres_data ...');
    await pg.initialise();
  }

  await pg.start();
  console.log('🚀 PostgreSQL is ACTIVE and listening on 127.0.0.1:5432');

  try {
    await pg.createDatabase('miniledger');
    console.log('✅ Database "miniledger" ready.');
  } catch (err) {
    console.log('ℹ️ Database "miniledger" already exists.');
  }

  try {
    await pg.createDatabase('miniledger_test');
    console.log('✅ Database "miniledger_test" ready.');
  } catch (err) {
    console.log('ℹ️ Database "miniledger_test" already exists.');
  }

  console.log('\n📡 Connection string: postgresql://postgres:postgres@localhost:5432/miniledger?schema=public');
}

main().catch((err) => {
  console.error('Failed to start PostgreSQL:', err);
  process.exit(1);
});
