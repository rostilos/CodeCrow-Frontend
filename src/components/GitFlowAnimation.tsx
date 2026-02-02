import { useEffect, useRef } from 'react';

interface GitFlowAnimationProps {
  className?: string;
}

interface FloatingOrb {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
  opacity: number;
  pulsePhase: number;
}

export function GitFlowAnimation({ className = '' }: GitFlowAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const orbsRef = useRef<FloatingOrb[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      if (initializedRef.current) {
        initializeOrbs();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const colors = [
      'rgba(249, 115, 22, 0.15)',  // primary orange
      'rgba(59, 130, 246, 0.12)',  // blue accent
      'rgba(34, 197, 94, 0.10)',   // green
    ];

    const initializeOrbs = () => {
      const rect = canvas.getBoundingClientRect();
      orbsRef.current = [];

      // Create just 3-4 large, slow-moving orbs for subtle ambient effect
      const numOrbs = 4;
      
      for (let i = 0; i < numOrbs; i++) {
        const orb: FloatingOrb = {
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          radius: 80 + Math.random() * 120,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          color: colors[i % colors.length],
          opacity: 0.6 + Math.random() * 0.4,
          pulsePhase: Math.random() * Math.PI * 2,
        };
        orbsRef.current.push(orb);
      }
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      orbsRef.current.forEach((orb) => {
        // Update position with very slow movement
        orb.x += orb.vx;
        orb.y += orb.vy;
        orb.pulsePhase += 0.005;

        // Soft bounce at edges
        if (orb.x < -orb.radius) orb.x = rect.width + orb.radius;
        if (orb.x > rect.width + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = rect.height + orb.radius;
        if (orb.y > rect.height + orb.radius) orb.y = -orb.radius;

        // Subtle size pulse
        const pulse = Math.sin(orb.pulsePhase) * 0.1 + 1;
        const currentRadius = orb.radius * pulse;

        // Draw soft gradient orb
        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, currentRadius
        );
        gradient.addColorStop(0, orb.color.replace(/[\d.]+\)$/, `${orb.opacity * 0.5})`));
        gradient.addColorStop(0.5, orb.color.replace(/[\d.]+\)$/, `${orb.opacity * 0.2})`));
        gradient.addColorStop(1, orb.color.replace(/[\d.]+\)$/, '0)'));

        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    initializeOrbs();
    initializedRef.current = true;
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity: 0.4 }}
    />
  );
}