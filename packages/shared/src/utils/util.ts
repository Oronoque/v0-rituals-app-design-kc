export function toNull<T>(data: T | undefined | null): T | null {
  return data ?? null;
}

export function transform<T>(data: T): T {
  return data;
}

// Instead of inline Object.fromEntries everywhere
export function createIdMap<T extends { id: string }>(
  items: T[]
): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}
