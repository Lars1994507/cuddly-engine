// Must run before any module import so PrismaClient picks up the test DB URL
process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5433/castleinventoryax_test';
