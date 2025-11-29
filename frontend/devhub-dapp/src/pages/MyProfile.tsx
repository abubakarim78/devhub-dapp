import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { 
  User, 
  MapPin, 
  Calendar, 
  Mail, 
  Link as LinkIcon, 
  Wallet, 
  ExternalLink, 
  Star,
  Building,
  Zap,
  Loader2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Users,
  Plus,
  Trash2,
  CheckCircle,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContract } from '@/hooks/useContract';
import { DevCardData, getWorkPreferences, updateCardTransaction, updateFeaturedProjectsTransaction } from '@/lib/suiClient';

const MyProfile: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const [activeTab, setActiveTab] = useState('overview');
  const [userCards, setUserCards] = useState<DevCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [addingProject, setAddingProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [newProject, setNewProject] = useState({ title: '', description: '', source: '', thumbnail: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const { getUserCards, loading: contractLoading, error: contractError, clearCache } = useContract();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  // Toast functions
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const closeToast = () => {
    setToast(null);
  };

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
        
        // Fetch cards first and show them immediately
        const cards = await getUserCards(currentAccount.address);
        
        // If no cards found, that's not an error - just set empty array
        if (!cards || cards.length === 0) {
          setUserCards([]);
          setLoading(false);
          return;
        }
        
        setUserCards(cards); // Show cards immediately
        
        // Then fetch work preferences in parallel (non-blocking)
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
        
        // Update cards with work preferences
        setUserCards(cardsWithWorkPreferences);
      } catch (err) {
        console.error('Error fetching user cards:', err);
        // Only set error if it's a real error, not just "no cards found"
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile data';
        // Check if the error is about no cards/profile not found
        if (errorMessage.toLowerCase().includes('no cards') || 
            errorMessage.toLowerCase().includes('not found') ||
            errorMessage.toLowerCase().includes('no profile')) {
          // This is not a real error, just no profile exists
          setUserCards([]);
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserCards();
  }, [currentAccount?.address, getUserCards]);

  // Get the primary card (first card or most recent)
  const primaryCard = userCards.length > 0 ? userCards[0] : null;

  // User not connected state - check first
  if (!currentAccount) {
    return (
      <div className="bg-background min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
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

  // Loading state
  if (loading || contractLoading) {
    return (
      <div className="bg-background min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
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

  // No profile found state - check before error state
  if (!primaryCard || userCards.length === 0) {
    return (
      <div className="bg-background min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30"
          >
            <User className="h-16 w-16 text-primary" />
          </motion.div>
          <h2 className="text-4xl font-bold text-foreground mb-4">No Profile Found</h2>
          <p className="text-muted-foreground mb-8 text-lg">You don't have a developer profile yet. Create one to showcase your skills and connect with other developers.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/create'}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-lg font-semibold"
          >
            Create Your Profile
          </motion.button>
        </div>
      </div>
    );
  }

  // Error state - only show for real errors (when we have cards but something else failed)
  if (error || contractError) {
    return (
      <div className="bg-background min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
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


  const handleCopy = (text: string, label: string = 'Text') => {
    if (!text) {
      showToast('Nothing to copy', 'error');
      return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied to clipboard!`, 'success');
    }).catch((err) => {
      console.error('Failed to copy:', err);
      showToast('Failed to copy to clipboard', 'error');
    });
  };

  const handleToggleAvailability = async () => {
    if (!primaryCard || !currentAccount) return;
    
    try {
      setTogglingAvailability(true);
      
      // Prepare card data with toggled openToWork
      const updatedOpenToWork = !primaryCard.openToWork;
      const featuredProjectsJson = primaryCard.featuredProjects.map(p => JSON.stringify(p));
      
      const tx = updateCardTransaction(primaryCard.id, {
        name: primaryCard.name,
        niche: primaryCard.niche,
        about: primaryCard.description || primaryCard.about || '',
        imageUrl: primaryCard.imageUrl,
        technologies: primaryCard.technologies,
        contact: primaryCard.contact,
        portfolio: primaryCard.portfolio,
        featuredProjects: featuredProjectsJson,
        languages: primaryCard.languages || [],
        openToWork: updatedOpenToWork,
        yearsOfExperience: primaryCard.yearsOfExperience,
        workTypes: primaryCard.workPreferences.workTypes || [],
        hourlyRate: primaryCard.workPreferences.hourlyRate || null,
        locationPreference: primaryCard.workPreferences.locationPreference || '',
        availability: primaryCard.workPreferences.availability || '',
        github: primaryCard.socialLinks.github || '',
        linkedin: primaryCard.socialLinks.linkedin || '',
        twitter: primaryCard.socialLinks.twitter || '',
        personalWebsite: primaryCard.socialLinks.personalWebsite || '',
      });
      
      await signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async () => {
            // Clear cache and refetch to get latest data from blockchain
            if (currentAccount?.address) {
              clearCache(currentAccount.address);
              const cards = await getUserCards(currentAccount.address, true);
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
                    return card;
                  }
                })
              );
              setUserCards(cardsWithWorkPreferences);
              showToast(
                updatedOpenToWork 
                  ? 'Availability activated successfully!' 
                  : 'Availability deactivated successfully!',
                'success'
              );
            }
          },
          onError: (error) => {
            console.error('Error toggling availability:', error);
            showToast('Failed to update availability. Please try again.', 'error');
          },
        }
      );
    } catch (error) {
      console.error('Error toggling availability:', error);
      showToast('Failed to update availability. Please try again.', 'error');
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handleAddProject = async () => {
    if (!primaryCard || !currentAccount) return;
    
    if (!newProject.title || !newProject.source) {
      showToast('Please provide at least a title and source URL for the project.', 'error');
      return;
    }
    
    try {
      setAddingProject(true);
      
      // Add new project to the list
      const updatedProjects = [...primaryCard.featuredProjects, newProject];
      const featuredProjectsJson = updatedProjects.map(p => JSON.stringify(p));
      
      const tx = updateFeaturedProjectsTransaction(primaryCard.id, featuredProjectsJson);
      
      await signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async () => {
            // Clear cache and refetch to get latest data from blockchain
            if (currentAccount?.address) {
              clearCache(currentAccount.address);
              const cards = await getUserCards(currentAccount.address, true);
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
                    return card;
                  }
                })
              );
              setUserCards(cardsWithWorkPreferences);
            }
            // Reset form and close modal
            setNewProject({ title: '', description: '', source: '', thumbnail: '' });
            setShowAddProjectModal(false);
            showToast('Featured project added successfully!', 'success');
          },
          onError: (error) => {
            console.error('Error adding project:', error);
            showToast('Failed to add project. Please try again.', 'error');
          },
        }
      );
    } catch (error) {
      console.error('Error adding project:', error);
      showToast('Failed to add project. Please try again.', 'error');
    } finally {
      setAddingProject(false);
    }
  };

  const handleDeleteProjectClick = (index: number) => {
    setProjectToDelete(index);
    setShowDeleteProjectModal(true);
  };

  const handleDeleteProject = async () => {
    if (!primaryCard || !currentAccount || projectToDelete === null) return;
    
    try {
      setDeletingProject(true);
      
      // Remove project from the list
      const updatedProjects = primaryCard.featuredProjects.filter((_, i) => i !== projectToDelete);
      const featuredProjectsJson = updatedProjects.map(p => JSON.stringify(p));
      
      const tx = updateFeaturedProjectsTransaction(primaryCard.id, featuredProjectsJson);
      
      await signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async () => {
            // Clear cache and refetch to get latest data from blockchain
            if (currentAccount?.address) {
              clearCache(currentAccount.address);
              const cards = await getUserCards(currentAccount.address, true);
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
                    return card;
                  }
                })
              );
              setUserCards(cardsWithWorkPreferences);
            }
            // Close modal and reset
            setShowDeleteProjectModal(false);
            setProjectToDelete(null);
            showToast('Featured project deleted successfully!', 'success');
          },
          onError: (error) => {
            console.error('Error deleting project:', error);
            showToast('Failed to delete project. Please try again.', 'error');
          },
        }
      );
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('Failed to delete project. Please try again.', 'error');
    } finally {
      setDeletingProject(false);
    }
  };

  // Calculate profile completeness based on real data
  const calculateProfileCompleteness = (card: DevCardData | null): number => {
    if (!card) return 0;
    
    let score = 0;
    const fields = [
      { check: card.name && card.name.trim().length > 0, weight: 15 },
      { check: card.description && card.description.trim().length > 0, weight: 15 },
      { check: card.imageUrl && card.imageUrl.trim().length > 0, weight: 10 },
      { check: card.skills && card.skills.length > 0, weight: 15 },
      { check: card.technologies && card.technologies.trim().length > 0, weight: 10 },
      { check: card.contact && card.contact.trim().length > 0, weight: 10 },
      { check: card.workPreferences && (card.workPreferences.locationPreference || card.workPreferences.availability), weight: 10 },
      { check: card.featuredProjects && card.featuredProjects.length > 0, weight: 10 },
      { check: card.socialLinks && (card.socialLinks.github || card.socialLinks.linkedin || card.socialLinks.twitter), weight: 5 },
    ];
    
    fields.forEach(field => {
      if (field.check) {
        score += field.weight;
      }
    });
    
    return Math.min(100, score);
  };

  // Format date helper function
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
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
                        Manage your public profile, availability, and portfolio.
                      </motion.p>
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
                      
                      {/* Toggle Availability Button */}
                      <motion.div 
                        className="mt-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.0 }}
                      >
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 1.1 }}
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
                          className={`w-full px-6 py-3 font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                            primaryCard?.openToWork 
                              ? 'bg-red-500 text-white hover:bg-red-600' 
                              : 'bg-green-500 text-white hover:bg-green-600'
                          } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
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
                            {calculateProfileCompleteness(primaryCard)}%
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
                      {primaryCard.skills.length > 0 && (
                        <motion.div 
                          className="flex flex-wrap gap-2 mb-6"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 1.9 }}
                        >
                          {primaryCard.skills.map((skill, index) => (
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
                          ))}
                        </motion.div>
                      )}

                      {/* Hourly Rate & Location */}
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Hourly Rate</div>
                          <div className="text-lg font-semibold text-foreground">
                            {primaryCard.workPreferences.hourlyRate 
                              ? `$${primaryCard.workPreferences.hourlyRate}/hr` 
                              : ''
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Availability</div>
                          <div className="text-lg font-semibold text-foreground">
                            {primaryCard.workPreferences.availability || ''}
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
                            onClick={() => handleCopy(primaryCard.contact || '', 'Contact')}
                            className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors cursor-pointer"
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
                            className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                            onClick={() => handleCopy(currentAccount?.address || '', 'Wallet address')}
                            className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors cursor-pointer"
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
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAddProjectModal(true)}
                          className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </motion.button>
                      </div>
                      
                      <div className="space-y-4">
                        {primaryCard.featuredProjects.length > 0 ? (
                          primaryCard.featuredProjects.map((project, index) => (
                            <motion.div
                              key={`${project.title}-${index}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                              className="p-4 bg-accent/20 rounded-xl border border-border"
                            >
                              <div className="flex items-start gap-3">
                                <div className="relative w-16 h-16 flex-shrink-0">
                                  {project.thumbnail ? (
                                    <>
                                      <img 
                                        src={project.thumbnail} 
                                        alt={project.title}
                                        className="w-16 h-16 object-cover rounded-lg"
                                        onError={(e) => {
                                          // Hide image and show fallback
                                          e.currentTarget.style.display = 'none';
                                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                          if (fallback) fallback.style.display = 'flex';
                                        }}
                                      />
                                      <div 
                                        className={`hidden w-16 h-16 bg-gradient-to-br ${
                                          index % 3 === 0 ? 'from-blue-400 to-blue-600' :
                                          index % 3 === 1 ? 'from-yellow-400 to-orange-500' :
                                          'from-green-400 to-emerald-600'
                                        } rounded-lg items-center justify-center`}
                                      >
                                        {index % 3 === 0 ? <Building className="h-8 w-8 text-white" /> :
                                         index % 3 === 1 ? <Zap className="h-8 w-8 text-white" /> :
                                         <Building className="h-8 w-8 text-white" />}
                                      </div>
                                    </>
                                  ) : (
                                    <div className={`w-16 h-16 bg-gradient-to-br ${
                                      index % 3 === 0 ? 'from-blue-400 to-blue-600' :
                                      index % 3 === 1 ? 'from-yellow-400 to-orange-500' :
                                      'from-green-400 to-emerald-600'
                                    } rounded-lg flex items-center justify-center`}>
                                      {index % 3 === 0 ? <Building className="h-8 w-8 text-white" /> :
                                       index % 3 === 1 ? <Zap className="h-8 w-8 text-white" /> :
                                       <Building className="h-8 w-8 text-white" />}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-foreground mb-1">{project.title}</h4>
                                  {project.description && (
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                                  )}
                                  <div className="flex gap-2">
                                    {project.source && (
                                      <motion.a
                                        href={project.source}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        View
                                      </motion.a>
                                    )}
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleDeleteProjectClick(index)}
                                      disabled={deletingProject}
                                      className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      Delete
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
                      <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        Reviews ({primaryCard.reviews.length})
                      </h3>
                      
                      <div className="space-y-4">
                        {primaryCard.reviews.length > 0 ? (
                          primaryCard.reviews.map((review, index) => (
                            <motion.div
                              key={`${review.reviewer}-${review.timestamp}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className="p-4 bg-background/50 rounded-lg border border-border"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${
                                          i < review.rating
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-muted-foreground'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm font-medium text-foreground">{review.rating}/5</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(review.timestamp)}
                                </span>
                              </div>
                              {review.reviewer && (
                                <div className="text-xs text-muted-foreground font-mono mb-2">
                                  From: {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
                                </div>
                              )}
                              {review.review_text && (
                                <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">
                                  {review.review_text}
                                </p>
                              )}
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-muted-foreground">No reviews yet</p>
                            <p className="text-sm text-muted-foreground/70 mt-2">Be the first to leave a review!</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
            </AnimatePresence>

      {/* Add Project Modal */}
      <AnimatePresence>
        {showAddProjectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !addingProject && setShowAddProjectModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card/90 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-foreground mb-4">Add Featured Project</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Project title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Project description"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Source URL *</label>
                  <input
                    type="url"
                    value={newProject.source}
                    onChange={(e) => setNewProject({ ...newProject, source: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://example.com/project"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Thumbnail URL</label>
                  <input
                    type="url"
                    value={newProject.thumbnail}
                    onChange={(e) => setNewProject({ ...newProject, thumbnail: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowAddProjectModal(false);
                    setNewProject({ title: '', description: '', source: '', thumbnail: '' });
                  }}
                  disabled={addingProject}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddProject}
                  disabled={addingProject || !newProject.title || !newProject.source}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingProject ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Project
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Project Modal */}
      <AnimatePresence>
        {showDeleteProjectModal && projectToDelete !== null && primaryCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !deletingProject && setShowDeleteProjectModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
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
                <h3 className="text-xl font-bold text-foreground mb-2">Delete Featured Project</h3>
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to delete "{primaryCard.featuredProjects[projectToDelete]?.title || 'this project'}"? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowDeleteProjectModal(false);
                      setProjectToDelete(null);
                    }}
                    disabled={deletingProject}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeleteProject}
                    disabled={deletingProject}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {deletingProject ? (
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

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-[100]"
          >
            <div
              className={`flex items-center gap-3 pl-4 pr-2 py-3 rounded-lg shadow-2xl border backdrop-blur-xl ${
                toast.type === 'success'
                  ? 'bg-green-500/20 border-green-500/40'
                  : 'bg-red-500/20 border-red-500/40'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              <span
                className={`font-medium text-gray-900 dark:text-gray-100`}
              >
                {toast.message}
              </span>
              <button
                onClick={closeToast}
                className={`ml-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
};

export default MyProfile;
