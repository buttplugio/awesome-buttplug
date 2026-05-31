import fs from "node:fs";
import path from "node:path";

const README_PATH = path.resolve("README.md");
const OUTPUT_DIR = path.resolve("src/content/projects");

const EXCLUDED_SECTIONS = new Set([
  "Community Links",
  "Friends of Buttplug",
  "Table Of Contents",
]);

const SECTION_MAP: Record<string, string> = {
  "Utilities": "applications/utilities",
  "Video Sync / Movies": "applications/video-sync",
  "Audio Sync": "applications/audio-sync",
  "Games": "games",
  "Game Mods": "game-mods",
  "Counter-Strike": "game-mods/counter-strike",
  "Overwatch 2": "game-mods/overwatch-2",
  "Risk of Rain 2": "game-mods/risk-of-rain-2",
  "Minecraft": "game-mods/minecraft",
  "FFXIV": "game-mods/ffxiv",
  "Terraria": "game-mods/terraria",
  "Virtual Worlds": "virtual-worlds",
  "VRChat": "virtual-worlds/vrchat",
  "ChilloutVR": "virtual-worlds/chilloutvr",
  "Hardware Support": "hardware-support",
  "General Development": "development/general",
  "Rust": "development/general/rust",
  "C#": "development/general/csharp",
  "C++": "development/general/cpp",
  "Java": "development/general/java",
  "Kotlin": "development/general/kotlin",
  "JS/Typescript": "development/general/js-typescript",
  "Python": "development/general/python",
  "Haskell": "development/general/haskell",
  "Go": "development/general/go",
  "Lua": "development/general/lua",
  "LISP": "development/general/lisp",
  "Dart": "development/general/dart",
  "Gleam": "development/gleam",
  "Game Development": "development/game-development",
  "Other Frameworks and Plugins": "development/other-frameworks",
  "DIY Hardware Projects": "diy-hardware",
  "Deprecated Projects": "deprecated",
};

const TAG_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateTag(tag: string): boolean {
  return TAG_SLUG_REGEX.test(tag);
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[®™©]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferTags(sectionId: string, bullets: string[], title: string): string[] {
  const tags: string[] = [];

  if (sectionId === "deprecated") tags.push("deprecated");
  if (sectionId.startsWith("applications/")) tags.push("utility");
  if (sectionId === "applications/video-sync") tags.push("video-sync");
  if (sectionId === "applications/audio-sync") tags.push("audio-sync");
  if (sectionId === "games") tags.push("game");
  if (sectionId.startsWith("game-mods")) tags.push("game-mod");
  if (sectionId.startsWith("virtual-worlds")) tags.push("virtual-world");
  if (sectionId.startsWith("virtual-worlds/vrchat")) tags.push("vrchat");
  if (sectionId.startsWith("development")) tags.push("library");
  if (sectionId === "hardware-support") tags.push("hardware");
  if (sectionId === "diy-hardware") tags.push("diy", "hardware");

  const bulletText = bullets.join(" ").toLowerCase();
  if (bulletText.includes("open source")) tags.push("open-source");
  if (bulletText.includes("free")) tags.push("free");
  if (bulletText.includes("paid") || bulletText.includes("crowdfunded")) tags.push("paid");
  if (bulletText.includes("windows")) tags.push("windows");
  if (bulletText.includes("cross platform")) tags.push("cross-platform");
  if (bulletText.includes("web based") || bulletText.includes("webgl") || bulletText.includes("web)")) tags.push("web");
  if (bulletText.includes("vr")) tags.push("vr");
  if (bulletText.includes("linux")) tags.push("linux");
  if (bulletText.includes("android")) tags.push("android");
  if (bulletText.includes("quest")) tags.push("meta-quest");

  const langMap: Record<string, string> = {
    "development/general/rust": "rust",
    "development/general/csharp": "c-sharp",
    "development/general/cpp": "cpp",
    "development/general/java": "java",
    "development/general/kotlin": "kotlin",
    "development/general/js-typescript": "javascript",
    "development/general/python": "python",
    "development/general/haskell": "haskell",
    "development/general/go": "go",
    "development/general/lua": "lua",
    "development/general/lisp": "lisp",
    "development/general/dart": "dart",
    "development/gleam": "gleam",
  };
  if (langMap[sectionId]) tags.push(langMap[sectionId]);

  const gameMap: Record<string, string> = {
    "game-mods/counter-strike": "counter-strike",
    "game-mods/overwatch-2": "overwatch-2",
    "game-mods/risk-of-rain-2": "risk-of-rain-2",
    "game-mods/minecraft": "minecraft",
    "game-mods/ffxiv": "ffxiv",
    "game-mods/terraria": "terraria",
  };
  if (gameMap[sectionId]) tags.push(gameMap[sectionId]);

  return [...new Set(tags)];
}

function extractPricing(bullets: string[]): string | undefined {
  for (const bullet of bullets) {
    const lower = bullet.toLowerCase();
    if (lower.startsWith("free,") || lower.startsWith("paid") || lower.startsWith("crowdfunded") || lower.startsWith("commercial")) {
      return bullet.replace(/,?\s*repo at\s+https?:\/\/\S+/i, "").trim();
    }
    if (lower.match(/^free\b/) && !lower.includes("freedom")) {
      return bullet.replace(/,?\s*repo at\s+https?:\/\/\S+/i, "").trim();
    }
  }
  return undefined;
}

function extractPlatforms(bullets: string[]): string[] | undefined {
  const platforms: string[] = [];
  for (const bullet of bullets) {
    if (/windows/i.test(bullet)) platforms.push("Windows");
    if (/cross platform/i.test(bullet)) platforms.push("Cross-platform");
    if (/web based|webgl/i.test(bullet)) platforms.push("Web");
    if (/linux/i.test(bullet)) platforms.push("Linux");
    if (/mac/i.test(bullet)) platforms.push("macOS");
    if (/android/i.test(bullet)) platforms.push("Android");
    if (/quest/i.test(bullet)) platforms.push("Meta Quest");
    if (/\bvr\b/i.test(bullet) && !/vrchat/i.test(bullet)) platforms.push("VR");
  }
  return platforms.length > 0 ? [...new Set(platforms)] : undefined;
}

function extractDeprecationReason(bullets: string[]): string | undefined {
  for (const bullet of bullets) {
    if (bullet.toLowerCase().startsWith("deprecation reason:")) {
      return bullet.replace(/^deprecation reason:\s*/i, "").trim();
    }
  }
  return undefined;
}

function extractRepo(bullets: string[]): string | undefined {
  for (const bullet of bullets) {
    const match = bullet.match(/repo at\s+(https?:\/\/\S+)/i);
    if (match) return match[1];
    const availMatch = bullet.match(/available on\s+\[.*?\]\((https?:\/\/(?:github|gitlab|codeberg|sr\.ht)\S+)\)/i);
    if (availMatch) return availMatch[1];
  }
  return undefined;
}

function extractSummary(bullets: string[], title: string): string {
  for (const bullet of bullets) {
    const lower = bullet.toLowerCase();
    if (lower.startsWith("free") || lower.startsWith("paid") || lower.startsWith("crowdfunded")) continue;
    if (lower.startsWith("commercial")) continue;
    if (/^(windows|cross platform|web based|linux|mac|android|desktop|meta quest)/i.test(lower)) continue;
    if (lower.includes("repo at ")) continue;
    if (lower.startsWith("available on") || lower.startsWith("available at")) continue;
    if (lower.startsWith("deprecation reason:")) continue;
    if (lower.startsWith("maintained by")) continue;
    if (bullet.trim().length > 10) return bullet;
  }
  return title;
}

interface ParsedEntry {
  title: string;
  url: string;
  bullets: string[];
  section: string;
  order: number;
}

function parseReadme(): ParsedEntry[] {
  const content = fs.readFileSync(README_PATH, "utf-8");
  const lines = content.split("\n");
  const entries: ParsedEntry[] = [];

  let currentSections: string[] = [];
  let inExcludedSection = false;
  let currentEntry: ParsedEntry | null = null;
  let currentBulletLines: string[] = [];
  const sectionOrderCounters = new Map<string, number>();

  function flushEntry() {
    if (currentEntry && currentBulletLines.length > 0) {
      currentEntry.bullets = currentBulletLines;
      entries.push(currentEntry);
    } else if (currentEntry) {
      entries.push(currentEntry);
    }
    currentEntry = null;
    currentBulletLines = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const headingMatch = line.match(/^(#{2,4})\s+(.+)/);
    if (headingMatch) {
      flushEntry();
      const level = headingMatch[1].length;
      const heading = headingMatch[2].trim();

      if (level === 2) currentSections = [heading];
      else if (level === 3) currentSections = [currentSections[0], heading];
      else if (level === 4) currentSections = [currentSections[0], currentSections[1], heading];

      inExcludedSection = EXCLUDED_SECTIONS.has(heading) || EXCLUDED_SECTIONS.has(currentSections[0]);

      continue;
    }

    if (inExcludedSection) continue;

    const entryMatch = line.match(/^- \[(.+?)\]\((.+?)\)\s*$/);
    if (entryMatch) {
      flushEntry();
      const mostSpecificHeading = currentSections[currentSections.length - 1];
      const sectionId = SECTION_MAP[mostSpecificHeading];

      if (!sectionId) {
        console.warn(`WARNING: No section mapping for heading "${mostSpecificHeading}" (entry: ${entryMatch[1]})`);
        continue;
      }

      const orderInSection = (sectionOrderCounters.get(sectionId) || 0) + 1;
      sectionOrderCounters.set(sectionId, orderInSection);

      currentEntry = {
        title: entryMatch[1],
        url: entryMatch[2],
        bullets: [],
        section: sectionId,
        order: orderInSection,
      };
      currentBulletLines = [];
      continue;
    }

    if (currentEntry) {
      const bulletMatch = line.match(/^\s+- (.+)/);
      if (bulletMatch && line.match(/^\s{2,4}- /)) {
        currentBulletLines.push(bulletMatch[1]);
      } else if (line.match(/^\s{4,}\S/) && currentBulletLines.length > 0) {
        currentBulletLines[currentBulletLines.length - 1] += " " + line.trim();
      } else if (line.trim() === "") {
        // blank line might end entry or just be spacing
      } else {
        flushEntry();
      }
    }
  }

  flushEntry();
  return entries;
}

function writeEntry(entry: ParsedEntry): void {
  const slug = slugify(entry.title);
  const outputPath = path.join(OUTPUT_DIR, `${slug}.md`);

  if (fs.existsSync(outputPath)) {
    console.log(`SKIP: ${slug}.md already exists`);
    return;
  }

  const rawTags = inferTags(entry.section, entry.bullets, entry.title);
  if (rawTags.length === 0) rawTags.push("uncategorised");
  const tags = rawTags.filter((tag) => {
    if (!validateTag(tag)) {
      console.warn(`WARNING: Tag "${tag}" for entry "${entry.title}" is not a valid slug, skipping`);
      return false;
    }
    return true;
  });
  if (tags.length === 0) tags.push("uncategorised");

  const pricing = extractPricing(entry.bullets);
  const platforms = extractPlatforms(entry.bullets);
  const repo = extractRepo(entry.bullets);
  const deprecationReason = extractDeprecationReason(entry.bullets);
  const summary = extractSummary(entry.bullets, entry.title);

  const yamlLines = ["---"];
  yamlLines.push(`title: ${JSON.stringify(entry.title)}`);
  yamlLines.push(`url: ${JSON.stringify(entry.url)}`);
  if (repo) yamlLines.push(`repo: ${JSON.stringify(repo)}`);
  yamlLines.push(`section: ${JSON.stringify(entry.section)}`);
  yamlLines.push("tags:");
  for (const tag of tags) yamlLines.push(`  - ${tag}`);
  if (pricing) yamlLines.push(`pricing: ${JSON.stringify(pricing)}`);
  if (platforms) {
    yamlLines.push("platforms:");
    for (const p of platforms) yamlLines.push(`  - ${JSON.stringify(p)}`);
  }
  yamlLines.push(`summary: ${JSON.stringify(summary)}`);
  yamlLines.push("readme_bullets:");
  if (entry.bullets.length === 0) {
    yamlLines.push("  []");
  } else {
    for (const bullet of entry.bullets) yamlLines.push(`  - ${JSON.stringify(bullet)}`);
  }
  if (deprecationReason) yamlLines.push(`deprecation_reason: ${JSON.stringify(deprecationReason)}`);
  yamlLines.push(`order: ${entry.order}`);
  yamlLines.push("---");
  yamlLines.push("");
  yamlLines.push(`${summary}`);
  yamlLines.push("");

  fs.writeFileSync(outputPath, yamlLines.join("\n"));
  console.log(`CREATED: ${slug}.md`);
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const entries = parseReadme();

  console.log(`Parsed ${entries.length} entries from README.md`);

  for (const entry of entries) {
    writeEntry(entry);
  }

  console.log("\nMigration complete. Run 'npm run build' to validate all entries against the schema.");
}

main();
