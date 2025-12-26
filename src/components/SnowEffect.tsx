import React, { useMemo } from "react";

interface SnowEffectProps {
    count?: number;
    fallDistance?: string;
}

export function SnowEffect({ count = 20, fallDistance = "500px" }: SnowEffectProps) {
    const snowflakes = useMemo(() => {
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
            size: `${Math.random() * 4 + 2}px`,
            opacity: Math.random() * 0.5 + 0.3,
        }));
    }, [count]);

    return (
        <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ "--snow-fall-distance": fallDistance } as React.CSSProperties}
        >
            {snowflakes.map((flake) => (
                <div
                    key={flake.id}
                    className="absolute rounded-full animate-snow"
                    style={{
                        backgroundColor: "hsl(var(--festive-snow-color))",
                        left: flake.left,
                        width: flake.size,
                        height: flake.size,
                        opacity: flake.opacity,
                        animationDelay: flake.animationDelay,
                        animationDuration: flake.animationDuration,
                        top: -10,
                    }}
                />
            ))}
        </div>
    );
}
