# Awesome Buttplug Site Implementation Plan — Phase 2: Content Collection & Schema

**Goal:** Define the entry data model with Zod validation via Astro's Content Collections API, and migrate 13 seed entries from the current README covering varied sections, tags, and deprecation status.

**Architecture:** Content collection at `src/content/projects/` with `glob()` loader. Schema validates frontmatter at build time. Each project is a markdown file where frontmatter holds structured metadata and the body provides detail page content.

**Tech Stack:** Astro 6 Content Collections (Content Layer API), `astro/zod` (bundled Zod v4), `astro/loaders` (glob loader)

**Scope:** 8 phases from original design (this is phase 2 of 8)

**Codebase verified:** 2026-05-30 — Phase 1 creates the Astro scaffold; this phase adds content collection on top.

**IMPORTANT: Astro 6 API change.** The design plan references `src/content/config.ts` — this is the legacy Astro 4/5 API. Astro 6 uses `src/content.config.ts` (at the `src/` root) with explicit `glob()` loaders from `astro/loaders` and Zod from `astro/zod`.

---

## Acceptance Criteria Coverage

This phase implements and tests:

### awesome-buttplug-site.AC2: Entry data model
- **awesome-buttplug-site.AC2.1 Success:** Entry with all required fields (title, url, section, tags, summary, readme_bullets) passes schema validation
- **awesome-buttplug-site.AC2.2 Failure:** Entry missing required field fails build with descriptive error
- **awesome-buttplug-site.AC2.3 Success:** Entry with optional fields omitted (repo, image, pricing, platforms, deprecation_reason) builds successfully with defaults applied

---

<!-- START_TASK_1 -->
### Task 1: Create content collection schema

**Files:**
- Create: `src/content.config.ts`

**Step 1: Create the content collection config**

```typescript
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const tagSlug = z.string().regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Tags must be URL-safe slugs: lowercase letters, numbers, and hyphens only"
);

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    repo: z.string().url().optional(),
    section: z.string(),
    tags: z.array(tagSlug).min(1),
    image: z.string().optional(),
    pricing: z.string().optional(),
    platforms: z.array(z.string()).optional(),
    summary: z.string(),
    readme_bullets: z.array(z.string()).min(1),
    deprecation_reason: z.string().optional(),
    order: z.number().optional(),
  }),
});

export const collections = { projects };
```

**Step 2: Create the projects content directory**

```bash
mkdir -p src/content/projects
```

**Step 3: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: add content collection schema for project entries"
```
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Create seed entries — Utilities section

**Files:**
- Create: `src/content/projects/intiface-central.md`
- Create: `src/content/projects/buttplug-playground.md`
- Create: `src/content/projects/toywebridge.md`

**Step 1: Create seed entries**

`src/content/projects/intiface-central.md`:

```markdown
---
title: "Intiface® Central"
url: "http://intiface.com/central"
repo: "https://github.com/intiface/intiface-central"
section: "applications/utilities"
tags:
  - utility
  - open-source
  - cross-platform
pricing: "Free, open source"
summary: "Hub program for Buttplug. Allows applications to connect to an external Buttplug system, meaning they don't have to update their program every time Buttplug itself updates."
readme_bullets:
  - "Free, open source, repo at https://github.com/intiface/intiface-central"
  - "Hub program for Buttplug. Allows applications to connect to an external Buttplug system, meaning they don't have to update their program every time Buttplug itself updates."
---

Intiface Central is the primary hub application for the Buttplug ecosystem. It manages device connections and provides a server that other applications can connect to for toy control.
```

`src/content/projects/buttplug-playground.md`:

```markdown
---
title: "Buttplug Playground"
url: "https://playground.buttplug.world"
repo: "https://github.com/intiface/buttplug-playground"
section: "applications/utilities"
tags:
  - utility
  - open-source
  - web
  - cross-platform
pricing: "Free, open source"
platforms:
  - "Web"
summary: "Test utility for simple device connection and control."
readme_bullets:
  - "Free, open source, repo at https://github.com/intiface/buttplug-playground"
  - "Web based (Cross platform, either via browsers or Intiface Central)"
  - "Test utility for simple device connection and control."
---

Web-based test utility for connecting and controlling Buttplug-compatible devices.
```

`src/content/projects/toywebridge.md`:

```markdown
---
title: "ToyWebBridge"
url: "https://github.com/kyrahabattoir/ToyWebBridge"
repo: "https://github.com/kyrahabattoir/ToyWebBridge"
section: "applications/utilities"
tags:
  - utility
  - open-source
  - windows
pricing: "Free, open source"
platforms:
  - "Windows"
summary: "Generic REST frontend for Buttplug."
readme_bullets:
  - "Free, open source, repo at https://github.com/kyrahabattoir/ToyWebBridge"
  - "Windows 10+ only"
  - "Generic REST frontend for Buttplug."
---

A REST API bridge for Buttplug, allowing HTTP-based integrations.
```

**Step 2: Commit**

```bash
git add src/content/projects/intiface-central.md src/content/projects/buttplug-playground.md src/content/projects/toywebridge.md
git commit -m "feat: add seed entries for utilities section"
```
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: Create seed entries — Video Sync, Games, Game Mods

**Files:**
- Create: `src/content/projects/multifunplayer.md`
- Create: `src/content/projects/besti.md`
- Create: `src/content/projects/crotch-stim-get-off.md`
- Create: `src/content/projects/aethersense-redux.md`

**Step 1: Create entries from different sections**

`src/content/projects/multifunplayer.md`:

```markdown
---
title: "MultiFunPlayer"
url: "https://github.com/Yoooi0/MultiFunPlayer"
repo: "https://github.com/Yoooi0/MultiFunPlayer"
section: "applications/video-sync"
tags:
  - video-sync
  - open-source
  - windows
pricing: "Free, open source"
platforms:
  - "Windows"
summary: "Synchronizes funscripts with OSR-2 or any Buttplug compatible device for multiple video players (DeoVR, MPV, HereSphere, Whirligig)."
readme_bullets:
  - "Free, open source, repo at https://github.com/Yoooi0/MultiFunPlayer"
  - "Windows 10+ only"
  - "Synchronizes funscripts with OSR-2 or any Buttplug compatible device for multiple video players (DeoVR, MPV, HereSphere, Whirligig)"
---

MultiFunPlayer synchronizes funscript playback with multiple video players and supports a wide range of Buttplug-compatible devices.
```

`src/content/projects/besti.md`:

```markdown
---
title: "Besti"
url: "https://besti.love"
section: "games"
tags:
  - game
  - windows
  - vr
  - furry
pricing: "Crowdfunded"
platforms:
  - "Windows"
  - "VR"
  - "Desktop"
summary: "MLP and furry focused game integrating Buttplug Unity for toy control within interactive scenes."
readme_bullets:
  - "Crowdfunded, available via multiple platforms, or as a demo"
  - "Windows 10+ only, VR or Desktop"
  - "MLP and furry focused, integrates Buttplug Unity for toy control within interactive scenes. Available in Besti 9 and Besti X."
---

Besti is a crowdfunded furry and MLP focused game with Buttplug integration for interactive toy control during scenes.
```

`src/content/projects/crotch-stim-get-off.md`:

```markdown
---
title: "Crotch-Stim: Get Off (CS:GO)"
url: "https://sr.ht/~hornycactus/CrotchStimGetOff/"
repo: "https://sr.ht/~hornycactus/CrotchStimGetOff/"
section: "game-mods/counter-strike"
tags:
  - game-mod
  - counter-strike
  - open-source
  - cross-platform
pricing: "Free, open source"
platforms:
  - "Desktop"
summary: "CS:GO Buttplug plugin."
readme_bullets:
  - "Free, open source, repo at https://sr.ht/~hornycactus/CrotchStimGetOff/"
  - "Desktop Cross Platform"
  - "CS:GO Buttplug plugin"
---

Counter-Strike: Global Offensive mod that integrates Buttplug for in-game haptic feedback.
```

`src/content/projects/aethersense-redux.md`:

```markdown
---
title: "AetherSense Redux (FFXIV)"
url: "https://github.com/avafloww/AetherSenseRedux"
repo: "https://github.com/avafloww/AetherSenseRedux"
section: "game-mods/ffxiv"
tags:
  - game-mod
  - ffxiv
  - open-source
  - windows
pricing: "Free, open source"
platforms:
  - "Windows"
summary: "FFXIV triggers for sex toy control via Dalamud, direct-connect Buttplug fork of Aethersense."
readme_bullets:
  - "Free, open source, repo at https://github.com/avafloww/AetherSenseRedux"
  - "Windows 10+ only (requires Intiface Central)"
  - "FFXIV triggers for sex toy control, via Dalamud, direct-connect Buttplug fork of Aethersense"
---

FFXIV Dalamud plugin that triggers Buttplug-compatible devices based on in-game events.
```

**Step 2: Commit**

```bash
git add src/content/projects/multifunplayer.md src/content/projects/besti.md src/content/projects/crotch-stim-get-off.md src/content/projects/aethersense-redux.md
git commit -m "feat: add seed entries for video sync, games, and game mods"
```
<!-- END_TASK_3 -->

<!-- START_TASK_4 -->
### Task 4: Create seed entries — Hardware, Dev Libraries, VRChat, Deprecated

**Files:**
- Create: `src/content/projects/edge-o-matic.md`
- Create: `src/content/projects/buttplug-rust.md`
- Create: `src/content/projects/vrcft-osc-toy-module.md`
- Create: `src/content/projects/in-heat-overwatch.md`

**Step 1: Create entries covering remaining sections**

`src/content/projects/edge-o-matic.md`:

```markdown
---
title: "Edge-O-Matic"
url: "https://maustec.io"
repo: "https://github.com/maustec"
section: "hardware-support"
tags:
  - hardware
  - open-source
pricing: "Hardware product, open source firmware"
summary: "Orgasm denial hardware product with open source firmware, improved Nogasm system."
readme_bullets:
  - "Orgasm Denial Hardware Product w/ Open Source Firmware"
  - "Improved Nogasm Orgasm Denial system."
---

The Edge-O-Matic is a hardware product for orgasm denial with open-source firmware, building on the original Nogasm concept.
```

`src/content/projects/buttplug-rust.md`:

```markdown
---
title: "Buttplug Rust"
url: "https://github.com/buttplugio/buttplug"
repo: "https://github.com/buttplugio/buttplug"
section: "development/general/rust"
tags:
  - library
  - rust
  - open-source
pricing: "Free, open source"
summary: "Core Buttplug library, handles all hardware control and remote connections."
readme_bullets:
  - "Available on crates.io"
  - "Maintained by Buttplug Core Team"
  - "Core Buttplug library, handles all hardware control and remote connections."
---

The core Buttplug library written in Rust, providing hardware control and remote connection capabilities. Available on [crates.io](https://crates.io/crates/buttplug).
```

`src/content/projects/vrcft-osc-toy-module.md`:

```markdown
---
title: "VRCFT OSC Toy Module"
url: "https://github.com/Jerakin/VRCFT-Toy-Module"
repo: "https://github.com/Jerakin/VRCFT-Toy-Module"
section: "virtual-worlds/vrchat"
tags:
  - vrchat
  - vr
  - open-source
pricing: "Free, open source"
platforms:
  - "Windows"
  - "VR"
summary: "VRCFaceTracking module for controlling toys via face tracking expressions."
readme_bullets:
  - "Free, open source, repo at https://github.com/Jerakin/VRCFT-Toy-Module"
  - "VRCFaceTracking module for controlling toys via face tracking expressions."
---

A VRCFaceTracking module that maps facial expressions to Buttplug-compatible toy control in VRChat.
```

`src/content/projects/in-heat-overwatch.md`:

```markdown
---
title: "In Heat Overwatch Mod"
url: "https://github.com/Furimanejo/In-Heat"
repo: "https://github.com/Furimanejo/In-Heat"
section: "deprecated"
tags:
  - game-mod
  - overwatch
  - open-source
  - deprecated
pricing: "Free, open source"
deprecation_reason: "Overwatch servers shut down in late 2022. Dev has a new version for Overwatch 2, Underwatch."
summary: "Uses computer vision to track Heat Bar in Overwatch and control sex toys based on levels."
readme_bullets:
  - "Free, open source, repo at https://github.com/Furimanejo/In-Heat"
  - "Uses computer vision to track Heat Bar in Overwatch and control sex toys based on levels."
  - "Deprecation Reason: Overwatch servers shut down in late 2022. Dev has a new version for Overwatch 2, Underwatch."
---

A deprecated Overwatch mod that used computer vision to track the Heat Bar and control sex toys. Superseded by the Overwatch 2 version.
```

**Step 2: Commit**

```bash
git add src/content/projects/edge-o-matic.md src/content/projects/buttplug-rust.md src/content/projects/vrcft-osc-toy-module.md src/content/projects/in-heat-overwatch.md
git commit -m "feat: add seed entries for hardware, dev libs, VRChat, and deprecated"
```
<!-- END_TASK_4 -->

<!-- START_TASK_5 -->
### Task 5: Create seed entries — Audio Sync and DIY

**Files:**
- Create: `src/content/projects/music-boner.md`
- Create: `src/content/projects/flipper-zero-buttplug.md`

**Step 1: Create final seed entries for remaining section coverage**

`src/content/projects/music-boner.md`:

```markdown
---
title: "Music Boner"
url: "https://github.com/Shadoukun/MusicBoner"
repo: "https://github.com/Shadoukun/MusicBoner"
section: "applications/audio-sync"
tags:
  - audio-sync
  - open-source
  - windows
pricing: "Free, open source"
platforms:
  - "Windows"
summary: "Attempt at making a Buttplug music visualizer."
readme_bullets:
  - "Free, open source, repo at https://github.com/Shadoukun/MusicBoner"
  - "Windows 10+ only"
  - "Attempt at making a Buttplug music visualizer."
---

A Buttplug-compatible music visualizer that drives toy intensity from audio output.
```

`src/content/projects/flipper-zero-buttplug.md`:

```markdown
---
title: "Flipper Zero Buttplug"
url: "https://github.com/maybe-hello-world/flipper-bp"
repo: "https://github.com/maybe-hello-world/flipper-bp"
section: "diy-hardware"
tags:
  - diy
  - hardware
  - open-source
pricing: "Free, open source"
summary: "Flipper Zero application to control Buttplug-compatible toys via the Flipper Zero device."
readme_bullets:
  - "Free, open source, repo at https://github.com/maybe-hello-world/flipper-bp"
  - "Flipper Zero application to control Buttplug-compatible toys via the Flipper Zero device."
---

Control Buttplug-compatible devices from a Flipper Zero.
```

**Step 2: Commit**

```bash
git add src/content/projects/music-boner.md src/content/projects/flipper-zero-buttplug.md
git commit -m "feat: add seed entries for audio sync and DIY sections"
```
<!-- END_TASK_5 -->

<!-- START_TASK_6 -->
### Task 6: Verify build with seed entries

**Step 1: Run the build**

Run: `npm run build`
Expected: Build succeeds, all 13 seed entries pass schema validation

**Step 2: Verify schema validation catches errors**

Create a temporary malformed entry to test AC2.2:

Create file `src/content/projects/_test-malformed.md`:

```markdown
---
title: "Test Malformed Entry"
tags:
  - "INVALID TAG WITH SPACES"
---

Missing required fields.
```

Run: `npm run build`
Expected: Build fails with a clear Zod validation error mentioning missing required fields (`url`, `section`, `summary`, `readme_bullets`) and invalid tag format.

**Step 3: Remove the malformed test entry**

```bash
rm src/content/projects/_test-malformed.md
```

**Step 4: Verify build succeeds again**

Run: `npm run build`
Expected: Build succeeds with clean output

**Step 5: Commit (no file changes needed — this is verification only)**

No commit needed for this task; verification confirms the schema works correctly.
<!-- END_TASK_6 -->
