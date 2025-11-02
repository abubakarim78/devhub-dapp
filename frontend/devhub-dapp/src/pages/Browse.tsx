import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2, AlertCircle, SlidersHorizontal, ArrowLeft, ArrowRight } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { DevCardData } from '../lib/suiClient';
import DeveloperCard from '@/components/common/DeveloperCard';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

const CARDS_PER_PAGE = 9;

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
  const [showAvailableOnly, setShowAvailableOnly] = useState<boolean>(false);
  const [minExperience, setMinExperience] = useState<number>(0);

  // Pagination State
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

  const filteredCards = useMemo((): DevCardData[] => {
    return allCards.filter(card => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = 
        card.name.toLowerCase().includes(lowerSearchTerm) ||
        card.niche.toLowerCase().includes(lowerSearchTerm) ||
        card.description?.toLowerCase().includes(lowerSearchTerm);
      const matchesTech = !selectedTech || card.technologies.split(',').map(t => t.trim()).includes(selectedTech);
      const matchesAvailability = !showAvailableOnly || card.openToWork;
      const matchesExperience = card.yearsOfExperience >= minExperience;
      
      return matchesSearch && matchesTech && matchesAvailability && matchesExperience;
    });
  }, [allCards, searchTerm, selectedTech, showAvailableOnly, minExperience]);

  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
  const paginatedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    return filteredCards.slice(startIndex, startIndex + CARDS_PER_PAGE);
  }, [filteredCards, currentPage]);


  // --- CALLBACKS ---
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedTech('');
    setShowAvailableOnly(false);
    setMinExperience(0);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    // Reset to page 1 whenever filters change
    setCurrentPage(1);
  }, [searchTerm, selectedTech, showAvailableOnly, minExperience]);

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
                className="sticky top-24 bg-secondary/50 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl shadow-primary/5"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <SlidersHorizontal size={20} className="text-primary"/> Filters
                  </h3>
                  <button onClick={resetFilters} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    Reset
                  </button>
                </div>

                <div className="space-y-6">
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
                  </div>

                  {/* Technology Select */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Technology</label>
                    <select
                      value={selectedTech}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTech(e.target.value)}
                      className="w-full mt-2 px-3 py-2 bg-background/80 text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="">All Technologies</option>
                      {allTechnologies.map(tech => (
                        <option key={tech} value={tech}>{tech}</option>
                      ))}
                    </select>
                  </div>

                  {/* Experience Slider */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Minimum Experience</label>
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={minExperience}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinExperience(Number(e.target.value))}
                        className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <span className="font-semibold text-primary w-12 text-center">{minExperience}+ yrs</span>
                    </div>
                  </div>

                  {/* Availability Toggle */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <label className="text-sm font-medium text-muted-foreground">Available for work</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={showAvailableOnly} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowAvailableOnly(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-border rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </motion.div>
            </aside>

            {/* --- RESULTS GRID & PAGINATION --- */}
            <main className="lg:col-span-3">
              <div className="mb-6">
                <p className="text-muted-foreground">
                  Showing <span className="font-bold text-foreground">{paginatedCards.length}</span> of <span className="font-bold text-foreground">{filteredCards.length}</span> developer{filteredCards.length !== 1 ? 's' : ''}
                </p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage} // Animate when page changes
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {paginatedCards.length > 0 ? (
                    paginatedCards.map((card) => (
                      <motion.div key={card.id} variants={itemVariants}>
                        <DeveloperCard developer={card} />
                      </motion.div>
                    ))
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:col-span-2 xl:col-span-3">
                      <div className="text-center py-20 bg-secondary/30 rounded-2xl border border-border">
                        <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mx-auto mb-8 border border-border">
                            <Search className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">No Developers Found</h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">Try adjusting your filters to find the talent you're looking for.</p>
                        <button onClick={resetFilters} className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg shadow-primary/25 cursor-pointer">
                            Clear All Filters
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground font-semibold rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed">
                    <ArrowLeft size={16}/> Prev
                  </button>
                  <span className="text-muted-foreground font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground font-semibold rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed">
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