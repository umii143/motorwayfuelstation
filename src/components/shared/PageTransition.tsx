import React, { ReactNode } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
  viewKey: string;
}

const variants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.8, 0.25, 1] } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: [0.25, 0.8, 0.25, 1] } }
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children, viewKey }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
