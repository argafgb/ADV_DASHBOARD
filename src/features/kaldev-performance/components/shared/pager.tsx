"use client";

/** `Pagination` design system (`.dd-pager`): ‹ 1 2 3 4 5 … 203 › */
export function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages: (number | "gap")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) pages.push(i);
  } else if (page <= 4) {
    pages.push(1, 2, 3, 4, 5, "gap", totalPages);
  } else if (page >= totalPages - 3) {
    pages.push(1, "gap", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, "gap", page - 1, page, page + 1, "gap", totalPages);
  }

  return (
    <nav className="dd-pager" aria-label="Pagination">
      <button
        type="button"
        className="dd-pager__btn"
        disabled={page <= 1}
        aria-label="Halaman sebelumnya"
        onClick={() => onChange(page - 1)}
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="dd-pager__gap">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={`dd-pager__btn${p === page ? " dd-pager__btn--active" : ""}`}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        className="dd-pager__btn"
        disabled={page >= totalPages}
        aria-label="Halaman berikutnya"
        onClick={() => onChange(page + 1)}
      >
        ›
      </button>
    </nav>
  );
}
