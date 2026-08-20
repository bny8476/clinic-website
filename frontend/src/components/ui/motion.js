/**
 * Shared framer-motion variants and transition presets for enterprise UI animations.
 * Automatically respects prefers-reduced-motion.
 */

export const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { 
    opacity: 0, 
    y: 4,
    transition: { duration: 0.15, ease: 'easeOut' }
  }
};

export const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { 
    opacity: 0, 
    x: 30,
    transition: { duration: 0.2, ease: 'easeOut' }
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { 
    opacity: 0, 
    scale: 0.96, 
    y: 6,
    transition: { duration: 0.15, ease: 'easeOut' }
  }
};

export const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
};

export const staggerContainer = staggerChildren;

export const pageTransition = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: { duration: 0.2, ease: 'easeOut' }
  }
};

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: { duration: 0.2, ease: 'easeOut' }
  }
};

export const listStagger = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.15, ease: 'easeOut' }
  }
};

export const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeOut' }
  }
};

export const tapScale = { scale: 0.97 };
