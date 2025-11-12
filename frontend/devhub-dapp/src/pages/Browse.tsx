import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2, AlertCircle, SlidersHorizontal, ArrowLeft, ArrowRight, Filter, X, Users, TrendingUp, Star, MapPin, Briefcase, Code2, Globe, Zap, Shield } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { DevCardData } from '../lib/suiClient';
import DeveloperCard from '@/components/common/DeveloperCard';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

const CARDS_PER_PAGE = 12;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Browse: React.FC = () => {
  const [searchParams] = useSearchParams();
  const inviteAddress = searchParams.get('invite');
  
  // --- STATE MANAGEMENT ---
  const [allCards, setAllCards] = useState<DevCardData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>(inviteAddress || '');
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [showAvailableOnly, setShowAvailableOnly] = useState<boolean>(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState<boolean>(false);
  const [minExperience, setMinExperience] = useState<number>(0);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('newest');

  // UI States
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { getAllCards } = useContract();

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      setError(null);
      try {
        const cards = await getAllCards();
        setAllCards(cards);
      } catch (err: unknown) {
        console.error('Error fetching cards:', err);
        setError('Failed to load developers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [getAllCards]);

  // --- MEMOIZED COMPUTATIONS ---
  const allTechnologies = useMemo((): string[] => {
    const techSet = new Set(allCards.flatMap(card => card.technologies.split(',').map(t => t.trim()).filter(Boolean)));
    return Array.from(techSet).sort();
  }, [allCards]);

  const allNiches = useMemo((): string[] => {
    const nicheSet = new Set(allCards.map(card => card.niche).filter(Boolean));
    return Array.from(nicheSet).sort();
  }, [allCards]);

  const allLocations = useMemo((): string[] => {
    const locationSet = new Set(allCards.map(card => card.workPreferences?.locationPreference).filter(Boolean));
    return Array.from(locationSet).sort();
  }, [allCards]);

  const filteredCards = useMemo((): DevCardData[] => {
    let filtered = allCards.filter(card => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = 
        card.name.toLowerCase().includes(lowerSearchTerm) ||
        card.niche.toLowerCase().includes(lowerSearchTerm) ||
        card.description?.toLowerCase().includes(lowerSearchTerm) ||
        card.technologies.toLowerCase().includes(lowerSearchTerm);
      
      const matchesTech = !selectedTech || card.technologies.split(',').map(t => t.trim()).includes(selectedTech);
      const matchesNiche = !selectedNiche || card.niche === selectedNiche;
      const matchesLocation = !selectedLocation || card.workPreferences?.locationPreference === selectedLocation;
      const matchesAvailability = !showAvailableOnly || card.openToWork;
      const matchesVerified = !showVerifiedOnly || card.verified;
      const matchesExperience = card.yearsOfExperience >= minExperience;
      const matchesRating = (card.analytics.averageRating / 100) >= minRating;
      
      return matchesSearch && matchesTech && matchesNiche && matchesLocation && 
             matchesAvailability && matchesVerified && matchesExperience && matchesRating;
    });

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.analytics.averageRating - a.analytics.averageRating);
        break;
      case 'experience':
        filtered.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
        break;
      case 'views':
        filtered.sort((a, b) => b.analytics.totalViews - a.analytics.totalViews);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    return filtered;
  }, [allCards, searchTerm, selectedTech, selectedNiche, selectedLocation, showAvailableOnly, showVerifiedOnly, minExperience, minRating, sortBy]);

  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
  const paginatedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    return filteredCards.slice(startIndex, startIndex + CARDS_PER_PAGE);
  }, [filteredCards, currentPage]);


  // --- CALLBACKS ---
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedTech('');
    setSelectedNiche('');
    setSelectedLocation('');
    setShowAvailableOnly(false);
    setShowVerifiedOnly(false);
    setMinExperience(0);
    setMinRating(0);
    setSortBy('newest');
    setCurrentPage(1);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedTech) count++;
    if (selectedNiche) count++;
    if (selectedLocation) count++;
    if (showAvailableOnly) count++;
    if (showVerifiedOnly) count++;
    if (minExperience > 0) count++;
    if (minRating > 0) count++;
    return count;
  }, [searchTerm, selectedTech, selectedNiche, selectedLocation, showAvailableOnly, showVerifiedOnly, minExperience, minRating]);

  useEffect(() => {
    // Reset to page 1 whenever filters change
    setCurrentPage(1);
  }, [searchTerm, selectedTech, selectedNiche, selectedLocation, showAvailableOnly, showVerifiedOnly, minExperience, minRating, sortBy]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // --- RENDER LOGIC ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Loading Developers...</h2>
          <p className="text-muted-foreground">Fetching the latest talent from the blockchain</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative">
        <div className="text-center max-w-md mx-auto px-4 relative z-10">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-3">{error}</h2>
          <p className="text-muted-foreground mb-8">Please check your connection and refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 md:mb-16 px-4"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 sm:mb-4 bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Talent Discovery
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-2">
            Find the perfect on-chain talent for your next big project.
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* --- FILTER SIDEBAR --- */}
            <aside className="lg:col-span-1">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="sticky top-16 sm:top-20 md:top-24 bg-secondary/50 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-border shadow-2xl shadow-primary/5"
              >
                <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-1.5 sm:gap-2">
                    <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-primary"/> <span>Filters</span>
                  </h3>
                  <button onClick={resetFilters} className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    Reset
                  </button>
                </div>

                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  {/* Search Input */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Search</label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Name, title..."
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-background/80 text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>
    <div className="pt-20 pb-16 min-h-screen bg-background">
      {/* Simplified Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 px-4"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
          Browse Developers
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          Find talented blockchain developers for your next project
        </p>
        
        {/* Quick stats */}
        <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>{allCards.length} Developers</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span>{allCards.filter(c => c.openToWork).length} Available</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <span>{allCards.filter(c => c.verified).length} Verified</span>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-between p-4 bg-secondary/50 backdrop-blur-xl rounded-2xl border border-border"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <motion.div
              animate={{ rotate: showMobileFilters ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </motion.div>
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Simplified Filter Sidebar */}
          <aside className={`lg:col-span-1 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="sticky top-24 bg-secondary/50 backdrop-blur-xl rounded-2xl p-4 border border-border shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-primary"/> 
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </h3>
                <button onClick={resetFilters} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Reset
                </button>
              </div>

              <div className="space-y-4">
                {/* Search Input */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Name, skills..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                </div>

                {/* Specialization */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Specialization</label>
                  <select
                    value={selectedNiche}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedNiche(e.target.value)}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="">All Specializations</option>
                    {allNiches.map(niche => (
                      <option key={niche} value={niche}>{niche}</option>
                    ))}
                  </select>
                </div>

                {/* Technology */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Technology</label>
                  <select
                    value={selectedTech}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTech(e.target.value)}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="">All Technologies</option>
                    {allTechnologies.map(tech => (
                      <option key={tech} value={tech}>{tech}</option>
                    ))}
                  </select>
                </div>

                {/* Experience */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Min Experience</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={minExperience}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinExperience(Number(e.target.value))}
                      className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="font-semibold text-primary w-12 text-center text-sm">
                      {minExperience}+
                    </span>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">Available</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showAvailableOnly} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowAvailableOnly(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">Verified</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showVerifiedOnly} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowVerifiedOnly(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          </aside>

          {/* Results Section */}
          <main className="lg:col-span-4">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <p className="text-muted-foreground">
                  Showing <span className="font-bold text-foreground">{paginatedCards.length}</span> of{' '}
                  <span className="font-bold text-foreground">{filteredCards.length}</span> developer{filteredCards.length !== 1 ? 's' : ''}
                </p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage} // Animate when page changes
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
              
              {/* Sort dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
                  className="px-3 py-1 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary cursor-pointer text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="rating">Rating</option>
                  <option value="experience">Experience</option>
                  <option value="views">Views</option>
                </select>
              </div>
            </div>

            {/* Active filters */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {searchTerm && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    Search: {searchTerm}
                    <button onClick={() => setSearchTerm('')} className="hover:text-primary/70">
                      <X size={14} />
                    </button>
                  </span>
                )}
                {selectedNiche && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {selectedNiche}
                    <button onClick={() => setSelectedNiche('')} className="hover:text-primary/70">
                      <X size={14} />
                    </button>
                  </span>
                )}
                {showAvailableOnly && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm">
                    Available
                    <button onClick={() => setShowAvailableOnly(false)} className="hover:text-green-400/70">
                      <X size={14} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Results Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {paginatedCards.length > 0 ? (
                  paginatedCards.map((card) => (
                    <motion.div 
                      key={card.id} 
                      variants={itemVariants}
                    >
                      <DeveloperCard developer={card} />
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="col-span-full"
                  >
                    <div className="text-center py-16 bg-secondary/20 rounded-2xl border border-border">
                      <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-3">No Developers Found</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Try adjusting your filters to find the perfect talent.
                      </p>
                      <button 
                        onClick={resetFilters} 
                        className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1} 
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground font-semibold rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowLeft size={16}/> Previous
                </button>
                
                <span className="text-muted-foreground font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages} 
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground font-semibold rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next <ArrowRight size={16}/>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Browse;