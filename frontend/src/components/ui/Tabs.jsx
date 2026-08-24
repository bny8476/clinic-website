import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

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
 * Enterprise Tabs Primitive
 * @param {Object} props
 * @param {Array<{ id: string, label: string, icon?: React.ReactNode, badge?: string|number }>} props.tabs
 * @param {string} props.activeTab
 * @param {Function} props.onChange
 */
export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = ''
}) {
  return (
    <div className={`flex items-center gap-1 border-b border-[var(--color-border)] overflow-x-auto no-scrollbar ${className}`} role="tablist">
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        const handleKeyDown = (e) => {
          let newIndex = index;
          if (e.key === 'ArrowRight') {
            newIndex = (index + 1) % tabs.length;
          } else if (e.key === 'ArrowLeft') {
            newIndex = (index - 1 + tabs.length) % tabs.length;
          }
          if (newIndex !== index) {
            onChange(tabs[newIndex].id);
            // In a real app we'd also focus the new button, but this is a start
          }
        };

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={handleKeyDown}
            className={`relative px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-inset rounded-t-sm ${
              isActive
                ? 'text-[var(--color-gold)] dark:text-[var(--color-gold)] font-semibold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-navy-900)]'
            }`}
          >
            {renderIcon(Icon, "w-4 h-4 shrink-0")}
            <span>{tab.label}</span>
            
            {tab.badge !== undefined && (
              <span className={`px-2 py-0.5 text-[11px] rounded-pill font-semibold transition-colors ${
                isActive
                  ? 'bg-[var(--color-gold-muted)] text-[var(--color-gold)]'
                  : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]'
              }`}>
                {tab.badge}
              </span>
            )}

            {isActive && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-gold)] rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
