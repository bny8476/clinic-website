import React from 'react';

/**
 * Simple styled Input component.
 */
const Input = React.forwardRef(function Input(
  { label, error, className = '', ...props },
  ref
) {
  const baseClasses = "w-full h-10 px-3 py-2 bg-[var(--color-input-bg)] border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm text-[var(--color-navy-900)] placeholder:text-[var(--color-text-muted)] transition-all duration-200";
  const errorClasses = error 
    ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20" 
    : "border-[var(--color-border)] focus:border-[var(--color-navy-600)] focus:ring-[var(--color-navy-600)]/20";

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-[var(--color-navy-900)]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`${baseClasses} ${errorClasses}`}
        {...props}
      />
    </div>
  );
});

export default Input;
