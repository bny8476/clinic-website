
/**
 * Enterprise Skeleton Shimmer Loader Primitive
 */
export default function Skeleton({
  variant = 'line', // 'line' | 'card' | 'circle' | 'table'
  className = '',
  count = 1,
  height,
  width
}) {
  const baseStyle = "animate-pulse bg-[var(--color-surface-alt)] rounded-sm border border-[var(--color-border)]/40";

  const variants = {
    line: "h-4 w-full rounded-sm",
    card: "h-40 w-full rounded-md",
    circle: "h-10 w-10 rounded-full shrink-0",
    table: "h-12 w-full rounded-sm"
  };

  const styleObj = {
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined
  };

  const items = Array.from({ length: count }, (_, i) => i);

  if (count === 1) {
    return (
      <div 
        className={`${baseStyle} ${variants[variant] || variants.line} ${className}`}
        style={styleObj}
      />
    );
  }

  return (
    <div className="space-y-3 w-full">
      {items.map((key) => (
        <div 
          key={key}
          className={`${baseStyle} ${variants[variant] || variants.line} ${className}`}
          style={styleObj}
        />
      ))}
    </div>
  );
}

Skeleton.CardGrid = function SkeletonCardGrid({ count = 4, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="card" className="h-32" />
      ))}
    </div>
  );
};

Skeleton.Table = function SkeletonTable({ rows = 5, className = '' }) {
  return (
    <div className={`space-y-2 border border-[var(--color-border)] rounded-md p-4 bg-[var(--color-surface)] ${className}`}>
      <Skeleton variant="line" className="h-6 w-1/4 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="table" />
      ))}
    </div>
  );
};
