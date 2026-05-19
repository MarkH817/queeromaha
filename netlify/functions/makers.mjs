import { neon } from "@netlify/neon";

export default async () => {
  const sql = neon();
  try {
    const rows =
      await sql`SELECT id, human_name, biz_name, instagram, facebook, website, description FROM makers WHERE approved = true ORDER BY COALESCE(biz_name, human_name) ASC`;
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    console.error("makers api error:", e);
    return new Response(JSON.stringify({ error: "Failed to fetch makers" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/makers" };
