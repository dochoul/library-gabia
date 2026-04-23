import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "node-html-parser";

const OUTPUT_FILE = resolve(process.cwd(), "gabia-posts.json");
const HOME_URL = "https://library.gabia.com/";

function normalizeUrl(href) {
  if (!href) return null;
  try {
    return new URL(href, HOME_URL).toString();
  } catch {
    return null;
  }
}

function isArticleUrl(url) {
  return /\/contents\/(?:[^/]+\/)?\d+\/?$/.test(url);
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  const response = await fetch(HOME_URL, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; library-gabia-migration/1.0; +https://library.gabia.com/)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch homepage: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const root = parse(html);

  const byUrl = new Map();

  for (const anchor of root.querySelectorAll('a[href*="/contents/"]')) {
    const url = normalizeUrl(anchor.getAttribute("href"));
    const title = anchor.text.trim().replace(/\s+/g, " ");
    if (!url || !title || !isArticleUrl(url)) continue;

    const current = byUrl.get(url);
    if (!current || title.length > current.title.length) {
      byUrl.set(url, { title, url });
    }
  }

  const candidates = uniqueBy(Array.from(byUrl.values()), (item) => item.url);

  await writeFile(
    OUTPUT_FILE,
    JSON.stringify(
      {
        source: HOME_URL,
        count: candidates.length,
        posts: candidates,
      },
      null,
      2,
    ),
  );

  console.log(`Saved ${candidates.length} post links to ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
