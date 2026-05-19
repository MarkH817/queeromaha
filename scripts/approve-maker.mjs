import { neon } from "@netlify/neon";
const sql = neon();
const arg = process.argv[2];

// TODO - this script should just call function api endpoint (will have admin env var injected so it'll work)

// list: show unapproved makers
if (arg === "list" || arg === "ls") {
  const rows = await sql`
    SELECT id, human_name, biz_name, description
    FROM makers
    WHERE approved = false
    ORDER BY id ASC
  `;
  if (rows.length === 0) {
    console.log("No unapproved makers.");
    process.exit(0);
  }
  console.log("Unapproved makers:");
  for (const r of rows) {
    const name = r.biz_name || r.human_name;
    const desc = r.description
      ? ` — ${r.description.slice(0, 50)}${r.description.length > 50 ? "…" : ""}`
      : "";
    console.log(`  ${r.id}  ${name}${desc}`);
  }
  process.exit(0);
}

const id = Number(arg);
if (!id || id < 1) {
  console.error("Usage: node scripts/approve-maker.mjs <id> [true|false]");
  console.error(
    "       node scripts/approve-maker.mjs list   # list unapproved makers",
  );
  process.exit(1);
}
const approved = process.argv[3] === "false" ? false : true;

const res =
  await sql`UPDATE makers SET approved = ${approved} WHERE id = ${id} RETURNING id, approved`;
if (!res?.length) {
  console.error("No maker found for id", id);
  process.exit(2);
}
console.log("Approved Maker ID:", res[0]);
