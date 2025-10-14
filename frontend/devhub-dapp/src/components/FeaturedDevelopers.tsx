'use client';
import { useContract } from '@/hooks/useContract';
import { DevCardData } from '@/lib/suiClient';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DeveloperCard from './common/DeveloperCard'; // Import the new card
import { Skeleton } from './ui/skeleton';

const DeveloperCardSkeleton = () => (
  <div className="bg-secondary/50 rounded-2xl p-6 border border-border">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="w-16 h-16 rounded-xl bg-muted" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-32 bg-muted" />
        <Skeleton className="h-4 w-24 bg-muted" />
      </div>
    </div>
    <Skeleton className="h-4 w-full mb-2 bg-muted" />
    <Skeleton className="h-4 w-2/3 mb-5 bg-muted" />
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-6 w-16 rounded-full bg-muted" />
      <Skeleton className="h-6 w-20 rounded-full bg-muted" />
      <Skeleton className="h-6 w-12 rounded-full bg-muted" />
    </div>
  </div>
);

const FeaturedDevelopers = () => {
  const [developers, setDevelopers] = useState<DevCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const { getAllCards } = useContract();

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      try {
        // Fetch all cards and take the first 3 as featured
        const allCards = await getAllCards();
        setDevelopers(allCards.slice(0, 3)); 
      } catch (error) {
        console.error('Error fetching cards:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [getAllCards]); // Added dependency

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex flex-col md:flex-row justify-between md:items-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">Meet Our Top Developers</h2>
            <p className="text-lg text-muted-foreground mt-2">Discover verified talent ready to build the future.</p>
          </div>
          <Link to="/browse" className="mt-4 md:mt-0 font-semibold text-primary hover:text-primary/80 transition-colors">
            View All Developers &rarr;
          </Link>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {loading 
            ? Array.from({ length: 3 }).map((_, index) => <DeveloperCardSkeleton key={index} />)
            : developers.map((dev) => <DeveloperCard key={dev.id} developer={dev} />)
          }
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedDevelopers;