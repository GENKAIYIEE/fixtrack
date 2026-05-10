interface TasksPaginationProps {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export default function TasksPagination({
  total,
  page,
  limit,
  totalPages,
  onPageChange
}: TasksPaginationProps) {
  const startEntry = total === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="bg-surface-container-lowest px-6 py-4 border-t border-surface-variant flex items-center justify-between">
      <div className="font-body-sm text-on-surface-variant">
        Showing <span className="font-bold text-on-surface">{startEntry}</span> to{' '}
        <span className="font-bold text-on-surface">{endEntry}</span> of{' '}
        <span className="font-bold text-on-surface">{total}</span> entries
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-outline hover:bg-surface-container hover:text-on-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        
        {getPageNumbers().map((p, index) => (
          typeof p === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg font-label-md transition-colors ${
                page === p
                  ? 'bg-secondary-container text-white border-none'
                  : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={index} className="px-1 text-outline">
              {p}
            </span>
          )
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || totalPages === 0}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-outline hover:bg-surface-container hover:text-on-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
