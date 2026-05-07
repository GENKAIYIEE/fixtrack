import React from 'react';

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsersPaginationProps {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
}

export default function UsersPagination({
  pagination,
  onPageChange,
}: UsersPaginationProps) {
  const { total, page, limit, totalPages } = pagination;

  const startEntry = total === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, total);

  // Generate page numbers to show with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="bg-surface-container-lowest px-6 py-4 border-t border-outline-variant flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="font-body-sm text-body-sm text-outline">
        Showing {startEntry} to {endEntry} of {total} entries
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>

        {pages.map((p, idx) => (
          typeof p === 'number' ? (
            <button
              key={idx}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
                page === p
                  ? 'bg-secondary text-on-secondary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={idx} className="w-8 h-8 flex items-center justify-center text-on-surface-variant text-sm">
              {p}
            </span>
          )
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
