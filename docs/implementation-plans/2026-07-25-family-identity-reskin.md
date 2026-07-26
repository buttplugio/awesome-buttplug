# Reskin awesome-buttplug to the buttplug.io family identity

Status: **approved, not started**
Branch: `awesome-buttplug-site`
Base commit: `5d0f8d2`

---

## Starting state (read this first if you're picking up cold)

Three commits landed immediately before this plan, all accessibility work:

| Commit | What |
|---|---|
| `d238574` | Global `:focus-visible` outline, `color-scheme: dark`, replaced opacity-based dimming, added `--accent-solid` for filled controls, `prefers-reduced-motion` guard, `aria-pressed` on toggles |
| `32cf1d3` | Unified five duplicate pill definitions and three badge definitions into `.pill`/`.badge` in `global.css`; added `isDeprecated()` to `src/utils/categories.ts` as the single deprecation check |
| `5d0f8d2` | Removed `opacity: 0.7` from `.pill-count`/`.rail-count` (was 3.04:1); retuned `--accent` against `--bg-raised` (links were 4.42:1 there) |

**The site currently measures zero WCAG AA contrast failures** across all four page types, verified
in-browser via the Playwright MCP server: 1251 text elements on the index, 148 on a tag page, 16 on
a project page, plus 215/215 focusables carrying a visible focus ring. **Preserving that is a hard
constraint of this plan, not a nice-to-have.** Two of the three commits above exist because
hand-computed contrast was wrong in ways only measurement caught.

Tooling available: the Playwright MCP server is configured at local scope for this repo (added
during the previous session). `npm run preview` serves `dist/` on `:4321`. `.playwright-mcp/` is
gitignored.

---

## Context

`awesome.buttplug.io` is the third site in a family with `buttplug.io` and `intiface.com`, and is
linked from both as the "Apps & Games List". It currently shares none of their visual identity:
Inter instead of Aller/Alternate Gothic, a red accent instead of buttplug pink, no hero, no logo,
and a placeholder "AB" favicon. It reads as an unrelated project.

The goal is to make it recognisably part of the family without sacrificing what it is — a dense,
scannable index of 189 projects. The sibling landing pages are marketing pages with lots of
breathing room; this one has to put filters and a card grid near the fold.

Reference repos (read-only, source of every extracted value below):
- `/Users/qdot/code/docs.buttplug.io/src/css/custom.css` — the `--bp-*` accent palette
- `/Users/qdot/code/docs.buttplug.io/src/pages/index.module.css` — hero, glow, `sectionTitle::after`, card hover
- `/Users/qdot/code/docs.intiface.com/src/css/custom.css` — the Aller / Alternate Gothic `@font-face` declarations
- `/Users/qdot/code/docs.intiface.com/static/fonts/` — the font files themselves

Note: `docs.buttplug.io/tailwind.config.js` and `src/components/homepage/` are **dead code**
(Tailwind and Mantine are both absent from `package.json`). Do not extract values from them.

### Decisions already made with the user

1. **Dark-only.** Keep `color-scheme: dark`; do not build a light mode. Structure tokens so one
   could be added later as a remap rather than a restructure.
2. **Compact hero band**, not a tall marketing hero.
3. **Aller Regular** mapped to normal weight (not Aller Light as the siblings do — too thin for
   12–14px card text), plus Aller Bold and Alternate Gothic for display.
4. **Logo + favicon** from the family, plus a **squidplug watermark**.

---

## Token mapping

Add a raw family layer first, so a future light mode is a remap of the semantic layer only:

```css
:root {
  /* Family palette — raw values. Do not use directly outside :root. */
  --bp-pink: #E91E78;        /* light-mode accent; unused today, kept for parity */
  --bp-pink-bright: #F06292; /* dark-mode accent */
  --bp-pink-light: #F8A4C8;
  --bp-pink-dark: #C4146A;
  --bp-slate-1: #2D3044;  --bp-slate-2: #3E4C5E;
  --bp-slate-3: #4E5E72;  --bp-slate-4: #3D4555;
  --bp-footer: #303846;   --bp-ice: #B8D4E3;
}
```

Semantic remap in `src/styles/global.css`:

| Token | Old | New | Worst measured pair |
|---|---|---|---|
| `--bg` | `#121217` | `#1b1b1d` | accent 5.62 |
| `--bg-raised` | `#1a1a21` | `#242526` | **accent 5.02** ← tightest, drives `--accent` |
| `--bg-inset` | `#1c1c24` | `#1f2022` (derived) | muted 5.65 |
| `--hairline` | `#26262e` | `#444950` | decorative; needs to be visible for the card border |
| `--text` | `#d7d7de` | `#e3e3e3` | 11.96 on raised |
| `--text-muted` | `#8f8f9c` | `#8A9AAA` | 5.33 on raised |
| `--text-bright` | `#f5f5f7` | unchanged | 14.10 |
| `--accent` | `#ea5257` | `#F06292` | 5.02 |
| `--accent-hover` | `#f4757a` | `#F8A4C8` | 8.14 |
| `--accent-solid` | `#d4353a` | `#C4146A` | white-on-fill 5.75 |
| `--pill-bg` / `--pill-fg` | `#24242e` / `#8d8d9d` | `#2a2b2f` / `#a4b1bd` (derived) | **6.47** (was 4.70) |
| `--shadow-accent` | red rgba | `rgba(196,20,106,.35)` | decorative |
| `--font-sans` | Inter stack | Aller stack | — |
| `--font-display` | — | Alternate Gothic stack (new) | — |

Success/warning/danger tokens are unchanged and still clear AA on the new surfaces.

**The two-token accent split must survive.** White on `#F06292` is only 3.06:1, and white on the
"primary" brand pink `#E91E78` is 4.27:1 — both fail. `--accent-solid: #C4146A` is the only value
that works for filled controls. Comment this in the CSS so nobody "corrects" it to the brand pink.

### Three pairs that WILL fail if global tokens are reused naively

All in the footer, all caused by `#303846`:

| Pair | Ratio | Fix |
|---|---|---|
| `--text-muted` on `#303846` | **4.09** ❌ | new `--footer-muted: #a3b1bf` (5.39) |
| `--accent` on `#303846` | **3.86** ❌ | new `--footer-link: #F8A4C8` (6.26) |
| `--bp-ice` as hero body text on stop `#4E5E72` | **4.28** ❌ | hero text is `#fff` (6.63) or `rgba(255,255,255,.85)` (5.34) only |

Note the last one: the family's own hero tagline fails AA. Do not copy that part.

---

## Fonts

Copy verbatim into `public/fonts/` from `/Users/qdot/code/docs.intiface.com/static/fonts/`:
`Aller_Rg.ttf`, `Aller_Bd.ttf`, `AlternateGotNo2D.otf`, and `Aller Font License.txt`.

**Ship the TTFs as-is; do not convert to woff2.** EULA clause 16 permits conversion only to EOT
"or other format which Dalton Maag may from time-to-time make it known that it allows"; woff2
isn't named, and clause 20 forbids Derivative Works outside "permitted conversions as expressly
set out". Brotli gets `Aller_Rg.ttf` to ~51KB on the wire vs ~40KB for a woff2 — not worth it.

New `src/styles/fonts.css`, imported first in `BaseLayout.astro`:
- Aller Regular → weight 400, Aller Bold → weight 700, both `font-display: swap`
- Alternate Gothic → `font-display: block` (used on ~2 elements; a short block window beats a
  jarring metric swap on the wordmark)
- Preload **only** `Aller_Rg.ttf`
- Add a metric-adjusted `"Aller Fallback"` `@font-face` over `local("Arial")` with
  `ascent-override`/`size-adjust`, then measure real CLS with a `layout-shift` PerformanceObserver
  and tune. Do not paste estimates and assume they're right.

**Knock-on:** `h1,h2,h3 { font-weight: 650 }` currently resolves against Inter Variable. Aller is a
static two-weight family, so 650 synthesises a fake bold. Change to `700`; same for
`.card-monogram { font-weight: 800 }`.

**Drop the three `font-style: italic` rules** (`filter.css:176`, `filter.css:190`,
`[...id].astro:57`). No Aller italic is being shipped, so browsers would synthesise an oblique that
looks worse than Inter's real italic. All three are small muted text where italic buys little.

Remove `@fontsource-variable/inter` from `package.json` and `BaseLayout.astro` — it's the only
consumer, and leaving it bundles ~100KB of unreferenced woff2 into `dist/`.

---

## Hero

New `src/components/Hero.astro`, rendered via a **named slot** in `BaseLayout` between `</header>`
and `<main>`. This gets full-bleed for free — `main` is `max-width: 1200px` with padding, so an
inline hero would be boxed, and `100vw` hacks break with scrollbars.

```astro
</header>
<slot name="hero" />
<main><slot /></main>
```

The existing `<h1>` and `<p class="lede">` **move into the hero** and are deleted from
`index.astro`. That makes the band a net vertical *saving* of ~40px versus today, and keeps exactly
one `<h1>` per page.

Layout: logo left / copy right on desktop (~120px tall), stacked-centred under 640px. The family
hero is centred-stacked, but that costs ~110px more vertical at this width.

- Gradient: `linear-gradient(135deg, #2D3044 0%, #3E4C5E 40%, #4E5E72 70%, #3D4555 100%)`
- Pink glow via `::before`: 600px circle, `radial-gradient(circle, rgba(233,30,120,0.14) 0%, transparent 70%)`.
  Alpha raised from the family's 0.08 because this band is a third the height of the docs hero, so
  only the faint outer falloff shows. It's luminance-neutral — verified white-on-gradient stays 6.63:1.
- Logo: `/img/logo.png` (copy from `docs.buttplug.io/static/img/logo.png`) at 72px with the family's
  `heroLogoFloat` 4s animation. Set intrinsic `width`/`height` attributes — the unreserved 60KB PNG
  box is the biggest CLS risk in the reskin.
- `alt=""` — the adjacent `<h1>` already carries the name.

**Reduced motion needs no new guard.** The existing global `*` rule in `global.css` already
neutralises the animation to `translateY(0)`. Verify with emulation rather than adding a redundant
second rule that will drift.

**Interior pages get no hero.** `/tags`, `/tags/[tag]` and `/projects/[...id]` are destinations
reached from search or a card click, they already have an `<h1>`, and the family's own docs pages
have no hero either. Instead they get the family's section rule, left-aligned:

```css
h1::after { content:''; display:block; width:60px; height:3px;
            background: var(--accent); margin:0.75rem 0 0; border-radius:2px; }
.hero h1::after { display: none; }
```

Also replace `public/favicon.svg` (currently a placeholder "AB" square) with the family logo.

---

## Cards

Apply the family treatment to `.card` in `filter.css`: `border: 1px solid var(--hairline)` plus
`border-top: 3px solid transparent` going `--accent` on hover, `translateY(-4px)`, `0.2s ease`.

- Bump `.card-grid { gap }` from `0.875rem` to `1rem` — a `-4px` lift plus the larger shadow makes
  hovered cards overlap their neighbour's shadow at the current gutter.
- Soften `--shadow-card` toward the family's `0 8px 24px rgba(0,0,0,0.12)`. The current
  `rgb(0 0 0 / 0.5)` was tuned for near-black `#121217` and will look muddy on `#242526`.
- The `3px`/`1px` asymmetric border against `overflow: hidden` leaves a 1px sliver above
  `.card-media` at the top corners. Either give `.card-media` a matching
  `border-radius: calc(var(--radius) - 3px) ... 0 0` or accept it — check in visual mode.
- `.card.deprecated .card-media { filter: grayscale(1) }` and the compact/visual switch need **no
  change** — the grayscale targets the media child and the hover lives on `.card`, so both modes
  behave identically. Do eyeball that grayscale media still reads on the lighter surface.
- Give `.tag-project-card` in `tags/[tag].astro` the family's *left*-border variant (it's a
  horizontal list row, not a grid card).

---

## Navbar / footer

Navbar: logo + wordmark in `--font-display` uppercase at ~`1.4rem` (Alternate Gothic is condensed —
`1.15rem` reads much smaller than Inter did), a flex spacer, then cross-links to buttplug.io,
intiface.com and GitHub. Keep nav links in `--font-sans`; a condensed display face at `0.95rem`
across five links is hard to read.

Footer: `#303846`, always dark, with the community cross-links the siblings use. Must use
`--footer-muted` and `--footer-link`, not the global tokens — see the failure table above.

---

## Squidplug watermark

**There is no good home for it on the index page.** The page is header → search → hero → rail →
tag bar → toolbar → 189-card grid → footer, with no section band. Behind the grid you'd see it only
in the 14px gutters. Don't force it.

Put it in the **footer** (full-bleed, three lines of content, present on every page — the family's
"signature at the bottom" move) at `opacity: 0.07`, and optionally on the `.no-results` empty state,
which is the one place on the index with genuine dead space.

**Check the asset before doing asset work.** `docs.buttplug.io/static/img/squidplug.png` is a
paletted PNG *with a tRNS chunk*, so transparency data exists — the sibling sites'
`background-blend-mode` scrim hack may be unnecessary here. Decode a corner pixel first (no PIL on
this machine; use a small Node script or `sharp`). If the background does turn out opaque, produce a
transparent copy as a committed artefact rather than fighting it with blend modes, none of which
work cleanly (`darken` kills the purple squid, `lighten` keeps the white box).

---

## Monogram gradients

`src/utils/monogram.ts` has 8 gradients, two of which collide with the new identity:
`["#e5484d", …]` is the *old* accent red and will look like a leftover, and `["#d44c9e", …]` is a
pink that will read as "the brand accent" on ~12% of cards, diluting pink-means-interactive.

Reharmonise the set around the family slate/ice range plus a few muted hues. **Keep 8 entries** so
`hash % 8` distribution is unchanged; `src/utils/monogram.test.ts` will need updating.

Latent, pre-existing, optional: `--monogram-fg` is `rgb(255 255 255 / 0.85)`, which is 2.24:1 on
`#d9a521`. Automated checkers report "incomplete" rather than "fail" for text over a gradient, which
is why the current audit missed it. If touching this file anyway, darken the gradient endpoints so
white clears 4.5.

---

## Execution model — what gets delegated

Most of this work is mechanical once the token table above is fixed, so it farms out well. The
division is drawn on one line: **anything that decides a colour value stays in the main context;
anything that consumes a decided value goes to a subagent.**

### Stays in the main context (not delegated)

- **The token mapping itself** (commits 3–4). Every value in that table is load-bearing and several
  sit within 0.5 of the AA floor. This is the commit that can silently destroy the zero-failure
  invariant, and it's a single ~40-line diff — delegating it costs more in briefing than it saves.
- **All contrast verification.** The Playwright audit after each gate. A cheaper model asked "is
  4.42 close enough to 4.5" will rationalise; the previous session caught two failures that survived
  hand-checking, and both were near-misses. Non-negotiable.
- **Final integration review** across the four page types.

### Delegated

Every subagent brief must include, verbatim: the token table, the rule **"do not invent, adjust, or
'improve' any colour value — use the named tokens only"**, and the instruction to stop and report
rather than guess if a needed token doesn't exist. Each returns a diff and a one-paragraph summary;
the main context reviews before committing.

**Wave A — three agents in parallel, disjoint files, no dependency on the palette:**

| Task | Agent | Files |
|---|---|---|
| Vendor the 4 font files, verify only 3 faces + licence ship | `ed3d-basic-agents:haiku-general-purpose` | `public/fonts/` |
| Decode a squidplug corner pixel; if opaque, produce a transparent copy | `ed3d-basic-agents:haiku-general-purpose` | `public/img/` |
| Reharmonise the 8 monogram gradients, update the unit test | `ed3d-basic-agents:sonnet-general-purpose` | `src/utils/monogram.ts`, `monogram.test.ts` |

**Wave B — sequential, after the palette lands.** Each is a self-contained component with a written
spec above, which is exactly the shape a mid-tier model handles well:

| Task | Agent |
|---|---|
| `fonts.css`, `@font-face`, preload, fallback metrics, weight 650→700, drop italics, remove Inter | `sonnet-general-purpose` |
| Navbar + footer markup and CSS | `sonnet-general-purpose` |
| `Hero.astro` + the `BaseLayout` named slot + favicon swap | `sonnet-general-purpose` |
| Card treatment, grid gap, shadow softening, `.tag-project-card` variant | `sonnet-general-purpose` |
| Interior `h1::after` rule + audit of the three scoped `<style>` blocks | `sonnet-general-purpose` |
| Squidplug watermark CSS | `haiku-general-purpose` |

**Two carve-outs where the spec is deliberately incomplete and the agent must report back rather
than decide:** the fallback-metric `size-adjust` numbers (need real CLS measurement, not the
estimates in this plan) and the card top-corner sliver (a judgement call about whether it's visible
enough to fix). Both must be called out in the briefs as "measure and report, do not guess".

Wave A can start immediately, in parallel with the main context writing commits 3–4.

---

## Commits

Fonts before colours, because the font swap changes text rendering weight and therefore perceived
contrast — settle that before measuring the palette. Palette before footer, because the footer
overrides are defined in terms of the new palette.

| # | Commit | Owner | Why it's reviewable alone |
|---|---|---|---|
| 1 | `chore: vendor Aller and Alternate Gothic webfonts` | Haiku (A) | Pure asset add; check licence file ships and only 3 faces are included |
| 2 | `feat: switch body and display type to the family fonts` | Sonnet (B) | Typography-only. Site is still red here, intentionally. Measure CLS |
| 3 | `refactor: introduce raw family palette layer` | **main** | Zero visual diff; sets up light-mode-later |
| 4 | `feat: repoint surfaces and accents to the family palette` | **main** | **The contrast-critical commit.** One diff, one audit run |
| 5 | `feat: family navbar and footer` | Sonnet (B) | Contains the three footer AA fixes |
| 6 | `feat: compact hero band on the index page` | Sonnet (B) | Self-contained component; check fold position + reduced motion |
| 7 | `feat: family card hover treatment` | Sonnet (B) | Interaction-only; eyeball both view modes |
| 8 | `refactor: reharmonise monogram gradients` | Sonnet (A) | Has its own unit test |
| 9 | `feat: accent rule under interior page headings` | Sonnet (B) | Forces a pass over the three scoped `<style>` blocks |
| 10 | `feat: squidplug watermark in the footer and empty state` | Haiku (A+B) | Isolated decorative layer, trivially revertible |

Commits stay in this order regardless of who wrote the code — Wave A's output sits staged until its
slot comes up, so the history reads as a clean sequence rather than interleaved agent output.

---

## Risks

**Pagefind currently emits 54 zero-byte files** into `dist/pagefind/`, including `pagefind-ui.js`,
`pagefind-ui.css`, `pagefind-entry.json` and `wasm.unknown.pagefind`, with the source package in
`node_modules` intact. Search rendered fine earlier in the previous session, so this looks flaky
rather than permanently broken, but **it means search was never actually verified**. Do a clean
`rm -rf dist && npm run build` before trusting any local check of search, and if it reproduces it's
a real bug deserving its own investigation, separate from this work.

**Pagefind theming is mostly fine.** `--pagefind-ui-primary` is only used for checkbox fills and
link-coloured affordances on `--bg-inset` (5.33:1 for `#F06292`) — no white-on-pink fill anywhere.
But `--pagefind-ui-tag` is never set and defaults to `#eeeeee`, which against `--pagefind-ui-text`
would be 1.06:1. Unreachable with the current config, but set it to `var(--pill-bg)` while in there.

**Three scoped `<style>` blocks reference tokens** and won't be caught by any global sweep:
`projects/[...id].astro:54-90`, `tags/index.astro:30-41`, `tags/[tag].astro:54-81`. The tags-index
hover overrides `.pill`'s colour via source order — fragile if import order ever changes; add a comment.

**`.pill.dimmed` uses `border-color: var(--hairline)`**, which jumps from `#26262e` to `#444950`.
Dimmed pills go from nearly borderless to visibly outlined. Arguably an improvement, but it's an
unrequested visual change — confirm it looks intentional. Note dimmed pills only render once the
tag bar is expanded via "+N more".

**Aller licence exposure.** The free licence is 25 Users, where clause 16 defines 1,000 Website
Visitors *per day* as 1 User, and lets you disregard the busiest day in a seven-day period. That's
~25,000 visitors/day, which awesome.buttplug.io is very unlikely to hit — a footnote, not a blocker.
Both sibling sites already serve these fonts the same way.

**`npm run build` rewrites `README.md`** via the postbuild hook. Keep it out of every style commit;
stage files explicitly (the project CLAUDE.md forbids `git add -A` / `git commit -am` for exactly
this reason).

---

## Verification

Before each of commits 4, 5, 6 and 7, re-run the in-browser contrast audit that established the
current zero-failure baseline — via the Playwright MCP server against `npm run preview`, over all
four page types, **in both view modes and with the tag bar expanded**.

This runs in the main context, on the returned diff, **before** the commit — never inside the
subagent that wrote the code. An agent verifying its own colour work is the failure mode this
whole split exists to prevent.

The audit script walks every element with a direct text child, resolves the effective background by
walking ancestors, multiplies cumulative `opacity` down the chain (CSS `opacity` does *not* appear
in `getComputedStyle().color`, which is how the earlier hand-check missed a 3.04:1 failure), and
compares against 4.5 or 3.0 depending on computed font size and weight.

Re-measure by hand the six pairs with the least headroom, since these are what move if anyone
nudges a value:

| Pair | Target |
|---|---|
| `--accent` on `--bg-raised` | 5.02 |
| `--pill-fg` on `--pill-bg` | 6.47 |
| `--footer-muted` on `#303846` | 5.39 |
| `--footer-link` on `#303846` | 6.26 |
| `rgba(255,255,255,.85)` on hero stop `#4E5E72` | 5.34 |
| `--text-muted` on `--bg-raised` | 5.33 |

Also verify: focus ring present on every focusable (was 215/215 on the index); CLS under 0.01 after
the font swap; the hero float stops under `prefers-reduced-motion` emulation; `npx vitest run`
passes (26 tests today, plus whatever the monogram change adds); and a clean build produces non-zero
pagefind assets with working search.

---

## Follow-ups deliberately out of scope

- **Light mode.** Tokens are structured for it; building it is a separate piece of work.
- **Pricing badges containing full URLs.** Several `pricing` frontmatter values are markdown links;
  `stripInlineMarkdown` strips the markup and leaves bare URLs, so VRBrations renders a badge holding
  two complete GitHub URLs across three lines. It's a content fix, not a CSS one.
- **`CLAUDE.md` is stale.** It lists a `ProjectCard.astro` that no longer exists, omits `src/utils/`
  and its four vitest suites, and predates `.pill`/`.badge` and `isDeprecated()`. This reskin will
  make it staler still — worth a pass at the end.
