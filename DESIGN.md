---
name: Offer Desk
description: Turn Pipedrive leads into deals with custom offers.
colors:
  bg: "#ffffff"
  sidebar: "#fafafa"
  subtle: "#f4f4f5"
  hover: "#f4f4f6"
  row-hover: "#fafafb"
  line: "#e7e7ea"
  line-strong: "#d4d4d8"
  ink: "#111827"
  ink-2: "#374151"
  muted: "#5b6270"
  accent: "#4f46e5"
  accent-hover: "#4338ca"
  accent-soft: "#eef0fe"
  accent-ink: "#3730a3"
  accent-ring: "#dcdcfb"
  amber-soft: "#fdf3d8"
  amber-ink: "#8a4b08"
  green-soft: "#e3f6e9"
  green-ink: "#17663a"
  red-soft: "#fdecec"
  red-ink: "#b42318"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    letterSpacing: "-0.015em"
  title-page:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"cv11\", \"ss01\""
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
  meta:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  mono:
    fontFamily: "ui-monospace, \"SF Mono\", Menlo, monospace"
    fontSize: "15px"
    lineHeight: 1.7
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  gutter: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.bg}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.hover}"
  button-ghost:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.hover}"
  button-sm:
    typography: "{typography.meta}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "32px"
  input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "40px"
  pill-draft:
    backgroundColor: "{colors.amber-soft}"
    textColor: "{colors.amber-ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "24px"
  pill-converted:
    backgroundColor: "{colors.green-soft}"
    textColor: "{colors.green-ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "24px"
  pill-neutral:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.ink-2}"
    typography: "{typography.meta}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "24px"
  nav-item:
    textColor: "{colors.ink-2}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "40px"
  nav-item-active:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
  table-header:
    textColor: "{colors.muted}"
    typography: "{typography.meta}"
    height: "44px"
  table-row:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    height: "52px"
  table-row-hover:
    backgroundColor: "{colors.row-hover}"
  step-current:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    height: "56px"
  to-confirm-mark:
    backgroundColor: "{colors.amber-soft}"
    textColor: "{colors.amber-ink}"
    rounded: "{rounded.sm}"
    padding: "1px 4px"
  sheet:
    backgroundColor: "{colors.bg}"
    width: "460px"
---

# Design System: Offer Desk

## Overview

**Creative North Star: "The Straight-Played CRM Workspace"**

Offer Desk is the category-standard SaaS CRM workspace, done straight at Attio's level of craft. A white work surface sits beside a barely-grey sidebar; hairline rules, not boxes, organise the page; one indigo accent marks the thing to press, the thing chosen, and the thing in progress. Everything else is ink on white. It is read on a projector or screen share during a client demo, so text never drops below 14px and the theme is light only.

Density is that of a working tool: 52px table rows, 40px controls, a 32px page gutter. The system's one signature is the staged generation readout (a named-stage trail with a thin accent progress bar) that streams the offer into the editor, beside a sources panel that shows what the offer was built from. It rejects the two category traps named in the direction: a Pipedrive look-alike built on pipeline boards and Pipedrive green, and an AI chat box with a prompt field.

**Key Characteristics:**
- White surface, #fafafa sidebar and sources panel, hairline #e7e7ea rules.
- One indigo accent, rationed to primary actions, selection, focus and progress.
- Inter throughout with cv11/ss01, tabular numerals in tables and counts.
- Gentle 8px corners on controls and cards, 6px on pills and segments.
- Flat surfaces with hairline 1px lifts; only the side sheet floats.
- Quiet tonal status pills: amber draft, green converted.
- Lucide line icons at 1.75 stroke.

## Colors

A cool neutral ramp from white to near-black ink, one saturated indigo, and three soft tonal pairs that carry status.

### Primary
- **Working Indigo** (accent, #4f46e5): the primary button fill, the selected radio row border and tint, done and current step circles, the generation progress bar, the active nav icon, the caret, and the 2px focus outline. Darkens to **Pressed Indigo** (accent-hover, #4338ca) on hover.
- **Indigo Wash** (accent-soft, #eef0fe): background of the current wizard step and selected radio rows; **Indigo Ink** (accent-ink, #3730a3) is text set on that wash and the live "Writing ..." line.
- **Indigo Halo** (accent-ring, #dcdcfb): text selection highlight and the 4px ring around the current step number.

### Neutral
- **Paper White** (bg, #ffffff): the work surface, inputs, cards, secondary buttons, the sheet.
- **Rail Grey** (sidebar, #fafafa): the sidebar and the sources panel, the two supporting columns.
- **Quiet Fill** (subtle, #f4f4f5): neutral pills, skeletons, the segmented control track, progress track, inline code.
- **Hover Grey** (hover, #f4f4f6): hover fill for buttons, nav items and icon buttons. **Row Whisper** (row-hover, #fafafb) is the fainter hover for table rows.
- **Hairline** (line, #e7e7ea): every divider, table rule, card border and panel edge. **Firm Hairline** (line-strong, #d4d4d8): input and secondary button strokes, empty radio rings, stepper connectors, scrollbars.
- **Ink** (ink, #111827): headings and primary text. **Ink Two** (ink-2, #374151): body copy in secondary positions, field labels, nav labels. **Muted Slate** (muted, #5b6270): table headers, counts, timestamps, hints, inactive icons.

### Status
- **Draft Amber** (amber-soft, #fdf3d8 / amber-ink, #8a4b08): draft pills and the "to confirm" marks in offer previews.
- **Converted Green** (green-soft, #e3f6e9 / green-ink, #17663a): converted pills and done checks in the generation readout.
- **Alert Red** (red-soft, #fdecec / red-ink, #b42318): error banners, danger buttons, delete confirmations.

### Named Rules
**The One Accent Rule.** Indigo appears only on a primary action, a current selection, keyboard focus or generation progress. Never on decoration, headings, links in chrome, or more than one primary button per view.

**The Tonal Status Rule.** Status is a soft tinted fill with a dark same-hue ink (24px pill, 6px corners). No saturated status fills, no outlined status badges.

## Typography

**Body Font:** Inter via next/font (with ui-sans-serif, system-ui, sans-serif)
**Label/Mono Font:** ui-monospace, SF Mono, Menlo for the markdown editors only

**Character:** One neutral grotesque doing every job, tuned with cv11 and ss01 alternates and tight negative tracking on titles. Hierarchy comes from size and weight steps, never from a second family.

### Hierarchy
- **Display** (650, 28px, 1.2, -0.015em): the offer or template title inside rendered markdown previews; balanced wrapping.
- **Headline** (600, 24px, -0.015em): wizard step titles.
- **Page Title** (600, 22px, -0.015em): page headers, followed by a 16px muted tabular record count.
- **Title** (600, 18px): sheet and empty-state titles. Rendered offer h2 sits at 19px / 620, h3 at 16px / 620.
- **Body** (400, 16px, 1.5): the default for table cells, nav items, inputs and paragraphs. Rendered offers use 1.65 line height capped at 72ch.
- **Label** (500, 15px): button text, field labels, step names, segmented tabs, and secondary lines (note text, page URLs, status text in action bars). The mono editors also set 15px at 1.7.
- **Meta** (500 or 400, 14px): table headers, pills, small buttons, counts, timestamps, hints, sources-panel section headings.

The direction named only 16px and 14px; the build added the 15px control-and-secondary tier, and it is the shipped rule.

### Named Rules
**The Projector Floor Rule.** No text below 14px anywhere in the app. 14px is reserved for headers, pills and meta; reading text is 16px.

**The Tabular Count Rule.** Every count, money value and date in a table or list uses tabular numerals.

## Layout

A fixed left sidebar (240px with labels and counts; collapses to a 64px icon rail below 1024px) and a fluid main column. Pages open with a 64px header bar (title and count left, actions right) over a hairline, then content on a 32px horizontal gutter. Index pages are full-width tables: 44px header row, 52px body rows, first and last cells padded to the 32px gutter, lower-priority columns hidden at small, medium and extra-large breakpoints.

The draft step and the offer editor use a two-column grid at 1024px and up: the editor or preview takes the remaining width, the sources panel a fixed 360px on the right. Below 1024px the sources panel drops beneath the editor as a 32vh scrolling strip. Toolbars above editors are 48px; action bars below them are 72px. The selection steps sit in a centred 1080px container: the lead step pairs the list with a 340px detail column on the right, the template step puts a 360px list on the left of its preview, the notes step caps at 820px and the website step at 980px.

Spacing steps observed: 8, 12, 16, 24 and 32px, with 2-6px gaps inside dense lists.

## Elevation & Depth

Flat by default, with depth from tonal columns (white versus #fafafa) and hairlines. Controls carry a near-invisible 1px lift so they read as pressable; the only floating surface is the right-hand sheet over a light ink scrim.

### Shadow Vocabulary
- **Control lift** (`box-shadow: 0 1px 2px rgba(17,24,39,0.05)`): secondary buttons, empty-state icon tile, note cards. Inputs use 0.04, the active segment 0.08, the primary button 0.12.
- **Active nav** (`box-shadow: 0 1px 2px rgba(17,24,39,0.06), 0 0 0 1px #e7e7ea`): the current sidebar item, a white chip lifted off the rail.
- **Sheet** (`box-shadow: 0 12px 40px rgba(17,24,39,0.14)`): the side sheet only, over a `rgba(17,24,39,0.18)` scrim.
- **Input focus** (`box-shadow: 0 0 0 3px rgba(79,70,229,0.15)`): with the border turning indigo.
- **Selected row ring** (`box-shadow: 0 0 0 1px #4f46e5`): doubles the indigo border on a chosen radio row.

### Named Rules
**The One Float Rule.** Only the side sheet floats. Everything else is flat or carries the 1px control lift; no cards with large soft shadows.

## Shapes

Gently curved rectangles. 8px on buttons, inputs, cards, radio rows, nav items, step buttons and the segmented track; 6px on pills, skeletons, segment buttons and the focus outline; 4px on small inline icon buttons, inline code and the "to confirm" mark; full rounds only on status dots, step numbers, radio dots and the progress bar. Borders are 1px hairlines; blockquotes and panel edges use a single 1px rule, never a thick accent bar.

## Components

### Buttons
Restrained and solid, colour-only transitions at 150ms.
- **Shape:** gently curved (8px), 40px tall with 16px sides, or 32px small with 12px sides.
- **Primary:** indigo fill and border, white 15px / 500 text, control lift; hover darkens to pressed indigo.
- **Secondary:** white with a firm hairline stroke, ink text; hover fills hover grey. This is the default variant, including the per-row "Create offer" button.
- **Ghost:** transparent, ink-two text, hover grey on hover; used for toolbar actions (Copy, Markdown, PDF).
- **Danger:** white with firm hairline and alert-red text; hover fills red-soft.
- **Loading / Disabled:** a spinning lucide loader precedes the label; disabled drops to 50% opacity.

### Chips / Pills
- **Style:** 24px tall, 6px corners, 8px sides, 14px / 500, tonal fill with same-hue ink.
- **Tones:** neutral, draft (amber), converted (green), accent, error.

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** white on white surfaces or on the rail-grey sources panel.
- **Shadow Strategy:** flat or control lift (see Elevation).
- **Border:** 1px hairline.
- **Internal Padding:** 12px by 10px for note cards; 16px by 14px for radio rows.

### Inputs / Fields
- **Style:** 40px, white, firm hairline, 8px corners, 16px text, 12px sides, faint lift. Labels above at 15px / 500 ink-two, hints below at 14px muted.
- **Focus:** border turns indigo with a 3px 15% indigo halo; the caret is indigo.
- **Error:** form-level errors use the error banner (red-soft, red-ink, 8px corners, alert icon, "Try again").

### Navigation
- **Sidebar:** rail grey with a hairline right edge; a 28px ink monogram tile and the product name; items 40px, 16px text, 18px icons at 1.75 stroke. Inactive items are ink-two with muted icons and hover grey; the active item is a white lifted chip with ink text and an indigo icon. Counts sit right in 14px muted tabular figures. The foot carries the Pipedrive connection: a status dot (green #22a05a or red #d92d20), a 14px status line and the domain.
- **Below 1024px:** 64px icon rail, labels become screen-reader only, counts and connection foot hide.
- **Segmented control:** quiet-fill track with 2px inset; the selected 32px segment is white with a 0.08 lift.

### Tables
Hairline rows, no zebra striping, no vertical rules. Sortable headers are 14px / 500 muted buttons; the active column turns ink and shows a 14px arrow. Rows hover to row whisper at 100ms and open the record on click.

### Wizard Stepper
Five steps in one row of 56px buttons. Number circles are 28px: done steps are indigo with a white check, the current step is indigo with a 4px indigo-halo ring on an indigo-wash button, future steps are white with a firm hairline and muted number. Done steps show a 14px muted summary and are clickable; 24px connectors turn indigo once passed.

### Generation Readout (signature)
A 15px trail of named stages separated by chevrons: green checks for done, an indigo spinner and medium ink label for the active stage, a red alert for failure. Below it a 4px quiet-fill track with an indigo bar that slides indeterminately while preparing and fills by section count (500ms) while writing. The offer streams into the preview with a pulsing 2px indigo caret and an indigo-ink "Writing <section>..." line.

### Sources Panel
"Built from": a 360px rail-grey column of hairline-separated sections (Template, Meeting notes, Website pages, Company notes from the website), each headed by a 16px muted icon and a 14px / 500 muted title with a tabular count. Notes are white hairline cards clamped to three lines with a "Show the whole note" underline toggle; page URLs are ink-two links with a firm-hairline underline that darkens on hover.

### To-Confirm Mark
Details the AI could not ground are wrapped as `[to confirm: ...]` and rendered as an amber-soft highlight with amber ink, 4px corners and 1px by 4px padding, cloned across line breaks.

### Side Sheet
460px from the right with a hairline left edge, a 64px header (18px title, 36px close button), 24px body padding and a hairline-topped footer of right-aligned buttons. Enters with a 24px slide and fade over 200ms on an expo ease-out; the scrim fades in over 160ms.

## Do's and Don'ts

### Do:
- **Do** keep indigo (#4f46e5) to one primary action per view plus selection, focus and progress states.
- **Do** separate content with 1px #e7e7ea hairlines and tonal columns (#ffffff work surface, #fafafa supporting rails).
- **Do** set reading text at 16px, controls and secondary lines at 15px, and only headers, pills and meta at 14px.
- **Do** use tabular numerals for every count, value and date.
- **Do** use lucide line icons at 1.75 stroke (2 to 2.5 only for small checks, arrows and spinners).
- **Do** name what the AI is doing in stages with a determinate progress bar; show sources beside every generated offer.
- **Do** honour reduced motion: all animation and transition durations clamp to 1ms.

### Don't:
- **Don't** add a dark theme; the product is light only (`color-scheme: light`) for projector use.
- **Don't** use zebra striping or vertical rules in tables.
- **Don't** set any text below 14px.
- **Don't** use Pipedrive green as a brand colour or build pipeline boards; green is a status tint only.
- **Don't** show a silent spinner for AI work or present generation as a chat box with a prompt field.
- **Don't** float anything except the side sheet; no large soft card shadows.
- **Don't** use saturated fills for status; status is always soft tint plus dark ink.
