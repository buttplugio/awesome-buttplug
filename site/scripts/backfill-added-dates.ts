import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";

// Anchored to this file rather than the CWD: the site lives in site/ but the
// README history we mine lives at the repo root.
const SITE_ROOT = path.resolve(import.meta.dirname, "..");
const REPO_ROOT = path.resolve(SITE_ROOT, "..");
const PROJECTS_DIR = path.join(SITE_ROOT, "src/content/projects");

const ENTRY_LINE = /^- \[(.*)\]\((.*)\)$/;

interface Revision {
  sha: string;
  date: string;
}

interface ContentFile {
  filename: string;
  title: string;
  url: string;
}

function normaliseUrl(u: string): string {
  let s = u.trim();
  if (s.startsWith("http://")) s = "https://" + s.slice(7);
  return s.replace(/\/+$/, "").toLowerCase();
}

// LIGHT ON PURPOSE. Stripping non-alphanumerics merges "ScriptPlayer+" into
// 2020's "Scriptplayer" and back-dates it by five years.
function normaliseTitle(t: string): string {
  return t.trim().replace(/\s+/g, " ").toLowerCase();
}

function readRevisions(): Revision[] {
  const raw = execFileSync(
    "git",
    ["log", "--reverse", "--topo-order", "--format=%H %cI", "--", "README.md"],
    { cwd: REPO_ROOT, encoding: "utf-8" }
  );
  return raw
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [sha, date] = line.split(" ");
      return { sha, date: date.slice(0, 10) };
    });
}

function mineDates(revisions: Revision[]): { urlDates: Map<string, string>; titleDates: Map<string, string> } {
  const urlDates = new Map<string, string>();
  const titleDates = new Map<string, string>();

  for (const { sha, date } of revisions) {
    let content: string;
    try {
      content = execFileSync("git", ["show", `${sha}:README.md`], {
        cwd: REPO_ROOT,
        encoding: "utf-8",
      });
    } catch {
      continue;
    }

    for (const line of content.split("\n")) {
      const m = line.match(ENTRY_LINE);
      if (!m) continue;
      const title = m[1];
      const url = m[2].split(/\s+/)[0];

      const uKey = normaliseUrl(url);
      const tKey = normaliseTitle(title);
      urlDates.set(uKey, urlDates.has(uKey) ? (urlDates.get(uKey)! < date ? urlDates.get(uKey)! : date) : date);
      titleDates.set(tKey, titleDates.has(tKey) ? (titleDates.get(tKey)! < date ? titleDates.get(tKey)! : date) : date);
    }
  }

  return { urlDates, titleDates };
}

function readContentFiles(): ContentFile[] {
  const files = fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith(".md"));
  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(PROJECTS_DIR, filename), "utf-8");
    const { data } = matter(raw);
    return { filename, title: data.title, url: data.url };
  });
}

interface Resolution {
  file: ContentFile;
  urlDate?: string;
  titleDate?: string;
  chosen: string;
  source: "url" | "title" | "both";
  flags: string[];
}

function daysBetween(a: string, b: string): number {
  return Math.abs((Date.parse(a) - Date.parse(b)) / 86_400_000);
}

function resolve(files: ContentFile[], urlDates: Map<string, string>, titleDates: Map<string, string>, firstRevDate: string): {
  resolutions: Resolution[];
  unresolved: ContentFile[];
} {
  const resolutions: Resolution[] = [];
  const unresolved: ContentFile[] = [];

  for (const file of files) {
    const urlDate = urlDates.get(normaliseUrl(file.url));
    const titleDate = titleDates.get(normaliseTitle(file.title));

    if (!urlDate && !titleDate) {
      unresolved.push(file);
      continue;
    }

    let chosen: string;
    let source: "url" | "title" | "both";
    if (urlDate && titleDate) {
      chosen = urlDate < titleDate ? urlDate : titleDate;
      source = "both";
    } else if (urlDate) {
      chosen = urlDate;
      source = "url";
    } else {
      chosen = titleDate!;
      source = "title";
    }

    const flags: string[] = [];
    if (source === "title") flags.push("TITLE_ONLY");
    if (source === "url") flags.push("URL_ONLY");
    if (urlDate && titleDate && urlDate.slice(0, 4) !== titleDate.slice(0, 4)) flags.push("DISAGREE_YEAR");
    if (chosen === firstRevDate) flags.push("FIRST_REV");
    if (urlDate && titleDate && titleDate < urlDate && daysBetween(urlDate, titleDate) > 365) {
      flags.push("TITLE_WINS_BIG");
    }

    resolutions.push({ file, urlDate, titleDate, chosen, source, flags });
  }

  return { resolutions, unresolved };
}

function printReport(resolutions: Resolution[]): void {
  const flagged = resolutions.filter((r) => r.flags.length > 0);
  const unflagged = resolutions.filter((r) => r.flags.length === 0);

  const rows = [...flagged, ...unflagged];

  console.log(
    ["file", "title", "url", "url_first_seen", "title_first_seen", "chosen", "source", "delta_days", "flags"].join("\t")
  );

  for (const r of rows) {
    const delta = r.urlDate && r.titleDate ? daysBetween(r.urlDate, r.titleDate).toFixed(0) : "";
    console.log(
      [
        r.file.filename,
        r.file.title,
        r.file.url,
        r.urlDate ?? "",
        r.titleDate ?? "",
        r.chosen,
        r.source,
        delta,
        r.flags.join(","),
      ].join("\t")
    );
  }

  const histogram = new Map<string, number>();
  for (const r of resolutions) {
    const year = r.chosen.slice(0, 4);
    histogram.set(year, (histogram.get(year) ?? 0) + 1);
  }

  const flagCounts = new Map<string, number>();
  for (const r of resolutions) {
    for (const f of r.flags) {
      flagCounts.set(f, (flagCounts.get(f) ?? 0) + 1);
    }
  }

  console.log(`\nresolved: ${resolutions.length}`);
  console.log("by year:");
  for (const [year, count] of [...histogram.entries()].sort()) {
    console.log(`  ${year}: ${count}`);
  }
  console.log("flags:");
  for (const [flag, count] of [...flagCounts.entries()].sort()) {
    console.log(`  ${flag}: ${count}`);
  }
}

function writeAddedDates(resolutions: Resolution[], force: boolean): void {
  let written = 0;
  let skipped = 0;

  for (const { file, chosen } of resolutions) {
    const filePath = path.join(PROJECTS_DIR, file.filename);
    let text = fs.readFileSync(filePath, "utf-8");
    if (!text.startsWith("---\n")) throw new Error(`${filePath}: no frontmatter`);
    let end = text.indexOf("\n---\n", 3);
    if (end === -1) throw new Error(`${filePath}: unterminated frontmatter`);
    if (/^added:/m.test(text.slice(4, end + 1))) {
      if (!force) {
        skipped++;
        continue;
      }
      // Drop the old key rather than splicing a second one in: YAML duplicate
      // keys are what --force would otherwise produce.
      text = text.slice(0, end + 1).replace(/^added:.*\n/m, "") + text.slice(end + 1);
      end = text.indexOf("\n---\n", 3);
    }
    fs.writeFileSync(filePath, text.slice(0, end + 1) + `added: "${chosen}"\n` + text.slice(end + 1));
    written++;
  }

  console.log(`\nwrote ${written} files, skipped ${skipped} (already had added:)`);
}

function main(): void {
  const write = process.argv.includes("--write");
  const force = process.argv.includes("--force");

  const revisions = readRevisions();
  const { urlDates, titleDates } = mineDates(revisions);
  const files = readContentFiles();
  const { resolutions, unresolved } = resolve(files, urlDates, titleDates, revisions[0].date);

  if (unresolved.length > 0) {
    console.error(`Unresolved: ${unresolved.length} files could not be matched to any README revision:`);
    for (const f of unresolved) {
      console.error(`  ${f.filename} — title: ${f.title} — url: ${f.url}`);
    }
    process.exit(1);
  }

  if (write) {
    writeAddedDates(resolutions, force);
  } else {
    printReport(resolutions);
  }
}

main();
