# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (user's choice).

- Pipedrive API: system of record for leads, deals, and meeting notes (Pipedrive notes on the lead). Key in `PIPEDRIVE_API_KEY`.
- SQLite: local storage for offer templates and saved custom offer drafts.
- LLM: OpenAI-compatible endpoint configured by `OPENAI_API_KEY` and `OPENAI_BASE_URL`. API keys stay server-side.
- Deploy target: runs locally only.

## Users

A sales rep working their own pipeline day to day. They have a lead and need to turn it into a deal with an offer tailored to that company, without opening Pipedrive or writing the offer from scratch.

## Product Purpose

Turns Pipedrive leads into deals, each with a custom offer. The rep picks a lead, an offer template, and the relevant meeting notes, and can optionally add the company's website. The app then rewrites the template into a custom offer draft based on what is known about the company from the notes and the website. Success means the rep gets a credible offer specific to that company in minutes and the lead becomes a deal in Pipedrive.

This is a demo shown to a client. The UI and the generated offers are in English.

## Positioning

Offers are written from the rep's own approved templates, grounded in that lead's actual meeting notes and the company's own website, so they are not generic AI copy. The whole lead → offer → deal flow happens in one place, and Pipedrive stays the system of record.

## Operating Context

Core workflow, in order:
1. Select a lead (from Pipedrive), or add a new one in the app.
2. Select an offer template (from the app's template database).
3. Select meeting notes (Pipedrive notes on that lead).
4. Enter the company's website address (optional).
5. Generate a custom offer draft.

After drafting:
- Edit the draft in the app, then copy or export it.
- Save the draft in the app's database.
- Convert the lead to a deal in Pipedrive.

## Capabilities and Constraints

- Read leads and their notes from Pipedrive.
- Add a new lead from inside the app. It is created in Pipedrive through the API, so the rep never has to open Pipedrive.
- Add a meeting note to a lead from inside the app; it is saved to Pipedrive.
- Create, edit and select offer templates in the app (markdown, stored in SQLite).
- Scrape the company website (homepage plus up to three linked pages). The AI extracts notes about the company from those pages; the offer's sources are shown as the page URLs plus those extracted notes.
- Generate the custom offer with the LLM from template + meeting notes + extracted company notes.
- Edit drafts in the app; export as markdown or PDF; drafts are saved to SQLite with status (draft / converted) and the sources used.
- Convert a lead to a deal in Pipedrive, attaching the offer to the deal as both a note and a PDF file.

Terminology: lead, deal, offer template, meeting notes, custom offer draft.


## Brand Commitments

Neutral: no client or seller brand, and no real company name in the product.

Standing preference (user's choice, 2026-10-26): the category-standard look for a SaaS CRM tool, done straight. Attio's level of craft is the bar.

## Evidence on Hand

- No real offer templates. The demo ships with a few clearly labeled placeholder templates written for the demo.
- No real meeting notes, offers, customers, testimonials, or pricing exist. Don't fabricate them as real. Live data comes from the connected Pipedrive account.
- The Pipedrive account was empty at build time. With the user's approval, a handful of fictional demo leads with meeting notes are created there, each title marked `[Sample]`.

## Product Principles

1. Every draft is grounded in real inputs: the chosen template, that lead's meeting notes, and the company's website. Don't invent facts about the company.
2. Pipedrive stays the system of record for leads, deals, and notes. The app keeps only what Pipedrive doesn't hold (templates, drafts).
3. The rep never has to leave the tool: from adding a lead to converting it into a deal.
4. The AI output is a draft the rep edits and owns, never a final send.
