import React from 'react';
import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

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
 * Enterprise Empty State Primitive
 * @param {Object} props
 * @param {React.ReactNode|React.ElementType} [props.icon]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action]
 */
export default function EmptyState({
  icon: IconComponent = Inbox,
  title = "No data available",
  description,
  action,
  className = ''
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 ${className}`}
    >
      <div className="p-3.5 rounded-full bg-[var(--color-surface-alt)] text-[var(--color-navy-600)] mb-3 shadow-sm">
        {renderIcon(IconComponent, "w-8 h-8")}
      </div>
      <h3 className="font-display font-bold text-lg text-[var(--color-navy-900)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--color-text-muted)] max-w-sm m-0 mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-1">
          {action}
        </div>
      )}
    </motion.div>
  );
}
