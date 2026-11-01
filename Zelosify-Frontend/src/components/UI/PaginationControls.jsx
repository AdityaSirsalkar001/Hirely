"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PaginationControls({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  disabled = false,
  label = "items",
}) {
  const pages = Math.max(1, totalPages || 1);
  if (pages <= 1) return null;

  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label={`${label} pagination`}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-4"
    >
      <p className="text-xs text-muted-foreground">
        Showing {firstItem}–{lastItem} of {total} {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <span aria-live="polite" className="min-w-20 text-center text-xs font-medium text-muted-foreground">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={disabled || page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
