import "server-only";
import { PipedriveError } from "./pipedrive";

export function errorResponse(e: unknown): Response {
  const status = e instanceof PipedriveError ? (e.status >= 400 && e.status < 600 ? e.status : 502) : 500;
  const message = e instanceof Error ? e.message : "Something went wrong.";
  return Response.json({ error: message }, { status });
}

/** Streams newline-delimited JSON events; the writer function sends events through `send`. */
export function ndjson(run: (send: (event: unknown) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  let cancelled = false;
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        if (!cancelled) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        await run(send);
      } catch (e) {
        send({ type: "error", message: e instanceof Error ? e.message : "Something went wrong." });
      } finally {
        if (!cancelled) controller.close();
      }
    },
    cancel() {
      cancelled = true;
    },
  });
  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  });
}
