import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { scaleIn } from './motion';

/**
 * Enterprise Modal Primitive — fully accessible dialog
 *
 * Accessibility:
 *   - role="dialog" + aria-modal="true" on the panel
 *   - aria-labelledby wired to the title <h3> (when title prop provided)
 *   - aria-describedby wired to an optional description slot (via descriptionId)
 *   - Focus is trapped inside while open (Tab / Shift+Tab cycle within modal)
 *   - Focus returns to the trigger element when modal closes
 *   - Escape closes the modal (existing behaviour, kept)
 *   - Backdrop click closes the modal (existing behaviour, kept)
 *   - Close button has an explicit aria-label
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} [props.title]
 * @param {string} [props.description] - Accessible description rendered as a visually-hidden hint
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

    // Remember what was focused before we opened
    const previouslyFocused = document.activeElement;

    // Move focus into the modal on open
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
      // Return focus to the element that opened the modal
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
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
            className={`relative w-full ${sizes[size] || sizes.md} bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-elevated z-10 flex flex-col max-h-[90vh] overflow-hidden ${className}`}
          >
            {/* Visually-hidden description for screen readers */}
            {description && (
              <p id={descId} className="sr-only">
                {description}
              </p>
            )}

            {title && (
              <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between gap-4">
                <h3
                  id={titleId}
                  className="font-display font-bold text-lg text-[var(--color-navy-900)] m-0 truncate"
                >
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="p-1.5 rounded-pill text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
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
