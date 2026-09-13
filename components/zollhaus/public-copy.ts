const PLACEHOLDER_PATTERN = /\[(?:PLATZHALTER|PLACEHOLDER)[^\]]*\]|NICHT PRODUKTIONSREIF|VOR LIVEGANG/i;

export function resolveZollhausNotice(value: string | undefined, fallback: string) {
  const normalized = value?.trim();

  if (!normalized || PLACEHOLDER_PATTERN.test(normalized)) {
    return fallback;
  }

  return normalized;
}