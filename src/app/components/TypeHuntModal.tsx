import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface TypeHuntModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const TypeHuntModal: React.FC<TypeHuntModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
}) => {
  const { colors } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="relative rounded-2xl shadow-2xl max-w-lg w-full p-8"
              style={{ backgroundColor: colors.primaryMid }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={24} color="#ffffff" />
              </button>
              {title && (
                <h2 className="text-3xl mb-6 text-white">{title}</h2>
              )}
              <div className="text-white">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
