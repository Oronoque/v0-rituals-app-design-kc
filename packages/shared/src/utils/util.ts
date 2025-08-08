export function toNull<T>(data: T | undefined | null): T | null {
  return data ?? null;
}

export function transform<T>(data: T): T {
  return data;
}
