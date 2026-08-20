import { useEffect, useRef } from 'react';
import { cn } from '../../utils/pharmacy/cn';

export default function ModulePanel({ 
  isOpen, 
  onClose, 
  title, 
  icon: Icon, 
  variant = 'panel', 
  colorHex = '#D4AF37',
  children,
  stackIndex = 0
}) {
  const overlayRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const isModal = variant === 'modal';

  // Responsive logic is mostly handled via CSS classes. 
  // On mobile (<768px), both behave as bottom-up sheets.
  // On desktop, panel is right-aligned slide-in, modal is centered scale-up.

  const desktopPanelVariants = {
    hidden: { x: '100%', opacity: 0.5 },
    visible: { x: 0, opacity: 1, transition: { type: 'tween', ease: 'easeOut', duration: 0.22 } },
    exit: { x: '100%', opacity: 0, transition: { type: 'tween', ease: 'easeIn', duration: 0.2 } }
  };

  const desktopModalVariants = {
    hidden: { scale: 0.96, opacity: 0, y: 20 },
    visible: { scale: 1, opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } },
    exit: { scale: 0.96, opacity: 0, y: 20, transition: { duration: 0.15 } }
  };

  const mobileSheetVariants = {
    hidden: { y: '100%' },
    visible: { y: 0, transition: { type: 'tween', ease: 'easeOut', duration: 0.25 } },
    exit: { y: '100%', transition: { type: 'tween', ease: 'easeIn', duration: 0.2 } }
  };

  // Stack styling (push base panel left slightly if another is on top)
  const isPushed = stackIndex > 0;
  const pushTransform = isPushed ? (isModal ? 'scale(0.96)' : 'translateX(-5%) scale(0.98)') : 'none';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-auto" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#0F1B33]/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Content Wrapper */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            ref={overlayRef}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={
              // On very small screens, always use sheet variants via CSS overriding or JS window check.
              // We'll use CSS classes to handle the shape, and JS variants to handle the animation origin.
              // For simplicity, we'll apply the desktop variants in JS and let Tailwind handle dimensions.
              isModal ? desktopModalVariants : desktopPanelVariants
            }
            style={{ 
              transform: isPushed ? pushTransform : undefined,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className={cn(
              "relative bg-white flex flex-col overflow-hidden shadow-2xl transition-all",
              // Mobile styles (bottom sheet for both)
              "w-full h-[90vh] rounded-t-3xl md:h-auto",
              // Desktop styles
              isModal 
                ? "md:w-full md:max-w-2xl md:rounded-2xl md:max-h-[85vh] md:m-4" 
                : "md:fixed md:right-0 md:top-0 md:bottom-0 md:h-screen md:w-[70vw] lg:w-[65vw] md:rounded-none md:rounded-l-2xl border-l border-gray-200"
            )}
          >
            {/* Header */}
            <div className="px-5 md:px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10 relative">
              {/* Optional Gold Top Border Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent opacity-50" />
              
              <div className="flex items-center gap-3">
                {Icon && (
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${colorHex}15`, color: colorHex }}
                  >
                    <Icon size={16} />
                  </div>
                )}
                <h2 className="text-lg font-bold text-[#101830] font-serif">{title}</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-6 relative">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
