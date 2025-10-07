import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, ExternalLink, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { DevCardData } from '../lib/suiClient';
import { Badge, Button } from '@radix-ui/themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StarBackground from '@/components/common/StarBackground';
import { motion } from 'framer-motion';

// Constants
const MAX_VISIBLE_TECHNOLOGIES = 4;

const Browse: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [cards, setCards] = useState<DevCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getAllCards } = useContract();

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      setError(null);
      try {
        const allCards = await getAllCards();
        setCards(allCards);
      } catch (err) {
        console.error('Error fetching cards:', err);
        setError('Failed to load developers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  const allTechnologies = useMemo(() => {
    return Array.from(
      new Set(cards.flatMap(card => card.technologies.split(', ')))
    ).sort();
  }, [cards]);

  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.technologies.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTech = !selectedTech || card.technologies.includes(selectedTech);
      const matchesAvailability = !showAvailableOnly || card.openToWork;
      
      return matchesSearch && matchesTech && matchesAvailability;
    });
  }, [cards, searchTerm, selectedTech, showAvailableOnly]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTech('');
    setShowAvailableOnly(false);
  };

  // Loading State
  if (loading) {
    return (
      <div className="bg-black min-h-screen pt-16 flex items-center justify-center relative">
        <StarBackground/>
        <div className="text-center relative z-10">
          <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">Loading Developers</h2>
          <p className="text-gray-400">Fetching developer cards from the blockchain...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-black min-h-screen pt-16 flex items-center justify-center relative">
        <StarBackground/>
        <div className="text-center max-w-md mx-auto px-4 relative z-10">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-3">{error}</h2>
          <p className="text-gray-400 mb-8">Please check your connection and try again.</p>
          <Button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen relative">
      <StarBackground/>
      
      <div className="relative z-10 pt-32 pb-16">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 px-4"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Browse Developers
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover talented Web3 developers on Sui blockchain. Filter by skills, experience, and availability.
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 mb-12 border border-gray-700/50 shadow-2xl"
          >
            <div className="grid md:grid-cols-12 gap-4 items-center">
              {/* Search Input */}
              <div className="md:col-span-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by name, title, or technology..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-800/80 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    aria-label="Search developers"
                  />
                </div>
              </div>

              {/* Technology Filter */}
              <div className="md:col-span-3">
                <select
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                  className="w-full px-4 py-4 bg-gray-800/80 text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
                  aria-label="Filter by technology"
                >
                  <option value="">All Technologies</option>
                  {allTechnologies.map(tech => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </select>
              </div>

              {/* Availability Checkbox */}
              <div className="md:col-span-3 flex items-center justify-center md:justify-start">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showAvailableOnly}
                    onChange={(e) => setShowAvailableOnly(e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    aria-label="Show only available developers"
                  />
                  <span className="text-gray-300 font-medium group-hover:text-white transition-colors">
                    Available only
                  </span>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Results Count */}
          <div className="mb-8">
            <p className="text-gray-400 text-lg">
              Showing <span className="font-bold text-white text-xl">{filteredCards.length}</span> developer{filteredCards.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Developer Cards Grid */}
          {filteredCards.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card className="group bg-gray-900/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 hover:bg-gray-800/90 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 transform hover:-translate-y-2 transition-all duration-300 h-full">
                    <CardHeader className="flex items-start space-x-4 mb-4 p-0">
                      <img
                        src={card.imageUrl}
                        alt={`${card.name}'s profile`}
                        className="w-20 h-20 rounded-2xl object-cover ring-4 ring-gray-700/50 group-hover:ring-blue-500/50 transition-all duration-300"
                      />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="font-bold text-white text-xl group-hover:text-blue-400 transition-colors truncate">
                          {card.name}
                        </CardTitle>
                        <CardDescription className="text-blue-400 font-medium text-sm mt-1">
                          {card.title}
                        </CardDescription>
                        <div className="flex items-center space-x-2 mt-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-400">{card.yearsOfExperience} years</span>
                        </div>
                      </div>
                      <Badge className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                        card.openToWork 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                      }`}>
                        {card.openToWork ? '● Available' : 'Busy'}
                      </Badge>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                      {card.description && (
                        <p className="text-gray-300 text-sm mb-5 line-clamp-3 leading-relaxed">
                          {card.description}
                        </p>
                      )}
                      
                      {/* Technology Tags */}
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-2">
                          {card.technologies.split(', ').slice(0, MAX_VISIBLE_TECHNOLOGIES).map((tech, techIndex) => (
                            <Badge
                              key={`${card.id}-tech-${techIndex}`}
                              className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                            >
                              {tech}
                            </Badge>
                          ))}
                          {card.technologies.split(', ').length > MAX_VISIBLE_TECHNOLOGIES && (
                            <Badge className="px-3 py-1 bg-gray-700/50 text-gray-300 text-xs font-medium rounded-lg border border-gray-600/30">
                              +{card.technologies.split(', ').length - MAX_VISIBLE_TECHNOLOGIES}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                        <div className="flex items-center space-x-2">
                          <a
                            href={`mailto:${card.contact}`}
                            className="p-2.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 border border-blue-500/30 transition-colors"
                            title="Send Email"
                            aria-label={`Email ${card.name}`}
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                          <a
                            href={card.portfolio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 border border-gray-600/30 transition-colors"
                            title="View Portfolio"
                            aria-label={`View ${card.name}'s portfolio`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                        <Link
                          to={`/card/${card.id}`}
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-500/25"
                        >
                          View Profile
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-20"
            >
              <div className="w-32 h-32 bg-gray-800/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 border border-gray-700/50">
                <Search className="h-16 w-16 text-gray-500" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">No developers found</h3>
              <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                We couldn't find any developers matching your criteria. Try adjusting your filters.
              </p>
              <Button
                onClick={clearFilters}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25 cursor-pointer"
              >
                Clear All Filters
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Browse;