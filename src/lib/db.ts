import { Pool } from 'pg';

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default db;

export function buildSetClause(
  data: Record<string, unknown>,
  startIdx = 1,
): { clause: string; values: unknown[] } {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) throw new Error('No fields to update');
  entries.push(['updated_at', new Date()]);
  const clause = entries.map(([k], i) => `"${k}" = $${startIdx + i}`).join(', ');
  const values = entries.map(([, v]) => v);
  return { clause, values };
}

export function buildWhereClause(
  filters: Record<string, unknown>,
  startIdx = 1,
): { clause: string; values: unknown[] } {
  const entries = Object.entries(filters).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return { clause: '', values: [] };
  const clause = 'WHERE ' + entries.map(([k], i) => `"${k}" = $${startIdx + i}`).join(' AND ');
  const values = entries.map(([, v]) => v);
  return { clause, values };
}
