import React, { useMemo, useState } from 'react';

/**
 * AreaSparkline - Smooth SVG Area curve with gradient fill
 */
export function AreaSparkline({
  data = [],
  dataKey = 'value',
  color = '#1557FF',
  height = 32,
  fill = 'gradient',
  fillOpacity = 0.2,
  strokeWidth = 1.8,
  dot = false,
  crosshair = 'dashed',
  className = ''
}) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    const values = data.map(d => Number(d[dataKey]) || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const width = 120;
    const padding = 3;
    const effH = height - padding * 2;

    return values.map((val, idx) => {
      const x = padding + (idx / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * effH;
      return { x, y, val, original: data[idx] };
    });
  }, [data, dataKey, height]);

  if (points.length === 0) return null;

  const width = 120;
  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const gradId = `spark-grad-${dataKey}-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ height }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {fill === 'gradient' && <path d={areaD} fill={`url(#${gradId})`} />}
        <path d={pathD} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        {dot && points.length > 0 && (
          <circle 
            cx={points[points.length - 1].x} 
            cy={points[points.length - 1].y} 
            r={2.5} 
            fill={color} 
            stroke="#ffffff" 
            strokeWidth={1}
          />
        )}
      </svg>
    </div>
  );
}

/**
 * LineSparkline - Smooth SVG Line curve
 */
export function LineSparkline({
  data = [],
  dataKey = 'value',
  color = '#3B82F6',
  height = 32,
  strokeWidth = 2,
  dot = true,
  crosshair = 'dashed',
  className = ''
}) {
  return (
    <AreaSparkline
      data={data}
      dataKey={dataKey}
      color={color}
      height={height}
      fill="none"
      strokeWidth={strokeWidth}
      dot={dot}
      crosshair={crosshair}
      className={className}
    />
  );
}

/**
 * BarSparkline - Mini SVG bar chart sparkline
 */
export function BarSparkline({
  data = [],
  dataKey = 'value',
  color = '#F59E0B',
  height = 32,
  barGap = 3,
  barRadius = 1.5,
  dot = false,
  crosshair = 'dashed',
  className = ''
}) {
  const bars = useMemo(() => {
    if (!data || data.length === 0) return [];
    const values = data.map(d => Number(d[dataKey]) || 0);
    const max = Math.max(...values) || 1;
    const width = 120;
    const totalBars = values.length;
    const totalGaps = (totalBars - 1) * barGap;
    const barW = Math.max((width - totalGaps) / totalBars, 4);

    return values.map((val, idx) => {
      const h = Math.max((val / max) * (height - 4), 3);
      const x = idx * (barW + barGap);
      const y = height - h;
      return { x, y, w: barW, h, val };
    });
  }, [data, dataKey, height, barGap]);

  if (bars.length === 0) return null;

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ height }}>
      <svg 
        viewBox={`0 0 120 ${height}`} 
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        {bars.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={barRadius}
            fill={color}
            className="hover:opacity-80 transition-opacity"
          />
        ))}
      </svg>
    </div>
  );
}

export default AreaSparkline;
