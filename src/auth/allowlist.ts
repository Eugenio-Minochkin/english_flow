export function parseAllowedTelegramIds(value: string): Set<bigint> {
  return new Set(
    value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => BigInt(part))
  );
}

export function isTelegramUserAllowed(telegramId: number | bigint, allowedIds: Set<bigint>): boolean {
  return allowedIds.size > 0 && allowedIds.has(BigInt(telegramId));
}
