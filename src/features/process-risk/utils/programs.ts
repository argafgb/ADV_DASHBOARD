import type { ProgramId } from '../types';

export function slugifyProgram(name: string): ProgramId {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || UNCATEGORIZED_ID;
}

export const UNCATEGORIZED_ID: ProgramId = 'belum-dikategorikan';
export const UNCATEGORIZED_NAME = 'Belum dikategorikan';
export const UNCATEGORIZED_COLOR = 'var(--text-muted)';

export const PROGRAM_PALETTE = [
  '#2563eb',
  '#0d9488',
  '#7c3aed',
  '#0284c7',
  '#4f46e5',
  '#0891b2',
  '#8b5cf6',
  '#059669',
  '#3b82f6',
  '#0f766e',
  '#6d28d9',
  '#0ea5e9',
  '#1d4ed8',
  '#14b8a6',
  '#6366f1',
  '#155e75',
  '#4338ca',
  '#475569',
] as const;

function hashOf(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function preferredColorIndex(id: ProgramId): number {
  return hashOf(id) % PROGRAM_PALETTE.length;
}

export function assignProgramColors(ids: ProgramId[]): Map<ProgramId, string> {
  const colors = new Map<ProgramId, string>();
  const taken = new Set<number>();
  const ordered = [...new Set(ids)].sort((a, b) => a.localeCompare(b, 'en'));

  for (const id of ordered) {
    if (id === UNCATEGORIZED_ID) {
      colors.set(id, UNCATEGORIZED_COLOR);
      continue;
    }
    const start = preferredColorIndex(id);
    let slot = start;
    for (let step = 0; step < PROGRAM_PALETTE.length && taken.has(slot); step += 1) {
      slot = (start + step + 1) % PROGRAM_PALETTE.length;
    }
    taken.add(slot);
    colors.set(id, PROGRAM_PALETTE[slot] as string);
  }

  return colors;
}

export function routeForProgram(id: ProgramId): string {
  return `/dashboard/process-risk/program/${id}`;
}
