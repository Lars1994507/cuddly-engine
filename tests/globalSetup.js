const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const TEST_DB_URL = 'postgresql://postgres:postgres@localhost:5433/castleinventoryax_test';

module.exports = async function () {
  const db = new Pool({ connectionString: TEST_DB_URL });
  try {
    const schema = fs.readFileSync(path.resolve(__dirname, '..', 'db', 'schema.sql'), 'utf8');
    await db.query('DROP SCHEMA public CASCADE');
    await db.query('CREATE SCHEMA public');
    await db.query(schema);
  } finally {
    await db.end();
  }
};
