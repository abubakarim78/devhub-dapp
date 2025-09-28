'use client';

import { useEffect } from 'react';

export const useGlowingCursor = () => {
  useEffect(() => {
    const cursor = document.getElementById('glow-cursor');
    if (!cursor) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
};