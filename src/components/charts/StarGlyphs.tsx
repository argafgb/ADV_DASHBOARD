import { C } from "@/lib/utils";

/** Bentuk bintang yang sama untuk semua baris rating. */
const STAR_PATH =
  "m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

/** Row of 5 SVG stars with partial gradient fill (source `starRow`). */
export function StarRow({
  full,
  size,
  uid,
}: {
  full: number;
  size: number;
  uid: string;
}) {
  const fl = Math.floor(full);
  const partial = full - fl;
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const f = i < fl ? 1 : i === fl ? partial : 0;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24">
            <defs>
              <linearGradient id={uid + i}>
                <stop offset={f * 100 + "%"} stopColor={C.amber} />
                <stop offset={f * 100 + "%"} stopColor="#E5E7EB" />
              </linearGradient>
            </defs>
            <path d={STAR_PATH} fill={`url(#${uid + i})`} />
          </svg>
        );
      })}
    </>
  );
}

/**
 * Lima bintang SVG: `n` bintang terisi kuning dan sisanya garis abu-abu.
 * Dipakai sebagai pengganti karakter ★/☆, yang tidak ada di Plus Jakarta Sans
 * sehingga dulu tampil dengan font simbol bawaan sistem.
 */
export function StarIcons({ n, size }: { n: number; size: number }) {
  return (
    <span
      role="img"
      aria-label={`${n} dari 5 bintang`}
      className="inline-flex items-center gap-px whitespace-nowrap align-middle"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d={STAR_PATH}
            fill={i < n ? "#F59E0B" : "none"}
            stroke={i < n ? "none" : "#D1D5DB"}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}

/** Baris bintang rating atau "No Rating" merah (source `starGlyphs`). */
export function StarGlyphs({ n }: { n: number }) {
  if (n === 0)
    return (
      <span className="text-[10px] font-semibold text-[#DC2626]">
        No Rating
      </span>
    );
  return <StarIcons n={n} size={12} />;
}
