---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: []
---

# Offer Desk app (all routes)

Mode: Operate. Seen live on a projector or screen share during a client demo; light theme, text 16px and up for reading, 14px only for table headers and small meta.

Audience and job: a sales rep turns a Pipedrive lead into a deal with a custom offer. Leads table → five-step wizard (lead, template, meeting notes, website, draft) → offer editor → convert to deal.

Proof the demo must give: the offer visibly comes from this company's meeting notes and website (sources panel: template, notes, page URLs, AI-extracted company notes), and AI waiting is never opaque (named stages, section counter).

Anti-goals: Pipedrive clone (no pipeline boards, no Pipedrive green), generic AI chat box, silent spinners, hidden sources.

Unresolved: none recorded; product facts live in PRODUCT.md.

## Direction contract

THESIS: The category-standard CRM workspace, played straight at Attio's level of craft. It refuses the two category traps: a Pipedrive look-alike built around pipeline boards, and an AI chat box with a prompt field.

OWN-WORLD: White work surface, a #FAFAFA sidebar, hairline #E7E7EA rules, ink #111827, one indigo accent #4F46E5 reserved for primary actions, selection and generation progress. Inter throughout, tabular numerals in tables. 6–8px radii, hairline tables with no zebra striping, quiet status pills (amber draft, green converted), lucide icons at 1.75 stroke.

STORY: The rep sees their leads, opens one into the wizard, checks template and notes, lets the site be read, watches the offer get written in named stages, sees exactly what it was built from, edits it, exports it, and converts the lead into a deal.

FIRST VIEWPORT: 240px sidebar on the left (workspace name, Leads / Offers / Templates with counts, Pipedrive connection status at the foot). Page header with title, record count and the primary action at the right ("Add lead"). Full-width sortable table, 52px rows, each with a visible "Create offer" button. On the draft step: stepper on top, markdown editor taking two thirds, sources panel at 360px on the right, action bar under the editor.

FORM: Category standard (the standing exit), taken by the user over the roll; signature interaction is the staged generation readout ("Reading 4 pages → Extracting company notes → Writing section 3 of 5: Scope") streaming into the editor. Motion: 160ms ease-out panels and a single progress bar. seed:a8e6996107831740

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
