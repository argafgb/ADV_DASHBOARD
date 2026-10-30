/**
 * Chip delta pada mockup — `DeltaChip` + `.dd-delta__arrow`.
 *
 * `direction` menentukan arah panah (ke mana angkanya bergerak), `tone`
 * menentukan warnanya (apakah pergerakan itu baik). Keduanya sengaja dipisah:
 * biaya yang naik bergerak ke atas tapi maknanya buruk.
 */
export function DeltaChip({
  direction,
  tone,
  onAccent = false,
  children,
}: {
  direction: "up" | "down";
  tone: "up" | "down" | "flat";
  /** Di atas kartu beraksen, chip memakai varian transparan putih. */
  onAccent?: boolean;
  children: React.ReactNode;
}) {
  const up = direction !== "down";
  return (
    <span
      className={`dd-delta ${onAccent ? "dd-delta--on-accent" : `dd-delta--${tone}`}`}
    >
      <span className="dd-delta__arrow">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d={up ? "M7 17 17 7" : "M7 7 17 17"} />
          <path d={up ? "M9.5 7H17v7.5" : "M17 9.5V17H9.5"} />
        </svg>
      </span>
      {children}
    </span>
  );
}
