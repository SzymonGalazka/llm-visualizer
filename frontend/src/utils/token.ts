/**
 * Convert a raw SentencePiece token to a human-readable display string.
 * The leading ▁ (U+2581) marks a preceding space in SentencePiece vocabularies.
 */
export function formatToken(raw: string): string {
  return raw.replace(/^▁/, " ").trimStart() || raw;
}
