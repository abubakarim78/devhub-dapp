'use client';
import { useContract } from '@/hooks/useContract';
import { DevCardData } from '@/lib/suiClient';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DeveloperCard from './common/DeveloperCard';
import { Skeleton } from './ui/skeleton';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './ui/carousel';

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

  // Initialize autoplay plugin
  const [autoplayPlugin] = useState(() =>
    Autoplay({
      delay: 2000, // 4 seconds between slides
      stopOnInteraction: false, // Continue autoplay after user interaction
      stopOnMouseEnter: true, // Pause on hover
      stopOnFocusIn: true, // Pause when focused
    })
  );

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      try {
        // Fetch all cards and take the first 9 as featured for carousel
        const allCards = await getAllCards();
        setDevelopers(allCards.slice(0, 9)); 
      } catch (error) {
        console.error('Error fetching cards:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [getAllCards]);


  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 overflow-visible">
        <motion.div
          className="flex flex-col md:flex-row justify-between md:items-center mb-8 sm:mb-10 md:mb-12 gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Meet Our Top Professionals
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2">
              Discover verified talent ready to build the future.
            </p>
          </div>
          <Link 
            to="/browse" 
            className="mt-2 md:mt-0 font-semibold text-primary hover:text-primary/80 transition-colors text-sm sm:text-base text-center md:text-right whitespace-nowrap cursor-pointer"
          >
            View All Professionals &rarr;
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <DeveloperCardSkeleton key={index} />
            ))}
          </div>
        ) : developers.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative w-full overflow-visible"
          >
            <div className="relative w-full">
              <Carousel
                opts={{
                  align: "start",
                  loop: developers.length > 3,
                  slidesToScroll: 1,
                  dragFree: true,
                }}
                plugins={[autoplayPlugin]}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {developers.map((dev) => (
                    <CarouselItem
                      key={dev.id}
                      className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                    >
                      <DeveloperCard developer={dev} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {developers.length > 1 && (
                  <>
                    <CarouselPrevious className="hidden md:flex -left-4 lg:-left-12 z-10 bg-background/90 backdrop-blur-sm hover:bg-background border-border shadow-md" />
                    <CarouselNext className="hidden md:flex -right-4 lg:-right-12 z-10 bg-background/90 backdrop-blur-sm hover:bg-background border-border shadow-md" />
                  </>
                )}
              </Carousel>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No professionals found yet.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedDevelopers;