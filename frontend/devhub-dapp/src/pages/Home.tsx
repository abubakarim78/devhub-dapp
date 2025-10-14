'use client'; 

import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import Features from '@/components/Features';
import FeaturedDevelopers from '@/components/FeaturedDevelopers';
import CTA from '@/components/CTA';
import StarBackground from '@/components/common/StarBackground';

// The useGlowingCursor hook is now activated within the App component.
// No need to call it here if it's already in a parent layout.

export default function Home() {
  return (
    // The StarBackground serves as a base layer. 
    // New components will add more layers of visuals on top.
    <div className="relative overflow-hidden bg-background">
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