'use client';

import React from 'react';

interface AuditLogsPaginationProps {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export default function AuditLogsPagination({ pagination, onPageChange }: AuditLogsPaginationProps) {
  const { total, page, limit, totalPages } = pagination;
  
  if (total === 0) return null;

  const startIdx = (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="border-t border-outline-variant bg-surface-container-lowest px-4 py-3 flex items-center justify-between">
      <div className="font-body-sm text-body-sm text-on-surface-variant">
        Showing {startIdx} to {endIdx} of {total} logs
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1 rounded text-outline hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="Previous page"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>

        {getPageNumbers().map((p, idx) => (
          <button
            key={idx}
            onClick={() => typeof p === 'number' && onPageChange(p)}
            disabled={typeof p === 'string'}
            className={`w-8 h-8 rounded flex items-center justify-center font-label-md text-label-md transition-colors ${
              p === page
                ? 'bg-primary text-on-primary'
                : typeof p === 'number'
                ? 'text-on-surface hover:bg-surface-container-high'
                : 'text-outline cursor-default'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1 rounded text-outline hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="Next page"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
