'use client';
import { useContract } from '@/hooks/useContract';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const Stats = () => {
  const { getCardCount } = useContract();
  const [developerCount, setDeveloperCount] = useState<number>(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const count = await getCardCount();
        setDeveloperCount(count);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        // Fallback to a static number if the fetch fails
        setDeveloperCount(1200); 
      }
    };
    fetchStats();
  }, [getCardCount]);

  const stats = [
    { number: developerCount.toLocaleString(), label: "Developers" },
    { number: "450+", label: "Projects Completed" }, // Static for now
    { number: "98%", label: "Success Rate" }, // Static for now
    { number: "50+", label: "Countries" } // Static for now
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center bg-secondary/50 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-border"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">{stat.number}</div>
              <div className="text-muted-foreground text-xs sm:text-sm font-semibold tracking-wide uppercase">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;