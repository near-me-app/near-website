# Design alignment audit and checkpoint 1

**Date:** 2026-10-29. **Spec:** `website-redesign/handoff-bundle/HANDOFF.md` (NearRadar app design system). **Status:** foundations and checkpoint sections are done. **The rollout is waiting on a go-ahead.**

## Baseline (before this pass)

Lighthouse ran against a local server with brotli and cache headers, which is roughly what Vercel does. The same server served both the untouched copy and the changed tree.

| | Perf | A11y | Best pr. | SEO | LCP | CLS | Weight |
|---|---|---|---|---|---|---|---|
| Mobile, before | 70 | 100 | 96 | 100 | 10.5 s | 0 | 1,948 KiB |
| **Mobile, after** | **80** | 100 | **100** | 100 | **4.6 s** | 0.004 | **615 KiB** |
| Desktop, before | 96 | 100 | 96 | 100 | 1.4 s | 0 | 1,948 KiB |
| **Desktop, after** | **100** | 100 | **100** | 100 | **0.8 s** | 0.002 | **615 KiB** |

Headlines fit, and nothing scrolls horizontally, at 320, 360, 390, 768, 1024 and 1440px. There are no console errors. The 404 for `favicon.ico` is fixed.

## Drift found

`tokens.css` already matches the app. The drift comes from `ticket-theme.css`, which loads after the inline `near-final-design` block (which had already followed the spec) and overrides it:

| Drift | App value | Where |
|---|---|---|
| "Blue night" canvas: `--night-blue #122333`, 11 radial-gradient glows (`#213d54`, `#142432`, `rgba(61,116,158,…)`) | flat `--bg #0B0C0F`, no glows | `ticket-theme.css` |
| `--sky #9fd6ef` for focus rings, kickers and links | cream `--ink` | `ticket-theme.css` |
| Headlines in Unbounded 900 with `-.065 to -.08em` tracking. Word spaces collapse ("Findyour"). | Anton, uppercase | `ticket-theme.css` |
| Hidden `<br>`s ran words together ("plan.New", "kindof", "Aura.Make", "you.Find") | real line breaks / spaces | `ticket-theme.css`, `preview.css`, inline |
| Header CTA radius 10px | pill | `ticket-theme.css` |
| Rookie card `#ff4b45` | tier 3 `#E5484D` | inline `style` in `index.html` |
| Pickleball pin disc `#263a28` | sportGreen deep `#1E7D4A` | `ticket-theme.css` |
| Tinted greys `#c5c1ba #bdc8d0 #c5d9e5 #182531 #0c1017 #07090c` | `--ink-mid`, `--ink-2`, `--surface`, `--surface-2`, `--bg` | `ticket-theme.css` |
| Still hardcoded (rollout): footer pins, footer route glow, community message bubbles, legal pages | tokens | `ticket-theme.css` (46 hex / 49 rgba), `legal.css` (6 / 8), `index.html` (18) |

## What changed in this pass

All changes are additive or targeted. None of the existing uncommitted work in the tree was touched.

1. **`app-align.css` (new, loaded last).**
   - Remaps the ticket theme's variables to app tokens (`--night`, `--sky` and `--ticket-*` now resolve to `--bg`, `--ink` and `--paper*`). That one remap fixes every use of them.
   - Removes the glows.
   - Sets every page headline in Anton uppercase, with the red live-pill highlighter on "NEXT PLAN.".
   - Ticket titles keep Unbounded, tracked to `-.02em` so the word spaces survive.
   - Fixes the Rookie tier colour, the header pill, the focus rings and the mobile pin positions. The pins had been sitting on top of the headline.
   - **Removing the one `<link>` restores the previous look exactly.**
2. **Images.** Added sized WebP next to the originals and pointed `index.html` at them: 2,338 KB → 610 KB. The pin icons went from 500px PNGs to 160px WebP, about 150 KB → 5 KB each. The originals are still on disk.
3. **`index.html`.**
   - Store badges have a width and height (no layout shift).
   - The footer pin icons are sized and lazy.
   - The first gallery photo (the mobile LCP) loads eagerly with `fetchpriority="high"`.
   - Pin `aria-label`s now include their visible time ("Pickleball game, starts in 45m"), which fixes the label-in-name failure.
   - Added the favicon link.

## Legal pages (privacy, terms, community guidelines, account deletion)

All four pages share `legal.css`, which had the same drift as the home page:
- the blue glow behind the page;
- `--sky #9fd6ef` on the eyebrows and on table-of-contents hover;
- Unbounded headings at `-.075em` / `-.06em` tracking, which collapsed the word spaces ("HowNear", "Deleteyour");
- a 10px header CTA;
- nav link colours inverted compared with the home page;
- a blue mobile menu (`#182531`) and `#07090c` on mobile.

The body text also ran across a measure of about 950px on desktop.

What changed:
- **Edits to `legal.css`:**
  - H1 is Anton uppercase.
  - Section H2s are Nunito 800, tracked `-.01em`.
  - The reading column is capped at 720px. Body text is Nunito 500 17px in `--ink-mid`, with headings, `<strong>`, links and data labels in `--ink`.
  - The glow is gone. The header and the mobile menu match the aligned home page.
- **Font link on each page:** Anton added, Unbounded dropped (these pages no longer use it).
- **No legal text changed.** The visible text is byte-identical to the pre-edit copy on all four pages.

The pages fit at 390 and 1440px with no horizontal scroll and no failed requests. Left for the rollout: the footer badge (`#050608`) and the footer hairlines, which match the home footer and get tokenised with it.

## Next, after sign-off (Steps 4–5)

- **Consolidate CSS.** Merge `preview.css` (40 KB), `ticket-theme.css` (30 KB), the two inline `<style>` blocks and `app-align.css` into tokens → base → components → sections. Drop dead rules (Lighthouse reports 46 KB of unused CSS). This is the main remaining LCP cost: five render-blocking stylesheets account for 2.6 s of render delay.
- **JavaScript.** Defer the scripts and load GSAP/ScrollTrigger (116 KB) after first paint. Pause off-screen loops.
- **Tokenise the rest:** footer discovery map, community bubbles, and the footer badge and hairlines shared by the home and legal pages.
- **Buttons.** Ticket CTAs (`.event-cta`, `.community-apply`) are 9px radius in the ticket stock. Decide whether they become pills.
- **Responsive images.** Lighthouse estimates another 290 KB from `srcset`.

## Decisions needed

1. **Direction sign-off.** This overrides the "ticket visual system" Anitya built: Unbounded headlines, blue night. Is the app-aligned look (Anton, near-black, cream) the one to keep? Worth checking with Anitya before the rollout.
2. **Aura section.** Keep the current flip deck (4 tiers + a "locked" card)? Or add the app's full 8-tier ladder under it, as the spec suggests?
3. **App Store link.** The site links to `apps.apple.com/app/id679831337`, but NearEngine still uses a placeholder ID. Please confirm this is Near's real listing.
4. **`near-assets/vendor/three.min.js`** (670 KB) is untracked and not loaded by any page. Is it work in progress, or can it go?
5. **Event photography.** The stock photos are credited. Keep them as they are?

**Claims check:** the current copy has none of the statements flagged in HANDOFF.md §6 (SOS, women-only, ID check, leaderboard, travel, unsourced stats, real brands). The events are already labelled "Illustrative".
