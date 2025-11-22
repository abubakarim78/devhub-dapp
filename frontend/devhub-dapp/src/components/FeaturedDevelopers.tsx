'use client';
import { useContract } from '@/hooks/useContract';
import { DevCardData } from '@/lib/suiClient';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DeveloperCard from './common/DeveloperCard'; // Import the new card
import { Skeleton } from './ui/skeleton';

const DeveloperCardSkeleton = () => (
  <div className="bg-secondary/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-border">
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
      <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl bg-muted flex-shrink-0" />
      <div className="space-y-2 flex-1 min-w-0">
        <Skeleton className="h-4 sm:h-5 w-24 sm:w-32 bg-muted" />
        <Skeleton className="h-3 sm:h-4 w-16 sm:w-24 bg-muted" />
      </div>
    </div>
    <Skeleton className="h-3 sm:h-4 w-full mb-1 sm:mb-2 bg-muted" />
    <Skeleton className="h-3 sm:h-4 w-2/3 mb-3 sm:mb-4 md:mb-5 bg-muted" />
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 rounded-full bg-muted" />
      <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-full bg-muted" />
      <Skeleton className="h-5 sm:h-6 w-10 sm:w-12 rounded-full bg-muted" />
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
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <motion.div
          className="flex flex-col md:flex-row justify-between md:items-center mb-8 sm:mb-10 md:mb-12 gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Meet Our Top Developers
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2">
              Discover verified talent ready to build the future.
            </p>
          </div>
          <Link 
            to="/browse" 
            className="mt-2 md:mt-0 font-semibold text-primary hover:text-primary/80 transition-colors text-sm sm:text-base text-center md:text-right whitespace-nowrap"
          >
            View All Developers &rarr;
          </Link>
        </motion.div>

        <motion.div
          className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
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