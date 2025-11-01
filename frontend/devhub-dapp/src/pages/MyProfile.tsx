import React, { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { 
  User, 
  MapPin, 
  Calendar, 
  Mail, 
  Link as LinkIcon, 
  Wallet, 
  ExternalLink, 
  Star,
  Edit,
  Plus,
  Upload,
  Eye,
  Building,
  Zap,
  Loader2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';
import StarBackground from '@/components/common/StarBackground';
import DashboardSidebar from '@/components/DashboardSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useContract } from '@/hooks/useContract';
import { DevCardData, getWorkPreferences } from '@/lib/suiClient';

const MyProfile: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const [activeTab, setActiveTab] = useState('overview');
  const [userCards, setUserCards] = useState<DevCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [deletingCard, setDeletingCard] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { getUserCards, loading: contractLoading, error: contractError } = useContract();

  // Fetch user cards when component mounts or account changes
  useEffect(() => {
    const fetchUserCards = async () => {
      if (!currentAccount?.address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const cards = await getUserCards(currentAccount.address);
        
        // Fetch work preferences for each card
        const cardsWithWorkPreferences = await Promise.all(
          cards.map(async (card) => {
            try {
              const workPrefs = await getWorkPreferences(card.id);
              return {
                ...card,
                workPreferences: workPrefs || card.workPreferences
              };
            } catch (err) {
              console.error(`Error fetching work preferences for card ${card.id}:`, err);
              return card; // Return card with default work preferences
            }
          })
        );
        
        setUserCards(cardsWithWorkPreferences);
      } catch (err) {
        console.error('Error fetching user cards:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserCards();
  }, [currentAccount?.address, getUserCards]);

  // Get the primary card (first card or most recent)
  const primaryCard = userCards.length > 0 ? userCards[0] : null;

  // Loading state
  if (loading || contractLoading) {
    return (
      <div className="bg-background min-h-screen pt-16 flex items-center justify-center relative">
        <StarBackground />
        <div className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30"
          >
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          </motion.div>
          <h2 className="text-4xl font-bold text-foreground mb-4">Loading Profile</h2>
          <p className="text-muted-foreground mb-8 text-lg">Fetching your developer profile data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || contractError) {
    return (
      <div className="bg-background min-h-screen pt-16 flex items-center justify-center relative">
        <StarBackground />
        <div className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 bg-destructive/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-destructive/30"
          >
            <AlertCircle className="h-16 w-16 text-destructive" />
          </motion.div>
          <h2 className="text-4xl font-bold text-foreground mb-4">Error Loading Profile</h2>
          <p className="text-muted-foreground mb-8 text-lg">{error || contractError}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
          >
            Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  // No profile found state
  if (!primaryCard) {
    return (
      <div className="bg-background min-h-screen pt-16 flex items-center justify-center relative">
        <StarBackground />
        <div className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30"
          >
            <User className="h-16 w-16 text-primary" />
          </motion.div>
          <h2 className="text-4xl font-bold text-foreground mb-4">No Profile Found</h2>
          <p className="text-muted-foreground mb-8 text-lg">You don't have a developer profile yet.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/create'}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
          >
            Create Profile
          </motion.button>
        </div>
      </div>
    );
  }

  // User not connected state
  if (!currentAccount) {
    return (
      <div className="bg-background min-h-screen pt-16 flex items-center justify-center relative">
        <StarBackground />
        <div className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30"
          >
            <User className="h-16 w-16 text-primary" />
          </motion.div>
          <h2 className="text-4xl font-bold text-foreground mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-8 text-lg">You need to connect your Sui wallet to access your profile.</p>
          <div className="bg-primary/10 backdrop-blur-sm p-6 rounded-xl border border-primary/30 max-w-md mx-auto">
            <p className="text-primary">
              Connect your wallet to view and manage your developer profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleToggleAvailability = async () => {
    if (!primaryCard) return;
    
    try {
      setTogglingAvailability(true);
      // Here you would call the contract function to toggle availability
      // For now, we'll just update the local state
      setUserCards(prevCards => 
        prevCards.map(card => 
          card.id === primaryCard.id 
            ? { ...card, openToWork: !card.openToWork }
            : card
        )
      );
    } catch (error) {
      console.error('Error toggling availability:', error);
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!primaryCard) return;
    
    try {
      setDeletingCard(true);
      // Here you would call the contract function to delete the card
      // For now, we'll just remove it from the local state
      setUserCards(prevCards => prevCards.filter(card => card.id !== primaryCard.id));
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting card:', error);
    } finally {
      setDeletingCard(false);
    }
  };

  return (
    <div className="bg-background min-h-screen text-foreground relative">
      <StarBackground />

      <div className="relative z-10 pt-32 pb-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <DashboardSidebar />
            
            <main className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key="profile-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="space-y-8"
                >
                  {/* Profile Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.7, 
                      delay: 0.1,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    className="flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                  >
                    <motion.div 
                      className="flex-1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <motion.h1 
                        className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      >
                        My Profile
                      </motion.h1>
                      <motion.p 
                        className="text-xl text-muted-foreground"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                      >
                        Manage your public developer profile, availability, and portfolio.
                      </motion.p>
                    </motion.div>
                    
                    {/* Action Buttons */}
                    <motion.div 
                      className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        whileHover={{ 
                          scale: 1.05, 
                          y: -2,
                          boxShadow: "0 10px 25px rgba(168, 85, 247, 0.4)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 0.5, delay: 0.8 }}
                        >
                          <Eye className="h-4 w-4" />
                        </motion.div>
                        Preview Profile
                      </motion.button>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                        whileHover={{ 
                          scale: 1.05, 
                          y: -2,
                          boxShadow: "0 10px 25px rgba(34, 197, 94, 0.4)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 0.5, delay: 0.9 }}
                        >
                          <Edit className="h-4 w-4" />
                        </motion.div>
                        Edit Profile
                      </motion.button>
                      
                      {/* Toggle Availability Button */}
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        whileHover={{ 
                          scale: 1.05, 
                          y: -2,
                          boxShadow: primaryCard?.openToWork 
                            ? "0 10px 25px rgba(239, 68, 68, 0.4)" 
                            : "0 10px 25px rgba(34, 197, 94, 0.4)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleToggleAvailability}
                        disabled={togglingAvailability}
                        className={`px-6 py-3 font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                          primaryCard?.openToWork 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'bg-green-500 text-white hover:bg-green-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {togglingAvailability ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 0.5, delay: 1.0 }}
                          >
                            {primaryCard?.openToWork ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                          </motion.div>
                        )}
                        {primaryCard?.openToWork ? 'Deactivate' : 'Activate'}
                      </motion.button>
                      
                      {/* Delete Card Button */}
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.9 }}
                        whileHover={{ 
                          scale: 1.05, 
                          y: -2,
                          boxShadow: "0 10px 25px rgba(239, 68, 68, 0.4)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 0.5, delay: 1.1 }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.div>
                        Delete Card
                      </motion.button>
                    </motion.div>
                  </motion.div>

                  {/* Profile Header Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.8, 
                      delay: 0.3,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    whileHover={{ 
                      scale: 1.01,
                      transition: { duration: 0.3 }
                    }}
                    className={`bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl`}
                  >
                    <motion.div 
                      className="flex items-start gap-4 mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <motion.div 
                        className="w-20 h-20 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl overflow-hidden"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ 
                          scale: 1, 
                          rotate: 0,
                          y: [0, -5, 0]
                        }}
                        transition={{ 
                          duration: 0.8, 
                          delay: 0.5,
                          type: "spring",
                          stiffness: 200,
                          y: {
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }
                        }}
                        whileHover={{ 
                          scale: 1.1, 
                          rotate: 5,
                          y: 0,
                          transition: { duration: 0.3 }
                        }}
                      >
                        {primaryCard.imageUrl ? (
                          <img 
                            src={primaryCard.imageUrl} 
                            alt={primaryCard.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          primaryCard.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        )}
                      </motion.div>
                      <motion.div 
                        className="flex-1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                      >
                        <motion.h2 
                          className="text-2xl font-bold text-foreground mb-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.7 }}
                        >
                          {primaryCard.name}
                        </motion.h2>
                        <motion.p 
                          className="text-muted-foreground mb-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.8 }}
                        >
                          {primaryCard.niche}
                        </motion.p>
                        <motion.div 
                          className="flex items-center gap-4 text-sm text-muted-foreground"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.9 }}
                        >
                          <motion.div 
                            className="flex items-center gap-1"
                            whileHover={{ scale: 1.05, x: 2 }}
                          >
                            <MapPin className="h-4 w-4" />
                            {primaryCard.workPreferences.locationPreference || 'Remote'}
                          </motion.div>
                          <motion.div 
                            className="flex items-center gap-1"
                            whileHover={{ scale: 1.05, x: 2 }}
                          >
                            <Calendar className="h-4 w-4" />
                            {primaryCard.yearsOfExperience} years exp
                          </motion.div>
                          <motion.div 
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              primaryCard.openToWork 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-gray-500/20 text-gray-400'
                            }`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ 
                              duration: 0.5, 
                              delay: 1.0,
                              type: "spring",
                              stiffness: 300
                            }}
                            whileHover={{ 
                              scale: 1.1,
                              backgroundColor: primaryCard.openToWork 
                                ? "rgba(34, 197, 94, 0.3)" 
                                : "rgba(107, 114, 128, 0.3)"
                            }}
                          >
                            {primaryCard.openToWork ? 'Available' : 'Not Available'}
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    </motion.div>

                    {/* Sub-navigation */}
                    <motion.div 
                      className="flex gap-2 pt-6 border-t border-border"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 1.1 }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.button
                          key={`overview-${activeTab === 'overview'}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ 
                            scale: 1.05, 
                            y: -2,
                            transition: { duration: 0.2 }
                          }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab('overview')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            activeTab === 'overview'
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`}
                        >
                          Overview
                        </motion.button>
                        <motion.button
                          key={`portfolio-${activeTab === 'portfolio'}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ 
                            scale: 1.05, 
                            y: -2,
                            transition: { duration: 0.2 }
                          }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab('portfolio')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            activeTab === 'portfolio'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`}
                        >
                          Portfolio
                        </motion.button>
                        <motion.button
                          key={`reviews-${activeTab === 'reviews'}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ 
                            scale: 1.05, 
                            y: -2,
                            transition: { duration: 0.2 }
                          }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab('reviews')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            activeTab === 'reviews'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`}
                        >
                          Reviews
                        </motion.button>
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>

                  {/* Main Content Grid */}
                  <motion.div 
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.2
                        }
                      }
                    }}
                    initial="hidden"
                    animate="visible"
                  >
                    {/* About Section */}
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 30, scale: 0.95 },
                        visible: { 
                          opacity: 1, 
                          y: 0, 
                          scale: 1,
                          transition: {
                            duration: 0.7,
                            ease: [0.25, 0.46, 0.45, 0.94]
                          }
                        }
                      }}
                      whileHover={{ 
                        scale: 1.02,
                        y: -5,
                        transition: { duration: 0.3 }
                      }}
                      className={`bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl`}
                    >
                      <motion.div 
                        className="flex items-center justify-between mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.4 }}
                      >
                        <motion.h3 
                          className="text-xl font-bold text-foreground"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 1.5 }}
                        >
                          About
                        </motion.h3>
                        <motion.div 
                          className="text-sm text-muted-foreground"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 1.6 }}
                        >
                          Profile completeness: <motion.span 
                            className="text-primary font-semibold"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ 
                              duration: 0.5, 
                              delay: 1.7,
                              type: "spring",
                              stiffness: 300
                            }}
                          >
                            92%
                          </motion.span>
                        </motion.div>
                      </motion.div>
                      
                      <motion.p 
                        className="text-muted-foreground mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.8 }}
                      >
                        {primaryCard.description || primaryCard.about || 'No description available.'}
                      </motion.p>

                      {/* Skills */}
                      <motion.div 
                        className="flex flex-wrap gap-2 mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.9 }}
                      >
                        {primaryCard.skills.length > 0 ? (
                          primaryCard.skills.map((skill, index) => (
                            <motion.span
                              key={`${skill.skill}-${index}`}
                              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                              animate={{ opacity: 1, scale: 1, rotate: 0 }}
                              transition={{ 
                                duration: 0.5, 
                                delay: 2.0 + index * 0.1,
                                type: "spring",
                                stiffness: 200
                              }}
                              whileHover={{ 
                                scale: 1.1, 
                                rotate: 2,
                                y: -2,
                                transition: { duration: 0.2 }
                              }}
                              className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium cursor-pointer"
                            >
                              {skill.skill} ({skill.proficiency}/10)
                            </motion.span>
                          ))
                        ) : (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 2.0 }}
                            className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm font-medium"
                          >
                            No skills added yet
                          </motion.span>
                        )}
                      </motion.div>

                      {/* Hourly Rate & Location */}
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Hourly Rate</div>
                          <div className="text-lg font-semibold text-foreground">
                            {primaryCard.workPreferences.hourlyRate 
                              ? `${primaryCard.workPreferences.hourlyRate} SUI/hr` 
                              : 'Not specified'
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Availability</div>
                          <div className="text-lg font-semibold text-foreground">
                            {primaryCard.workPreferences.availability || 'Not specified'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">Technologies</div>
                          <div className="flex flex-wrap gap-2">
                            {primaryCard.technologies ? (
                              primaryCard.technologies.split(',').map((tech, index) => (
                                <motion.span
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                  transition={{ 
                                    duration: 0.5, 
                                    delay: 2.0 + index * 0.1,
                                    type: "spring",
                                    stiffness: 200
                                  }}
                                  whileHover={{ 
                                    scale: 1.1, 
                                    rotate: 2,
                                    y: -2,
                                    transition: { duration: 0.2 }
                                  }}
                                  className="px-3 py-1 bg-purple-500 text-white rounded-full text-sm font-medium cursor-pointer"
                                >
                                  {tech.trim()}
                                </motion.span>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">No technologies specified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Contact Section */}
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 30, scale: 0.95 },
                        visible: { 
                          opacity: 1, 
                          y: 0, 
                          scale: 1,
                          transition: {
                            duration: 0.7,
                            ease: [0.25, 0.46, 0.45, 0.94]
                          }
                        }
                      }}
                      whileHover={{ 
                        scale: 1.02,
                        y: -5,
                        transition: { duration: 0.3 }
                      }}
                      className={`bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl`}
                    >
                      <h3 className="text-xl font-bold text-foreground mb-6">Contact</h3>
                      
                      <motion.div 
                        className="space-y-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      >
                        {/* Email */}
                        <motion.div 
                          className="flex items-center justify-between p-4 bg-accent/20 rounded-xl"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                          whileHover={{ 
                            scale: 1.02,
                            x: 5,
                            transition: { duration: 0.2 }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                            >
                              <Mail className="h-5 w-5 text-muted-foreground" />
                            </motion.div>
                            <div>
                              <div className="text-sm text-muted-foreground">Contact</div>
                              <div className="font-semibold text-foreground">{primaryCard.contact || 'Not provided'}</div>
                            </div>
                          </div>
                          <motion.button
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                            whileHover={{ 
                              scale: 1.1,
                              y: -2,
                              boxShadow: "0 5px 15px rgba(168, 85, 247, 0.4)"
                            }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCopy(primaryCard.contact || '')}
                            className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                          >
                            Copy
                          </motion.button>
                        </motion.div>

                        {/* Website */}
                        <motion.div 
                          className="flex items-center justify-between p-4 bg-accent/20 rounded-xl"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                          whileHover={{ 
                            scale: 1.02,
                            x: 5,
                            transition: { duration: 0.2 }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={{ rotate: [0, 5, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                            >
                              <LinkIcon className="h-5 w-5 text-muted-foreground" />
                            </motion.div>
                            <div>
                              <div className="text-sm text-muted-foreground">Portfolio</div>
                              <div className="font-semibold text-foreground">{primaryCard.portfolio || 'Not provided'}</div>
                            </div>
                          </div>
                          <motion.button
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.6 }}
                            whileHover={{ 
                              scale: 1.1,
                              y: -2,
                              boxShadow: "0 5px 15px rgba(168, 85, 247, 0.4)"
                            }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => primaryCard.portfolio && window.open(primaryCard.portfolio, '_blank')}
                            disabled={!primaryCard.portfolio}
                            className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </motion.button>
                        </motion.div>

                        {/* Wallet */}
                        <motion.div 
                          className="flex items-center justify-between p-4 bg-accent/20 rounded-xl"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.7 }}
                          whileHover={{ 
                            scale: 1.02,
                            x: 5,
                            transition: { duration: 0.2 }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={{ rotate: [0, 3, -3, 0] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 2 }}
                            >
                              <Wallet className="h-5 w-5 text-muted-foreground" />
                            </motion.div>
                            <div>
                              <div className="text-sm text-muted-foreground">Wallet</div>
                              <div className="font-semibold text-foreground">
                                {currentAccount?.address ? 
                                  `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}` : 
                                  'Not connected'
                                }
                              </div>
                            </div>
                          </div>
                          <motion.button
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.8 }}
                            whileHover={{ 
                              scale: 1.1,
                              y: -2,
                              boxShadow: "0 5px 15px rgba(168, 85, 247, 0.4)"
                            }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCopy(currentAccount?.address || '')}
                            className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                          >
                            Copy
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    </motion.div>

                    {/* Featured Work Section */}
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 30, scale: 0.95 },
                        visible: { 
                          opacity: 1, 
                          y: 0, 
                          scale: 1,
                          transition: {
                            duration: 0.7,
                            ease: [0.25, 0.46, 0.45, 0.94]
                          }
                        }
                      }}
                      whileHover={{ 
                        scale: 1.02,
                        y: -5,
                        transition: { duration: 0.3 }
                      }}
                      className={`bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl`}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-foreground">Featured Work</h3>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Add Project
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
                          >
                            <Upload className="h-3 w-3" />
                            Upload Media
                          </motion.button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {primaryCard.featuredProjects.length > 0 ? (
                          primaryCard.featuredProjects.map((project, index) => (
                            <motion.div
                              key={project}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                              className="p-4 bg-accent/20 rounded-xl border border-border"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 bg-gradient-to-br ${
                                  index % 3 === 0 ? 'from-blue-400 to-blue-600' :
                                  index % 3 === 1 ? 'from-yellow-400 to-orange-500' :
                                  'from-green-400 to-emerald-600'
                                } rounded-lg flex items-center justify-center`}>
                                  {index % 3 === 0 ? <Building className="h-5 w-5 text-white" /> :
                                   index % 3 === 1 ? <Zap className="h-5 w-5 text-white" /> :
                                   <Building className="h-5 w-5 text-white" />}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground mb-1">{project}</h4>
                                  <p className="text-sm text-muted-foreground mb-3">Featured project from your portfolio.</p>
                                  <div className="flex gap-2">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                                    >
                                      Edit
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                      View
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.6 }}
                            className="p-4 bg-accent/20 rounded-xl border border-border text-center"
                          >
                            <div className="text-muted-foreground mb-2">No featured projects yet</div>
                            <p className="text-sm text-muted-foreground">Add some projects to showcase your work!</p>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>

                    {/* Reviews Section */}
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 30, scale: 0.95 },
                        visible: { 
                          opacity: 1, 
                          y: 0, 
                          scale: 1,
                          transition: {
                            duration: 0.7,
                            ease: [0.25, 0.46, 0.45, 0.94]
                          }
                        }
                      }}
                      whileHover={{ 
                        scale: 1.02,
                        y: -5,
                        transition: { duration: 0.3 }
                      }}
                      className={`bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl`}
                    >
                      <h3 className="text-xl font-bold text-foreground mb-6">Reviews</h3>
                      
                      <div className="space-y-4">
                        {primaryCard.reviews.length > 0 ? (
                          primaryCard.reviews.map((review, index) => (
                            <motion.div
                              key={`${review.reviewer}-${review.timestamp}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                              className="p-4 bg-accent/20 rounded-xl border border-border"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {review.reviewer.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-foreground">
                                      {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star 
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                          }`} 
                                        />
                                      ))}
                                      <span className="text-sm font-medium text-foreground">{review.rating}</span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {new Date(review.timestamp).toLocaleDateString()}
                                  </p>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(review.timestamp).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.7 }}
                            className="p-4 bg-accent/20 rounded-xl border border-border text-center"
                          >
                            <div className="text-muted-foreground mb-2">No reviews yet</div>
                            <p className="text-sm text-muted-foreground">Reviews will appear here once you start working with clients!</p>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card/90 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl max-w-md w-full"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Trash2 className="h-8 w-8 text-red-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground mb-2">Delete Profile Card</h3>
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to delete your developer profile card? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeleteCard}
                    disabled={deletingCard}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {deletingCard ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyProfile;
