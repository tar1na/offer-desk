# Offer Desk

Turns Pipedrive leads into deals with a custom offer. Pick a lead, an offer template, the meeting notes and (optionally) the company website; the AI rewrites the template for that company. Edit the draft, export it as markdown or PDF, and convert the lead to a deal in Pipedrive with the offer attached as a note and a PDF.

- **Leads** come straight from Pipedrive. Add a lead in the app and it is created there.
- **Wizard:** lead → template → meeting notes (pick or add; notes are saved to Pipedrive) → website → draft. The website step reads the homepage and up to three linked pages and the AI writes down facts about the company.
- **Offers** open in an editor next to a "Built from" panel listing the template, notes, page URLs and company notes the draft came from. Anything the AI could not fill in is marked "to confirm".
- **Templates** are markdown, edited in the app with a live preview.

Built to run locally as a demo. Product context lives in `PRODUCT.md`, the design system in `DESIGN.md`.

## Requirements

- Node.js 22.13 or newer (uses the built-in `node:sqlite`)
- A Pipedrive account and API token
- An OpenAI-compatible API endpoint and key

## Run

```sh
npm install
cp .env.example .env   # then fill in the keys
npm run dev            # http://localhost:3000
```

| Variable | What it is |
| --- | --- |
| `PIPEDRIVE_API_KEY` | Pipedrive API token |
| `OPENAI_API_KEY` | Key for the OpenAI-compatible endpoint |
| `OPENAI_BASE_URL` | Endpoint URL |
| `OPENAI_MODELS` | Optional. Comma-separated models, tried in order. Default `gpt-6-luna,gpt-5.4,gpt-5.4-mini` |
| `OPENAI_FIRST_TOKEN_MS` | Optional. How long a model may take to start answering before the next one is tried. Default `15000` |

Templates and offers are stored in `data/offerdesk.db` (SQLite, created on first run with four sample templates). Delete the file to start over.

## Demo data

```sh
node --env-file=.env scripts/seed-pipedrive.mjs
```

Creates five fictional `[Sample]` leads with contacts and meeting notes in your Pipedrive account. It skips leads that already exist. Converting a lead to a deal in the app writes to Pipedrive, so use a sandbox or demo account if you don't want test deals in your real pipeline.

## License

[0BSD](LICENSE): use it for anything, no attribution required.
