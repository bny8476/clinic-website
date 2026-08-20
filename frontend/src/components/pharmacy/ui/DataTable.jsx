import { useRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from "../../../utils/pharmacy/cn";
import { useVirtualizer } from '@tanstack/react-virtual';

export default function DataTable({ 
  columns, 
  data, 
  loading, 
  className,
  stickyHeader = true,
  striped = true,
  hover = true,
  virtualized = false,
  overflowVisible = false,
  containerHeight = "600px",
  rowHeight = 52,
  onRowClick,
  emptyStateTitle,
  emptyStateDesc,
  emptyStateIcon
}) {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: data?.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const virtualItems = virtualized ? rowVirtualizer.getVirtualItems() : [];
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;
  const paddingBottom = virtualItems.length > 0
    ? rowVirtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end || 0)
    : 0;

  return (
    <div 
      ref={virtualized ? parentRef : null}
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-200 relative", 
        virtualized ? "overflow-y-auto" : overflowVisible ? "overflow-visible" : "overflow-x-auto",
        className
      )}
      style={virtualized ? { maxHeight: containerHeight } : {}}
    >
      <table className="w-full text-sm text-left border-collapse">
        <thead className={cn(
          "text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200",
          stickyHeader && "sticky top-0 z-10"
        )}>
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-6 py-3.5 whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            // Skeleton Loading State
            [...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                {columns.map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            // Empty State
            <tr>
              <td colSpan={columns.length} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#eff6ff] rounded-2xl rotate-3"></div>
                    <div className="absolute inset-0 bg-[#dbeafe] rounded-2xl -rotate-3"></div>
                    <div className="relative bg-white border border-[#dbeafe] rounded-xl w-12 h-12 flex items-center justify-center shadow-sm">
                      {emptyStateIcon ? emptyStateIcon : (
                        <>
                          <svg className="w-6 h-6 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="absolute -bottom-1 -right-1 bg-[#2563EB] text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <h3 className="text-[17px] font-bold text-slate-900 mb-1">{emptyStateTitle || 'No records found'}</h3>
                  <p className="text-[13px] text-slate-500 mb-6">{emptyStateDesc || 'Try adjusting your filters or search term'}</p>
                  <button className="flex items-center gap-2 px-5 py-2 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] text-[#2563EB] text-[13px] font-bold hover:bg-[#dbeafe] transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Reset Filters
                  </button>
                </div>
              </td>
            </tr>
          ) : virtualized ? (
            <>
              {paddingTop > 0 && <tr><td style={{ height: `${paddingTop}px` }} colSpan={columns.length} /></tr>}
              {virtualItems.map((virtualRow) => {
                const row = data[virtualRow.index];
                return (
                  <tr 
                    key={row.id || row._id || virtualRow.index} 
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "transition-colors",
                      (hover || onRowClick) && "hover:bg-blue-50/60",
                      onRowClick ? "cursor-pointer" : "cursor-default",
                      striped && virtualRow.index % 2 !== 0 ? "bg-slate-50" : "bg-white"
                    )}
                  >
                    {columns.map((col, j) => (
                      <td key={j} className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap">
                        {col.accessor ? row[col.accessor] : col.render ? col.render(row, virtualRow.index) : null}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {paddingBottom > 0 && <tr><td style={{ height: `${paddingBottom}px` }} colSpan={columns.length} /></tr>}
            </>
          ) : (
            data.map((row, i) => (
              <tr 
                key={row.id || row._id || i} 
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "transition-colors",
                  (hover || onRowClick) && "hover:bg-blue-50/60",
                  onRowClick ? "cursor-pointer" : "cursor-default",
                  striped && i % 2 !== 0 ? "bg-slate-50" : "bg-white"
                )}
              >
                {columns.map((col, j) => (
                  <td key={j} className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap">
                    {col.accessor ? row[col.accessor] : col.render ? col.render(row, i) : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      header: PropTypes.node,
      accessor: PropTypes.string,
      render: PropTypes.func
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  className: PropTypes.string,
  stickyHeader: PropTypes.bool,
  striped: PropTypes.bool,
  hover: PropTypes.bool,
  virtualized: PropTypes.bool,
  containerHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  rowHeight: PropTypes.number,
  onRowClick: PropTypes.func
};
