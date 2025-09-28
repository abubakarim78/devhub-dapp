'use client';
import { useContract } from '@/hooks/useContract';
import { DevCardData } from '@/lib/suiClient';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { Link } from 'react-router-dom';
import { ExternalLink, Mail } from 'lucide-react';

const DeveloperCardSkeleton = () => (
  <div className="p-6 rounded-2xl border border-border">
    <div className="flex items-center mb-4">
      <Skeleton className="w-16 h-16 rounded-full mr-4 bg-gray-900/50" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 bg-gray-900/50" />
        <Skeleton className="h-3 w-24 bg-gray-900/50" />
      </div>
    </div>
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="h-5 w-20 rounded-full bg-gray-900/50" />
    </div>
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-5 w-16 rounded-md bg-gray-900/50" />
      <Skeleton className="h-5 w-20 rounded-md bg-gray-900/50" />
      <Skeleton className="h-5 w-12 rounded-md bg-gray-900/50" />
    </div>
  </div>
);
const FeaturedDevelopers = () => {

  const [developers, setCards] = useState<DevCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const { getAllCards } = useContract();

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      try {
        const allCards = await getAllCards();
        setCards(allCards);
      } catch (error) {
        console.error('Error fetching cards:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, []);

  if (loading) {
    return (
      <div className='grid md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {
          [1, 2, 3].map((_, index) => (
            < DeveloperCardSkeleton key={index} />
          ))
        }
      </div>

    )
  }

  return (
    <section className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex justify-between items-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">Featured Developers</h2>
          <button className="text-blue-500 font-semibold hover:text-blue-400 transition-colors">
            View All
          </button>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {developers.map((dev, index) => (
            <motion.div
              key={dev.id}
              className="bg-gray-900/50 p-6 flex flex-col gap-3 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-4">
                <img
                  src={dev.imageUrl}
                  alt={dev.name}
                  className="w-15 h-15 rounded-full mr-4 object-cover"
                />

                <div className="flex justify-between items-center mb-4 w-full">
                  <div>
                    <h3 className="font-bold text-lg text-white">{dev.name}</h3>
                    <p className="text-gray-400 text-sm">{dev.title}</p>
                  </div>

                  <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  dev.openToWork 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {dev.openToWork ? 'Available' : 'Busy'}
                </div>
                </div>
              </div>

              {/* Description */}
              {dev.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {dev.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {dev.technologies.split(', ').slice(0, 4).map(skill => (
                  <span key={skill} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-md">
                    {skill}
                  </span>
                ))}
                {dev.technologies.split(', ').length > 4 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                    +{dev.technologies.split(', ').length - 4} more
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <a
                    href={`mailto:${dev.contact}`}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Send Email"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                  <a
                    href={dev.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    title="View Portfolio"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <Link
                  to={`/card/${dev.id}`}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
                >
                  View Profile
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* <div className="text-center mt-12">
          <Link to={'/broswe'}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="border border-gray-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-800/50 transition-colors"
          >
            View All Developers
          </motion.button>
          </Link>
        </div> */}
      </div>
    </section>
  );
};

export default FeaturedDevelopers;