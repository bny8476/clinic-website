import React from 'react';

const renderIcon = (Icon, className) => {
  if (!Icon) return null;
  if (React.isValidElement(Icon)) return Icon;
  if (typeof Icon === 'function' || typeof Icon === 'object') {
    const IconComp = Icon;
    return <IconComp className={className} />;
  }
  return null;
};

/**
 * Enterprise Button Primitive
 * @param {Object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'|'outline'|'gold'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.isLoading=false]
 * @param {boolean} [props.fullWidth=false]
 * @param {React.ReactNode} [props.icon]
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  icon: IconComponent,
  disabled,
  className = '',
  type = 'button',
  onClick,
  ...rest
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:opacity-60 disabled:cursor-not-allowed select-none transition-colors duration-300";

  const variants = {
    primary: [
      "bg-[var(--color-navy-800)] text-white shadow-sm",
      "hover:bg-[var(--color-navy-900)] hover:shadow-md",
      "dark:bg-[var(--color-navy-800)] dark:hover:bg-[var(--color-navy-900)]",
      "focus-visible:ring-[var(--color-navy-600)]",
    ].join(' '),
    gold: [
      "bg-[var(--color-gold)] text-white font-semibold shadow-sm",
      "hover:bg-[var(--color-gold-hover)] hover:shadow-md",
      "focus-visible:ring-[var(--color-gold)]",
    ].join(' '),
    secondary: [
      "bg-[var(--color-surface-alt)] text-[var(--color-navy-900)] border border-[var(--color-border)]",
      "hover:bg-[var(--color-border)]",
      "dark:border-white/15 dark:text-[var(--color-text)] dark:hover:bg-white/8",
      "focus-visible:ring-[var(--color-navy-600)]",
    ].join(' '),
    outline: [
      "bg-transparent text-[var(--color-navy-900)] border border-[var(--color-navy-800)]",
      "hover:bg-black/5",
      "dark:border-white/20 dark:text-[var(--color-text)] dark:hover:bg-white/8",
      "focus-visible:ring-[var(--color-navy-600)]",
    ].join(' '),
    ghost: [
      "bg-transparent text-[var(--color-navy-900)]",
      "hover:bg-black/5 dark:hover:bg-white/8",
      "dark:text-[var(--color-text)]",
      "focus-visible:ring-[var(--color-navy-600)]",
    ].join(' '),
    danger: [
      "bg-[var(--color-danger)] text-white shadow-sm",
      "hover:bg-red-700 dark:hover:bg-red-500 hover:shadow-md",
      "focus-visible:ring-[var(--color-danger)]",
    ].join(' '),
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5 min-h-[32px]",
    md: "px-4 py-2 text-sm gap-2 min-h-[40px]",
    lg: "px-6 py-2.5 text-base gap-2.5 min-h-[48px]"
  };

  const widthStyle = fullWidth ? "w-full" : "";
  const isDisabled = disabled || isLoading;

  const handleClick = (e) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${widthStyle} ${className}`}
      onClick={handleClick}
      whileHover={isDisabled ? {} : { scale: 1.01 }}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...rest}
    >
      <motion.div 
        className="flex items-center justify-center gap-inherit"
        initial={false}
        animate={{ opacity: 1 }}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          renderIcon(IconComponent, "w-4 h-4 text-current shrink-0")
        )}
        {children && <span>{children}</span>}
      </motion.div>
    </motion.button>
  );
}
