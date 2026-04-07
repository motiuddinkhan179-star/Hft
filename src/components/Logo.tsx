import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'white' | 'dark';
  onClick?: () => void;
}

export default function Logo({ 
  className, 
  size = 'md', 
  showText = true,
  variant = 'default',
  onClick
}: LogoProps) {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-lg', gap: 'gap-1.5' },
    md: { icon: 'w-8 h-8', text: 'text-xl', gap: 'gap-2' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl', gap: 'gap-2.5' },
    xl: { icon: 'w-14 h-14', text: 'text-4xl', gap: 'gap-3' },
  };

  const currentSize = sizes[size];

  const variants = {
    default: {
      iconBg: 'bg-gradient-to-br from-blue-600 to-indigo-700',
      text: 'text-gray-900',
      accent: 'text-blue-600'
    },
    white: {
      iconBg: 'bg-white',
      text: 'text-white',
      accent: 'text-blue-200'
    },
    dark: {
      iconBg: 'bg-gray-900',
      text: 'text-gray-900',
      accent: 'text-gray-500'
    }
  };

  const currentVariant = variants[variant];

  return (
    <motion.div 
      className={cn("flex items-center select-none cursor-pointer", currentSize.gap, className)}
      whileHover="hover"
      initial="initial"
      onClick={onClick}
    >
      <motion.div 
        className={cn(
          "relative flex items-center justify-center rounded-[30%] shadow-lg shadow-blue-500/20 overflow-hidden",
          currentSize.icon,
          currentVariant.iconBg
        )}
        variants={{
          initial: { rotate: 0 },
          hover: { rotate: 12, scale: 1.05 }
        }}
      >
        {/* Abstract "O" elements */}
        <motion.div 
          className="absolute inset-0 border-2 border-white/30 rounded-full scale-75"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <span className={cn(
          "font-black text-white z-10",
          size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : size === 'lg' ? 'text-xl' : 'text-3xl'
        )}>
          O
        </span>
        
        {/* Glossy overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 pointer-events-none" />
      </motion.div>

      {showText && (
        <div className={cn("flex items-baseline font-black tracking-tighter", currentSize.text, currentSize.text)}>
          <motion.span
            variants={{
              initial: { x: 0 },
              hover: { x: 2 }
            }}
          >
            S
          </motion.span>
          <motion.span
            className={cn(currentVariant.accent)}
            variants={{
              initial: { x: 0 },
              hover: { x: 4 }
            }}
          >
            L
          </motion.span>
          
          {/* Dot accent */}
          <motion.div 
            className="w-1.5 h-1.5 bg-blue-500 rounded-full ml-0.5"
            variants={{
              initial: { scale: 1, opacity: 1 },
              hover: { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      )}
    </motion.div>
  );
}
