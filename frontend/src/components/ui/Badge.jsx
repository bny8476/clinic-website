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
 * Enterprise Status Badge Primitive
 * @param {Object} props
 * @param {'success'|'warning'|'danger'|'info'|'neutral'|'premium'} [props.variant='neutral']
 * @param {'sm'|'md'} [props.size='md']
 * @param {React.ReactNode} [props.icon]
 */
export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon: IconComponent,
  className = '',
  ...rest
}) {
  const variants = {
    success: "bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/20",
    warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[var(--color-warning)]/20",
    danger:  "bg-[var(--color-danger-bg)] text-[var(--color-danger)] border border-[var(--color-danger)]/20",
    info:    "bg-[var(--color-info-bg)] text-[var(--color-info)] border border-[var(--color-info)]/20",
    neutral: "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] border border-[var(--color-border)] dark:border-white/10",
    // Gold/luxury tier indicator
    premium: "bg-[var(--color-gold-muted)] text-[var(--color-gold)] border border-[var(--color-gold)]/30 font-semibold",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px] gap-1 rounded-pill font-medium",
    md: "px-3 py-1 text-xs gap-1.5 rounded-pill font-semibold"
  };

  return (
    <span 
      className={`inline-flex items-center justify-center whitespace-nowrap select-none transition-all duration-[var(--duration-fast)] ease-[var(--ease-out-smooth)] ${variants[variant] || variants.neutral} ${sizes[size] || sizes.md} ${className}`}
      {...rest}
    >
      {renderIcon(IconComponent, "w-3 h-3 text-current shrink-0")}
      <span>{children}</span>
    </span>
  );
}
