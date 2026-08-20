import React from 'react';
import { motion } from 'framer-motion';

/**
 * Enterprise Page Transition Wrapper
 * 
 * Wraps page contents to provide consistent entrance and exit animations.
 * Should be used inside AnimatePresence in layout components.
 */
export default function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full h-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
