import { test, describe, expect } from "bun:test";
import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "src", "_data");
const SRC_DIR = join(ROOT, "src");

// ---------------------------------------------------------------------------
// 1. Data validation
// ---------------------------------------------------------------------------

describe("footerMessages.json", () => {
  const raw = readFileSync(join(DATA_DIR, "footerMessages.json"), "utf8");
  const data = JSON.parse(raw);

  test("has a messages array", () => {
    expect(Array.isArray(data.messages)).toBe(true);
    expect(data.messages.length).toBeGreaterThan(0);
  });

  test("every entry has a text string", () => {
    for (const entry of data.messages) {
      expect(typeof entry.text).toBe("string");
      expect(entry.text.length).toBeGreaterThan(0);
    }
  });
});

describe("tagMap.json", () => {
  const raw = readFileSync(join(DATA_DIR, "tagMap.json"), "utf8");
  const data = JSON.parse(raw);

  test("is a non-empty object", () => {
    expect(typeof data).toBe("object");
    expect(data).not.toBeNull();
    expect(Object.keys(data).length).toBeGreaterThan(0);
  });

  test("every value has emoji and label strings", () => {
    for (const [key, value] of Object.entries(data)) {
      expect(typeof value.emoji).toBe("string", `${key} missing emoji`);
      expect(value.emoji.length).toBeGreaterThan(0);
      expect(typeof value.label).toBe("string", `${key} missing label`);
      expect(value.label.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Content front matter — top-level .md files only (non-recursive)
// ---------------------------------------------------------------------------

describe("markdown front matter", () => {
  const mdFiles = readdirSync(SRC_DIR).filter((f) => f.endsWith(".md"));

  test("there is at least one markdown file", () => {
    expect(mdFiles.length).toBeGreaterThan(0);
  });

  for (const file of mdFiles) {
    test(`${file} has a title in front matter`, () => {
      const content = readFileSync(join(SRC_DIR, file), "utf8");
      const lines = content.split("\n");

      // Find the first and second --- delimiters
      let start = -1;
      let end = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === "---") {
          if (start === -1) {
            start = i;
          } else {
            end = i;
            break;
          }
        }
      }

      expect(start).toBe(0); // front matter must begin on line 1
      expect(end).toBeGreaterThan(0); // closing --- must exist

      const frontMatterLines = lines.slice(start + 1, end);
      const titleLine = frontMatterLines.find((l) =>
        l.match(/^title\s*:/)
      );
      expect(titleLine).toBeDefined();

      const titleValue = titleLine.replace(/^title\s*:\s*/, "").trim();
      expect(titleValue.length).toBeGreaterThan(0);
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Build smoke test
// ---------------------------------------------------------------------------

describe("eleventy build", () => {
  test("bunx @11ty/eleventy exits with code 0 and produces _site/", () => {
    const result = spawnSync("bunx", ["@11ty/eleventy"], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 120_000,
    });

    expect(result.status).toBe(0);

    const siteDir = join(ROOT, "_site");
    expect(existsSync(siteDir)).toBe(true);

    const entries = readdirSync(siteDir);
    expect(entries.length).toBeGreaterThan(0);
  });
});
