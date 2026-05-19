import { neon } from "@netlify/neon";

const sql = neon();

const seed = [
  {
    human_name: "Moth",
    biz_name: "Gutter Glitter Zines",
    instagram: "@gutter_glitter",
    facebook: null,
    website: "https://gutterglitter.example",
    description:
      "DIY zines about queer joy and rage. Staples, xerox, neon ink. Limited runs.",
  },
  {
    human_name: "Ash",
    biz_name: "Hex Stitch Co.",
    instagram: "@hexstitchco",
    facebook: "hexstitchco",
    website: null,
    description:
      "Hand-embroidered patches + upcycled denim. Sliding scale, trades welcome.",
  },
];

for (const m of seed) {
  await sql`
    INSERT INTO makers (human_name, biz_name, instagram, facebook, website, description)
    VALUES (${m.human_name}, ${m.biz_name}, ${m.instagram}, ${m.facebook}, ${m.website}, ${m.description})
    ON CONFLICT DO NOTHING
  `;
}

console.log("✓ Seeded example makers");
