export function resolveViewData<T>(
  usesInitialData: boolean,
  initialData: T | undefined,
  requestData: T | null,
  fallback: T,
): T {
  return (usesInitialData ? initialData : requestData) ?? fallback;
}

export interface DetailIdentity {
  site: string;
  region: string;
  type: string;
  month: string;
}

export function matchesDetailIdentity(
  detail: DetailIdentity | null,
  selected: DetailIdentity,
): boolean {
  return (
    detail?.site === selected.site &&
    detail.region === selected.region &&
    detail.type === selected.type &&
    detail.month === selected.month
  );
}
