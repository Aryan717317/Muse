'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
    children: ReactNode;
    className?: string;
    blur?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    glow?: boolean;
    glowColor?: string;
}

const blurMap = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
    '2xl': 'backdrop-blur-2xl',
    '3xl': 'backdrop-blur-3xl',
};

export function GlassCard({
    children,
    className = '',
    blur = 'xl',
    glow = false,
    glowColor = 'rgba(0, 255, 255, 0.15)',
    ...props
}: GlassCardProps) {
    return (
        <motion.div
            className={`
        relative
        bg-white/5
        ${blurMap[blur]}
        border border-white/10
        rounded-3xl
        overflow-hidden
        ${className}
      `}
            style={{
                boxShadow: glow
                    ? `0 0 40px ${glowColor}, 0 8px 32px rgba(0, 0, 0, 0.4)`
                    : '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            {...props}
        >
            {children}
        </motion.div>
    );
}
