import type { z } from "zod";

export type ActionFailure = { ok: false; error: string; fieldErrors?: Record<string, string> };

export type ActionResult<T = undefined> =
  | ({ ok: true } & ([T] extends [undefined] ? { data?: undefined } : { data: T }))
  | ActionFailure;

/** Any action result, when only success or failure matters. */
export type AnyActionResult = { ok: true } | ActionFailure;

/** First message per field, keyed by dotted path ("nav_links.0.href"). */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    out[key] ??= issue.message;
  }
  return out;
}
