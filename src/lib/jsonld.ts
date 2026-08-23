/**
 * Safely serializes a JSON-LD payload for embedding inside
 * `<script type="application/ld+json">`.
 *
 * JSON.stringify leaves "<" untouched, so any user-generated string containing
 * `</script>` would terminate the element early and allow stored XSS.
 * Escaping "<" as < keeps the JSON semantically identical while making
 * breakout impossible.
 */
export function serializeJsonLd(payload: unknown): string {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}
