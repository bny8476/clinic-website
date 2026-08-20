import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import Card from './Card';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';

/**
 * Enterprise DataTable Primitive
 * @param {Object} props
 * @param {Array<{ key: string, title: string, render?: Function, sortable?: boolean, align?: 'left'|'center'|'right' }>} props.columns
 * @param {Array<Object>} props.data
 * @param {boolean} [props.isLoading=false]
 * @param {string} [props.searchPlaceholder]
 * @param {React.ReactNode} [props.actions]
 * @param {Object} [props.pagination] - { page, totalPages, onPageChange }
 */
export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  searchPlaceholder,
  actions,
  pagination,
  emptyTitle = "No records found",
  emptyDescription = "There are no entries to display at this time.",
  className = ''
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter(row => 
      Object.values(row).some(val => 
        val && String(val).toLowerCase().includes(lower)
      )
    );
  }, [data, searchTerm]);

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  return (
    <Card className={`overflow-hidden ${className}`}>
      {(searchPlaceholder || actions) && (
        <Card.Header className="flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4">
          {searchPlaceholder && (
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-navy-600)] transition-colors"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </Card.Header>
      )}

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
            <Skeleton.Table rows={5} />
          </motion.div>
        ) : sortedData.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState 
              title={emptyTitle}
              description={emptyDescription}
            />
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Desktop / Tablet Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] text-sm font-semibold text-[var(--color-navy-900)] select-none">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`p-4 ${col.sortable ? 'cursor-pointer hover:text-[var(--color-text)]' : ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                      <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                        <span>{col.title}</span>
                        {col.sortable && (
                          sortConfig.key === col.key ? (
                            sortConfig.direction === 'asc'
                              ? <ChevronUp className="w-3.5 h-3.5 text-[var(--color-gold)]" />
                              : <ChevronDown className="w-3.5 h-3.5 text-[var(--color-gold)]" />
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                          )
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <motion.tbody 
                className="divide-y divide-[var(--color-border)] text-sm"
              >
                <AnimatePresence>
                  {sortedData.map((row, index) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
                      key={row.id || index} 
                      className="hover:bg-slate-50 dark:hover:bg-[var(--color-surface-alt)] transition-colors bg-[var(--color-surface)]"
                    >
                      {columns.map((col) => (
                        <td 
                          key={col.key} 
                          className={`p-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                        >
                          {col.render ? col.render(row[col.key], row, index) : row[col.key]}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </motion.tbody>
            </table>
          </div>

          {/* Mobile Card Stack View */}
          <div className="md:hidden divide-y divide-[var(--color-border)] p-2">
            <AnimatePresence>
              {sortedData.map((row, index) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  key={row.id || index} 
                  className="p-4 space-y-2 bg-[var(--color-surface)]"
                >
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between items-center text-xs">
                    <span className="font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      {col.title}
                    </span>
                    <span className="font-medium text-[var(--color-text)]">
                      {col.render ? col.render(row[col.key], row, index) : row[col.key]}
                    </span>
                  </div>
                ))}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {pagination && pagination.totalPages > 1 && (
        <Card.Footer className="justify-between">
          <span className="text-xs text-[var(--color-text-muted)]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="px-3 py-1 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="px-3 py-1 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </Card.Footer>
      )}
    </Card>
  );
}
