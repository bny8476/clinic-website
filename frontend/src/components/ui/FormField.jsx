
/**
 * Enterprise FormField Primitive
 * @param {Object} props
 * @param {string} [props.label]
 * @param {string} [props.error]
 * @param {string} [props.helpText]
 * @param {boolean} [props.required=false]
 */
export default function FormField({
  label,
  error,
  helpText,
  required = false,
  children,
  className = '',
  id
}) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label 
          htmlFor={id} 
          className="text-xs font-semibold uppercase tracking-wider text-[var(--color-navy-900)] dark:text-[var(--color-text-muted)] flex items-center justify-between transition-colors"
        >
          <span>
            {label}
            {required && <span className="text-[var(--color-danger)] ml-1" aria-hidden="true">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {children}
      </div>

      <div className="min-h-[20px]">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1 text-xs font-medium text-[var(--color-danger)] overflow-hidden"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          ) : helpText ? (
            <motion.div 
              key="helpText"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-[var(--color-text-muted)] mt-0.5 m-0"
            >
              {helpText}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
