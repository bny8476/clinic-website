import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { slideInRight } from './motion';

/**
 * Enterprise Slide-in Drawer Primitive
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} [props.title]
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md']
 */
export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = ''
}) {
  useEffect(() => {
    let previousFocus = null;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      previousFocus = document.activeElement;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    };
  }, [isOpen, onClose]);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative w-full ${sizes[size] || sizes.md} h-full bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-elevated z-10 flex flex-col overflow-hidden ${className}`}
          >
            {title && (
              <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between gap-4">
                <h3 className="font-display font-bold text-lg text-[var(--color-navy-900)] m-0 truncate">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-pill text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors focus-visible:outline-none"
                >
                  <X className="w-5 h-5" />
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
