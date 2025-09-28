'use client';
import { useState, useEffect, useRef } from 'react';

const StarBackground = () => {
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; speed: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateStars = () => {
      const newStars = Array.from({ length: 150 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.05 + 0.02,
      }));
      setStars(newStars);
    };
    generateStars();
  }, []);

  useEffect(() => {
    const moveStars = () => {
      setStars((prevStars) =>
        prevStars.map((star) => ({
          ...star,
          y: (star.y + star.speed) % 100,
        }))
      );
    };
    const interval = setInterval(moveStars, 1000 / 60); // 60 FPS
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full bg-black">
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.size / 2,
            animation: `twinkle ${Math.random() * 5 + 2}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0% { opacity: 0.2; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default StarBackground;