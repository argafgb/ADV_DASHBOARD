import Link from "next/link";

export interface SegmentedItem {
  value: string;
  label: string;
  href: string;
}

/**
 * Kontrol segmen pada kepala kartu (`.dd-seg`): jalur cekung dengan opsi aktif
 * berupa pil aksen. Tiap opsi adalah tautan supaya state-nya ada di URL.
 */
export function SegmentedTabs({ items, value }: { items: SegmentedItem[]; value: string }) {
  return (
    <div className="dd-seg" role="tablist">
      {items.map((o) => (
        <Link
          key={o.value}
          href={o.href}
          role="tab"
          aria-selected={o.value === value}
          className={`dd-seg__btn${o.value === value ? " dd-seg__btn--active" : ""}`}
          scroll={false}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
