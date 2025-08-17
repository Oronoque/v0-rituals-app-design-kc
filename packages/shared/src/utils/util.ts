import { PhysicalQuantity } from "../database-types";

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

/**
 * Convert from display unit → SI base unit
 */
export function toSI(value: number, unit: PhysicalQuantity): number {
  return (
    value * unit.conversion_factor * Math.pow(10, unit.conversion_exponent)
  );
}

/**
 * Convert from SI base unit → display unit
 */
export function fromSI(value: number, unit: PhysicalQuantity): number {
  return (
    value / (unit.conversion_factor * Math.pow(10, unit.conversion_exponent))
  );
}
