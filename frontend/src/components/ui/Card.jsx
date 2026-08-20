
import { motion } from 'framer-motion';
import { tapScale } from './motion';

/**
 * Enterprise Card Primitive
 * @param {Object} props
 * @param {'flat'|'card'|'elevated'|'glass'} [props.variant='card']
 * @param {boolean} [props.hoverable=false]
 */
export default function Card({
  children,
  variant = 'card',
  hoverable = false,
  className = '',
  ...rest
}) {
  const baseStyles = "bg-[var(--color-surface)] border border-[var(--color-border)] dark:border-white/[0.07] rounded-xl transition-all duration-[var(--duration-base)] ease-[var(--ease-out-smooth)]";

  const variants = {
    flat: "shadow-none bg-[var(--color-surface-alt)]",
    card: "shadow-card",
    elevated: "shadow-elevated border-opacity-60 dark:shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]",
    glass: "backdrop-blur-glass bg-[var(--glass-bg)] border-[var(--glass-border)] shadow-md"
  };

  const hoverStyle = hoverable ? "hover:-translate-y-1 hover:shadow-xl hover:border-[var(--color-navy-600)]/30 cursor-pointer" : "";

  return (
    <motion.div 
      className={`${baseStyles} ${variants[variant] || variants.card} ${hoverStyle} ${className}`}
      whileTap={hoverable ? tapScale : undefined}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

Card.Header = function CardHeader({ children, className = '', ...rest }) {
  return (
    <div className={`p-5 pb-3 border-b border-[var(--color-border)] dark:border-white/[0.07] dark:bg-white/[0.02] flex items-center justify-between gap-4 ${className}`} {...rest}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className = '', ...rest }) {
  return (
    <div className={`p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className = '', ...rest }) {
  return (
    <div className={`p-5 pt-3 border-t border-[var(--color-border)] dark:border-white/[0.07] bg-[var(--color-surface-alt)]/50 dark:bg-white/[0.02] rounded-b-md flex items-center justify-between gap-4 ${className}`} {...rest}>
      {children}
    </div>
  );
};
