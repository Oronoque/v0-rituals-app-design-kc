import { ZodError } from "zod";
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

export function prettifyError(error: ZodError): string {
  const lines: string[] = [];
  // sort by path length
  const issues = [...error.issues].sort(
    (a, b) => (a.path ?? []).length - (b.path ?? []).length
  );

  // Process each issue
  for (const issue of issues) {
    lines.push(`✖ ${issue.message}`);
    if (issue.path?.length) lines.push(`  → at ${toDotPath(issue.path)}`);
  }

  // Convert Map to formatted string
  return lines.join("\n");
}

export function toDotPath(
  _path: readonly (string | number | symbol)[]
): string {
  const segs: string[] = [];
  const path: PropertyKey[] = _path.map((seg: any) =>
    typeof seg === "object" ? seg.key : seg
  );
  for (const seg of path) {
    if (typeof seg === "number") segs.push(`[${seg}]`);
    else if (typeof seg === "symbol")
      segs.push(`[${JSON.stringify(String(seg))}]`);
    else if (/[^\w$]/.test(seg)) segs.push(`[${JSON.stringify(seg)}]`);
    else {
      if (segs.length) segs.push(".");
      segs.push(seg);
    }
  }

  return segs.join("");
}
