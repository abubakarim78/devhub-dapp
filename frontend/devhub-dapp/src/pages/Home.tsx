'use client'; // This component uses client-side hooks

import { useGlowingCursor } from '@/hooks/useGlowingCursor';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import Features from '@/components/Features';
import FeaturedDevelopers from '@/components/FeaturedDevelopers';
import CTA from '@/components/CTA';
import StarBackground from '@/components/common/StarBackground';

export default function Home() {
  useGlowingCursor(); // Activate the glowing cursor hook

  return (
    <div className="relative overflow-hidden">
      <StarBackground />
      <div className="relative z-10">
        <main>
          <Hero />
          <Stats />
          <Features />
          <FeaturedDevelopers />
          <CTA />
        </main>
      </div>
    </div>
  );
}