import React, { useMemo, useState, useEffect } from "react";

const BULB_COLORS = [
    { color: "#f97316", glow: "rgba(249, 115, 22, 0.2)" },  // Platform Orange
    { color: "#f8fafc", glow: "rgba(248, 250, 252, 0.2)" }, // White/Slate
    { color: "#f97316", glow: "rgba(249, 115, 22, 0.2)" },  // Platform Orange (repeated for dominance)
    { color: "#334155", glow: "rgba(51, 65, 85, 0.2)" },   // Deep Slate
    { color: "#f97316", glow: "rgba(249, 115, 22, 0.2)" },  // Platform Orange
];

export function BulbGarland() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const segments = isMobile ? 5 : 10; // Number of sagging segments
    const bulbsPerSegment = isMobile ? 3 : 5;
    const totalBulbs = segments * bulbsPerSegment;

    const bulbs = useMemo(() => {
        return Array.from({ length: totalBulbs }).map((_, i) => {
            const segmentIndex = Math.floor(i / bulbsPerSegment);
            const bulbInSegmentIndex = i % bulbsPerSegment;
            const t = (bulbInSegmentIndex + 1) / (bulbsPerSegment + 1);

            // Standard catenary-like curve for sagging: 4 * h * x * (1 - x)
            const sag = 9; // Gentle curve (natural midpoint between 5 and 15)
            const yOffset = 4 * sag * t * (1 - t);

            const xPos = (i / (totalBulbs - 1)) * 100;
            const colorData = BULB_COLORS[i % BULB_COLORS.length];

            return {
                id: i,
                x: `${xPos}%`,
                y: yOffset,
                color: colorData.color,
                glow: colorData.glow,
                delay: `${-(Math.random() * 3)}s`,
                duration: `${1.2 + Math.random() * 0.8}s`,
            };
        });
    }, [totalBulbs, bulbsPerSegment]);

    const wirePath = useMemo(() => {
        let path = "M 0 0";
        const segmentWidth = 100 / segments;
        const sagHeight = 9; // matched with bulbs for natural curve

        for (let i = 0; i < segments; i++) {
            const startX = i * segmentWidth;
            const endX = (i + 1) * segmentWidth;
            const midX = (startX + endX) / 2;
            // Q controlX controlY, endX endY
            // We use sagHeight * 2 as control point Y to reach sagHeight at the peak (t=0.5)
            path += ` Q ${midX} ${sagHeight * 2}, ${endX} 0`;
        }
        return path;
    }, [segments]);

    return (
        <div className="bulb-garland !z-[-10]">
            <svg className="garland-wire-svg" width="100%" height="40" viewBox="0 0 100 40" preserveAspectRatio="none">
                <path d={wirePath} fill="none" stroke="currentColor" strokeWidth="0.7" />
            </svg>
            {bulbs.map((bulb) => (
                <div
                    key={bulb.id}
                    className="bulb"
                    style={{
                        left: bulb.x,
                        top: `${bulb.y}px`,
                        backgroundColor: bulb.color,
                        animationDelay: bulb.delay,
                        animationDuration: bulb.duration,
                        boxShadow: `0 0 12px 2px hsla(var(--primary), var(--festive-glow-opacity, 0.2))`,
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
}
