import { useEffect, useRef } from 'react';
import { scaleIn } from './motion';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Enterprise Modal Primitive — fully accessible dialog
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {'sm'|'md'|'lg'|'xl'|'full'} [props.size='md']
 * @param {string} [props.className]
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className = ''
}) {
  const panelRef = useRef(null);
  const titleId = title ? 'modal-title' : undefined;
  const descId = description ? 'modal-desc' : undefined;

  /* ── Focus trap ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement;

    const firstFocusable = panelRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = Array.from(
        panelRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[90vh]'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Dialog panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative w-full ${sizes[size] || sizes.md} bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[92vh] overflow-hidden ${className}`}
          >
            {/* Visually-hidden description for screen readers */}
            {description && (
              <p id={descId} className="sr-only">
                {description}
              </p>
            )}

            {title && (
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/50">
                <h3
                  id={titleId}
                  className="font-display font-semibold text-lg text-slate-900 dark:text-slate-100 m-0 truncate"
                >
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            )}
            <div className="p-6 overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
