import { neon } from '@netlify/neon';

const id = Number(process.argv[2]);
if (!id || id < 1) {
  console.error('Usage: node scripts/approve-maker.mjs <id> [true|false]');
  process.exit(1);
}
const approved = process.argv[3] === 'false' ? false : true;

const sql = neon();
const res = await sql`UPDATE makers SET approved = ${approved} WHERE id = ${id} RETURNING id, approved`;
if (!res?.length) {
  console.error('No maker found for id', id);
  process.exit(2);
}
console.log('Updated:', res[0]);
