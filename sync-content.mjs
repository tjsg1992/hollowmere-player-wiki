// Copy the player wiki (an Obsidian vault kept in the tabletop project) into Quartz's content/ folder.
// Each page's first "# Heading" becomes its Quartz title, and Home.md becomes the site's index.md.
//
// Usage: node sync-content.mjs [path/to/player-wiki]
// Default source: ../20261014-tabletop/player-wiki
import { cpSync, existsSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const source = path.resolve(process.argv[2] || path.join(here, "..", "20261014-tabletop", "player-wiki"));
const content = path.join(here, "content");
if (!existsSync(path.join(source, "Home.md"))) throw new Error("No Home.md in " + source);

rmSync(content, { recursive: true, force: true });
cpSync(source, content, { recursive: true, filter: (p) => !path.basename(p).startsWith(".") });
renameSync(path.join(content, "Home.md"), path.join(content, "index.md"));

let pages = 0;
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name.endsWith(".md")) {
      let text = readFileSync(full, "utf8");
      if (!text.startsWith("---")) {
        const m = /^# (.+)\r?\n+/m.exec(text);
        if (m && m.index === 0) {
          const title = m[1].trim().replace(/"/g, '\\"');
          text = `---\ntitle: "${title}"\n---\n` + text.slice(m[0].length);
        }
      }
      writeFileSync(full, text);
      pages++;
    }
  }
};
walk(content);
console.log(`Synced ${pages} pages from ${source}`);
