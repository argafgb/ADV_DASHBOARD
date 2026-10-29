export function validateRatingPeriod(startDate = "", endDate = ""): string | null {
  if (!startDate && !endDate) return null;
  if (!startDate || !endDate) return "Pilih tanggal mulai dan tanggal selesai.";
  const valid = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!valid(startDate) || !valid(endDate)) return "Tanggal periode tidak valid.";
  if (startDate > endDate) return "Tanggal selesai harus sama atau setelah tanggal mulai.";
  return null;
}
