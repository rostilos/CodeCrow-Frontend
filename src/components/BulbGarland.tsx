import React, { useMemo } from "react";

const BULB_COLORS = [
    { color: "#f97316", glow: "rgba(249, 115, 22, 0.2)" },  // Platform Orange
    { color: "#f8fafc", glow: "rgba(248, 250, 252, 0.2)" }, // White/Slate
    { color: "#f97316", glow: "rgba(249, 115, 22, 0.2)" },  // Platform Orange (repeated for dominance)
    { color: "#334155", glow: "rgba(51, 65, 85, 0.2)" },   // Deep Slate
    { color: "#f97316", glow: "rgba(249, 115, 22, 0.2)" },  // Platform Orange
];

export function BulbGarland() {
    const segments = 10; // Number of sagging segments
    const bulbsPerSegment = 5;
    const totalBulbs = segments * bulbsPerSegment;

    const bulbs = useMemo(() => {
        return Array.from({ length: totalBulbs }).map((_, i) => {
            const segmentIndex = Math.floor(i / bulbsPerSegment);
            const bulbInSegmentIndex = i % bulbsPerSegment;
            const t = (bulbInSegmentIndex + 1) / (bulbsPerSegment + 1);

            // Standard catenary-like curve for sagging: 4 * h * x * (1 - x)
            const sag = 15; // pixels
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

    // Create SVG path for the sagging wire
    const wirePath = useMemo(() => {
        let path = "M 0 0";
        const segmentWidth = 100 / segments;
        const sag = 15;

        for (let i = 0; i < segments; i++) {
            const startX = i * segmentWidth;
            const endX = (i + 1) * segmentWidth;
            const midX = (startX + endX) / 2;
            path += ` Q ${midX}% ${sag * 2}, ${endX}% 0`;
        }
        return path;
    }, [segments]);

    return (
        <div className="bulb-garland !z-[-10]">
            <svg className="garland-wire-svg" width="100%" height="40" preserveAspectRatio="none">
                <path d={wirePath} fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
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
                        boxShadow: `0 0 12px 2px ${bulb.glow}`,
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
}
