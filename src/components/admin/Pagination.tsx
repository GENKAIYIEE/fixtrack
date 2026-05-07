'use client';

import React from 'react';

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  const start = Math.min((page - 1) * limit + 1, total);
  const end = Math.min(page * limit, total);

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [];
    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, 'ellipsis', totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  const btnBase =
    'min-w-[36px] h-9 flex items-center justify-center rounded-md text-sm font-medium transition-colors';
  const activeCls = `${btnBase} bg-[#1E3A8A] text-white`;
  const inactiveCls = `${btnBase} text-slate-600 hover:bg-[#e3e1e9]`;
  const navCls = `${btnBase} border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed px-2`;

  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200/30 bg-[#faf8ff]">
      {/* Results text */}
      <p className="text-sm text-[#444651]">
        Showing{' '}
        <span className="font-semibold text-slate-800">{start}</span>
        {' '}to{' '}
        <span className="font-semibold text-slate-800">{end}</span>
        {' '}of{' '}
        <span className="font-semibold text-slate-800">{total}</span>
        {' '}results
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={navCls}
          aria-label="Previous page"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span
              key={`ellipsis-${i}`}
              className="min-w-[36px] h-9 flex items-center justify-center text-slate-400 text-sm"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={p === page ? activeCls : inactiveCls}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={navCls}
          aria-label="Next page"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
