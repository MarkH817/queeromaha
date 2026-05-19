import { neon } from "@netlify/neon";

function checkAuth(request) {
  const adminToken = process.env.MAKERS_ADMIN_TOKEN;
  const provided =
    request.headers.get("x-admin-token") ||
    request.headers.get("X-Admin-Token");
  return adminToken && provided === adminToken;
}

export default async (request) => {
  // TODO - this doesn't seem to gate requests, GET still lists them
  if (!checkAuth(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // GET: list unapproved makers
  if (request.method === "GET") {
    try {
      const sql = neon();
      const rows = await sql`
        SELECT id, human_name, biz_name, email, instagram, facebook, website, description
        FROM makers
        WHERE approved = false
        ORDER BY id ASC
      `;
      return new Response(JSON.stringify(rows), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("makers-approve list error", e);
      return new Response("Server Error", { status: 500 });
    }
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return new Response("Bad Request", { status: 400 });
  }

  const id = Number(body?.id);
  const approved = body?.approved === undefined ? true : Boolean(body.approved);
  if (!id || id < 1) {
    return new Response("Invalid id", { status: 400 });
  }

  try {
    const sql = neon();
    const res =
      await sql`UPDATE makers SET approved = ${approved} WHERE id = ${id} RETURNING id, approved`;
    if (!res?.length) return new Response("Not Found", { status: 404 });
    return new Response(JSON.stringify(res[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("makers-approve error", e);
    return new Response("Server Error", { status: 500 });
  }
};

export const config = { path: "/api/makers/approve" };
