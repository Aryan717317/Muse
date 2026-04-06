'use client';

import { memo } from 'react';

// HUM-style SVG grain overlay - inline data URI for zero JS overhead (-200MB)
// Using base64-encoded SVG for maximum performance
const GRAIN_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E`;

export const GrainOverlay = memo(function GrainOverlay() {
    return (
        <div 
            className="pointer-events-none fixed inset-0 z-[50] mix-blend-overlay"
            style={{
                opacity: 0.07,
                backgroundImage: `url("${GRAIN_SVG}")`,
                backgroundRepeat: 'repeat',
            }}
            aria-hidden="true"
        />
    );
});
