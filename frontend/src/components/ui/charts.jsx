import React, { createContext, useContext, useState, useMemo, Children, isValidElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ChartContext = createContext(null);

export function useChart() {
  const ctx = useContext(ChartContext);
  if (!ctx) {
    throw new Error('useChart must be used within a <BarChart /> component');
  }
  return ctx;
}

/**
 * Format currency or numbers nicely
 */
function defaultFormatValue(val) {
  if (typeof val !== 'number') return val;
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(1)}L`;
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

/**
 * BarChart root component
 */
export function BarChart({
  data = [],
  xDataKey = 'name',
  height = 300,
  barGap = 8,
  className = '',
  children
}) {
  const [activeItem, setActiveItem] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  // Extract <Bar /> child definitions to compute scale and render bars
  const barConfigs = useMemo(() => {
    const list = [];
    Children.forEach(children, child => {
      if (isValidElement(child) && (child.type === Bar || child.props?.dataKey)) {
        list.push({
          dataKey: child.props.dataKey,
          fill: child.props.fill || '#10B981',
          name: child.props.name || child.props.dataKey,
          lineCap: child.props.lineCap || 'round',
          className: child.props.className || '',
          barWidth: child.props.barWidth
        });
      }
    });
    return list;
  }, [children]);

  // Compute maximum value across all bars for percentage scaling
  const maxValue = useMemo(() => {
    let max = 0;
    data.forEach(item => {
      barConfigs.forEach(bar => {
        const val = Number(item[bar.dataKey]) || 0;
        if (val > max) max = val;
      });
    });
    return max > 0 ? max * 1.08 : 100; // 8% headroom
  }, [data, barConfigs]);

  const contextValue = {
    data,
    xDataKey,
    barConfigs,
    maxValue,
    activeItem,
    setActiveItem,
    hoverPosition,
    setHoverPosition,
    height
  };

  return (
    <ChartContext.Provider value={contextValue}>
      <div 
        className={`relative w-full select-none ${className}`}
        style={{ minHeight: height }}
        onMouseLeave={() => setActiveItem(null)}
      >
        {children}
      </div>
    </ChartContext.Provider>
  );
}

/**
 * Grid component (horizontal / vertical reference lines)
 */
export function Grid({ horizontal = true, vertical = false, lines = 4, className = '' }) {
  if (!horizontal && !vertical) return null;

  return (
    <div className={`absolute inset-x-0 top-0 bottom-8 pointer-events-none flex flex-col justify-between ${className}`}>
      {horizontal && Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="w-full border-b border-slate-100/80 dashed"
          style={{ borderBottomStyle: i === lines - 1 ? 'solid' : 'dashed' }}
        />
      ))}
    </div>
  );
}

/**
 * Bar series component
 * Note: Bar definitions are extracted by BarChart, but <Bar /> also renders the animated column clusters!
 */
export function Bar({
  dataKey,
  fill = '#10B981',
  name,
  lineCap = 'round',
  className = '',
  barWidth
}) {
  const { data, barConfigs, maxValue, activeItem, setActiveItem, setHoverPosition, height } = useChart();

  // Only the first Bar component handles rendering the grouped bars to avoid duplicate loops
  const isFirstBar = barConfigs[0]?.dataKey === dataKey;
  if (!isFirstBar) return null;

  return (
    <div 
      className="relative z-10 flex items-end justify-between gap-2 sm:gap-6 lg:gap-8 px-2 sm:px-4"
      style={{ height: height - 40 }}
    >
      {data.map((item, index) => {
        const isHovered = activeItem && activeItem.index === index;

        return (
          <div
            key={index}
            className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setActiveItem({ item, index });
              setHoverPosition({
                x: rect.left + rect.width / 2,
                y: rect.top
              });
            }}
          >
            {/* Cluster of bars for this category */}
            <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 h-full pb-1">
              {barConfigs.map((cfg) => {
                const val = Number(item[cfg.dataKey]) || 0;
                const heightPercent = Math.max((val / maxValue) * 100, 4);
                const isRound = cfg.lineCap === 'round';

                // Resolve CSS variables or fallbacks
                let barColor = cfg.fill;
                if (barColor?.startsWith('var(')) {
                  // Fallbacks for known CSS vars
                  if (barColor.includes('primary')) barColor = '#1557FF';
                  else if (barColor.includes('secondary')) barColor = '#FB7185';
                  else if (barColor.includes('tertiary')) barColor = '#3B82F6';
                  else barColor = '#1557FF';
                }

                return (
                  <motion.div
                    key={cfg.dataKey}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                      height: `${heightPercent}%`, 
                      opacity: isHovered ? 1 : activeItem ? 0.65 : 0.95,
                      scale: isHovered ? 1.04 : 1
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 180,
                      damping: 18,
                      delay: index * 0.05
                    }}
                    style={{
                      backgroundColor: barColor,
                      maxWidth: cfg.barWidth || 22
                    }}
                    className={`w-full transition-transform duration-200 relative shadow-2xs ${
                      isRound ? 'rounded-t-full' : 'rounded-t-sm'
                    } ${cfg.className}`}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * BarXAxis component for month/category labels
 */
export function BarXAxis({ className = '' }) {
  const { data, xDataKey } = useChart();

  return (
    <div className="w-full border-t border-slate-200/90 pt-3">
      <div className="flex items-center justify-between px-2 sm:px-4">
        {data.map((item, index) => (
          <div key={index} className="flex-1 text-center">
            <span className={`text-xs font-bold text-slate-600 tracking-wide transition-colors ${className}`}>
              {item[xDataKey] || `P${index + 1}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ChartTooltip component
 */
export function ChartTooltip({ formatter = defaultFormatValue, className = '' }) {
  const { activeItem, barConfigs, xDataKey } = useChart();

  if (!activeItem) return null;

  const { item } = activeItem;
  const label = item[xDataKey];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className={`absolute top-2 right-4 z-30 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-xl border border-slate-800 text-xs min-w-[210px] pointer-events-none ${className}`}
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <span className="font-extrabold text-sm text-slate-200 tracking-tight">{label} Summary</span>
          <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800/40">
            Validated
          </span>
        </div>

        <div className="space-y-2">
          {barConfigs.map((cfg) => {
            const val = item[cfg.dataKey] || 0;
            let dotColor = cfg.fill;
            if (dotColor?.startsWith('var(')) {
              if (dotColor.includes('secondary')) dotColor = '#FB7185';
              else if (dotColor.includes('primary')) dotColor = '#1557FF';
              else dotColor = '#3B82F6';
            }

            return (
              <div key={cfg.dataKey} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                  {cfg.name || cfg.dataKey}
                </span>
                <span className="font-financeMono tabular-nums font-bold text-white">
                  {formatter(val)}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default BarChart;
