'use client'; 

import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import Features from '@/components/Features';
import FeaturedDevelopers from '@/components/FeaturedDevelopers';
import CTA from '@/components/CTA';

// Layout (including StarBackground) is now handled centrally in App.tsx
// No need to import or wrap with layout components

export default function Home() {
  return (
    <main>
      <Hero />
      <Stats />
      <Features />
      <FeaturedDevelopers />
      <CTA />
    </main>
  );
}