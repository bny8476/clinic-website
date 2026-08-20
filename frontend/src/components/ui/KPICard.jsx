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
 * Enterprise Metric & KPI Primitive
 * @param {Object} props
 * @param {React.ReactNode|React.ElementType} props.icon
 * @param {string} props.label
 * @param {string|number} props.value
 * @param {Object} [props.trend] - { value: string|number, isPositive: boolean }
 * @param {string} [props.subtext]
 * @param {'navy'|'success'|'warning'|'danger'|'info'|'gold'} [props.colorToken='navy']
 * @param {boolean} [props.isLoading=false]
 */
export default function KPICard({
  icon: IconComponent,
  label,
  value,
  trend,
  subtext,
  colorToken = 'navy',
  isLoading = false,
  className = '',
  onClick
}) {
  const iconColors = {
    navy:    "bg-[var(--color-navy-800)]/10 text-[var(--color-navy-800)] dark:text-[var(--color-navy-600)]",
    success: "bg-[var(--color-success-bg)] text-[var(--color-success)]",
    warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
    danger:  "bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
    info:    "bg-[var(--color-info-bg)] text-[var(--color-info)]",
    gold:    "bg-[var(--color-gold-muted)] text-[var(--color-gold)]",
  };

  // Value text: gold gives warm premium accent; navy gets gold tint in dark mode
  const valueColors = {
    navy:    "text-[var(--color-navy-900)] dark:text-[var(--color-gold)]",
    gold:    "text-[var(--color-gold)]",
    success: "text-[var(--color-success)]",
    warning: "text-[var(--color-warning)]",
    danger:  "text-[var(--color-danger)]",
    info:    "text-[var(--color-info)]",
  };

  return (
    <Card 
      hoverable={!!onClick} 
      onClick={onClick}
      className={`relative overflow-hidden transition-all duration-[var(--duration-base)] ease-[var(--ease-out-smooth)] ${className}`}
    >
      <Card.Body className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] truncate">
            {label}
          </span>
          {IconComponent && (
            <div className={`p-2.5 rounded-sm flex items-center justify-center shrink-0 ${iconColors[colorToken] || iconColors.navy}`}>
              {renderIcon(IconComponent, "w-5 h-5")}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-2 py-1">
            <div className="h-8 w-24 bg-[var(--color-surface-alt)] rounded-sm" />
            <div className="h-3 w-16 bg-[var(--color-surface-alt)] rounded-sm" />
          </div>
        ) : (
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-2xl font-bold font-display tracking-tight ${
              valueColors[colorToken] || valueColors.navy
            }`}>
              {value}
            </span>
            {trend && (
              <div className={`inline-flex items-center text-xs font-medium gap-0.5 px-1.5 py-0.5 rounded-pill ${
                trend.isPositive 
                  ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' 
                  : 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]'
              }`}>
                {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{trend.value}</span>
              </div>
            )}
          </div>
        )}

        {subtext && !isLoading && (
          <p className="text-xs text-[var(--color-text-muted)] m-0 truncate">
            {subtext}
          </p>
        )}
      </Card.Body>
    </Card>
  );
}
