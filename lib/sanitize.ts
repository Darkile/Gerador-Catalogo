const EMOJI_REGEX = /[\p{Extended_Pictographic}\p{Emoji_Presentation}]/gu;

export function sanitizeAiText(input: string): string {
  return input
    .normalize("NFKC")
    .replace(EMOJI_REGEX, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeSizeList(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[^\dA-Za-zÀ-ÿ,\s]/g, "")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}
