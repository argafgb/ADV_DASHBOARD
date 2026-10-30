/** "Ilham Nur" -> "IN", "Deny" -> "DE" (exact port of the mockup rule). */
export function initialsOf(name: string): string {
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0] ?? "??";
  const raw = parts.length > 1 ? `${first[0]}${parts[1]![0]}` : first.slice(0, 2);
  return raw.toUpperCase();
}

/** Short label of a certification: text in parentheses, else the first word. */
export function shortCertName(fullName: string): string {
  const match = fullName.match(/\(([^)]+)\)/);
  return match ? match[1]! : fullName.split(" ")[0]!;
}
