import { readFileSync, writeFileSync } from "node:fs";
const [, , titleArg, hrefArg] = process.argv;
if (!titleArg || !hrefArg) {
  console.error("Usage: node scripts/add-virtual-page.mjs \"Title\" \"/?page=trivia\"");
  process.exit(1);
}
const file = "public/pages.json";
const pages = JSON.parse(readFileSync(file, "utf8"));
const exists = pages.some(p => p.href === hrefArg);
if (!exists) {
  pages.push({ title: titleArg, href: hrefArg });
  pages.sort((a, b) => a.title.localeCompare(b.title));
  writeFileSync(file, JSON.stringify(pages, null, 2));
  console.log(`Added: ${titleArg} -> ${hrefArg}`);
} else {
  console.log(`Already present: ${hrefArg}`);
}
