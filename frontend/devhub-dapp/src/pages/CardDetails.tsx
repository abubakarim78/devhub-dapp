import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, ExternalLink, Calendar, Code2, Loader2, MessageSquare, Star, MapPin, Briefcase, Globe, Github, Linkedin, Twitter, Award, Users, CheckCircle, Shield, Languages, DollarSign, FolderOpen, X } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { DevCardData, FeaturedProject, addReviewTransaction, trackProfileViewTransaction } from '../lib/suiClient';
import { WalrusService } from '../services/walrus';
import Layout from '@/components/common/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';

const CardDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { getCardInfo } = useContract();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [card, setCard] = useState<DevCardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const profileViewTracked = useRef<boolean>(false);

  useEffect(() => {
    // Reset tracking when card ID changes
    profileViewTracked.current = false;
    
    const fetchCard = async () => {
      if (!id) {
        setError("No card ID provided.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
          throw new Error("Invalid card ID format.");
        }
        const cardData = await getCardInfo(numericId);
        if (cardData) {
          setCard(cardData);
          
          // Track profile view on-chain (only once per page load, and only if visitor is not the owner)
          if (!profileViewTracked.current) {
            profileViewTracked.current = true;
            
            // Only track if the visitor is not the owner of the card
            const isOwner = currentAccount?.address?.toLowerCase() === cardData.owner.toLowerCase();
            if (!isOwner && currentAccount?.address) {
              try {
                const tx = trackProfileViewTransaction(numericId);
                signAndExecute(
                  { transaction: tx as any },
                  {
                    onSuccess: async (result: any) => {
                      console.log('✅ Profile view tracked on-chain for card', numericId, result.digest);
                      // Refresh card data after a short delay to show updated view count
                      setTimeout(async () => {
                        try {
                          const updatedCard = await getCardInfo(numericId, true);
                          if (updatedCard) {
                            setCard(updatedCard);
                          }
                        } catch (err) {
                          console.error('Error refreshing card after view tracking:', err);
                        }
                      }, 2000);
                    },
                    onError: (error: any) => {
                      console.error('❌ Failed to track profile view on-chain:', error);
                    },
                  }
                );
              } catch (error) {
                console.error('Error creating profile view transaction:', error);
              }
            } else if (isOwner) {
              console.log('👤 Owner viewing own profile - view not tracked');
            } else {
              console.log('⚠️ No wallet connected - cannot track profile view on-chain');
            }
          }
        } else {
          setError('Card not found.');
        }
      } catch (err: unknown) {
        console.error('Error fetching card:', err);
        setError(err instanceof Error ? err.message : 'Failed to load card details');
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [id, getCardInfo, currentAccount?.address, signAndExecute]);

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!currentAccount?.address || !card || selectedRating === 0) return;

    // Validate
    if (currentAccount.address.toLowerCase() === card.owner.toLowerCase()) {
      setReviewError("You cannot review your own profile.");
      return;
    }

    if (card.reviews.some(r => r.reviewer.toLowerCase() === currentAccount.address?.toLowerCase())) {
      setReviewError("You have already reviewed this profile.");
      return;
    }

    if (selectedRating < 1 || selectedRating > 5) {
      setReviewError("Please select a rating between 1 and 5 stars.");
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);

    try {
      const cardId = parseInt(id || '0', 10);
      if (isNaN(cardId)) {
        throw new Error("Invalid card ID");
      }

      const tx = addReviewTransaction(cardId, selectedRating, reviewText);

      signAndExecute(
        { transaction: tx as any },
        {
          onSuccess: async (result: any) => {
            try {
              // Wait for transaction to be confirmed
              await suiClient.waitForTransaction({ digest: result.digest });
              
              // Refresh card data
              const updatedCard = await getCardInfo(cardId, true);
              if (updatedCard) {
                setCard(updatedCard);
              }

              // Close modal and reset state
              setShowReviewModal(false);
              setSelectedRating(0);
              setHoveredRating(0);
              setReviewText('');
            } catch (error) {
              console.error('Error waiting for transaction:', error);
              setReviewError("Review submitted but failed to refresh data. Please reload the page.");
            } finally {
              setSubmittingReview(false);
            }
          },
          onError: (error: any) => {
            console.error('Error submitting review:', error);
            setReviewError(
              error.message?.includes('SELF_REVIEW_NOT_ALLOWED')
                ? "You cannot review your own profile."
                : error.message?.includes('ALREADY_REVIEWED')
                ? "You have already reviewed this profile."
                : error.message?.includes('INVALID_RATING')
                ? "Invalid rating. Please select a rating between 1 and 5 stars."
                : "Failed to submit review. Please try again."
            );
            setSubmittingReview(false);
          },
        }
      );
    } catch (error: any) {
      console.error('Error creating review transaction:', error);
      setReviewError(error.message || "Failed to submit review. Please try again.");
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Loading Profile...</h2>
          <p className="text-muted-foreground">Fetching developer details from the blockchain.</p>
        </div>
      </div>
      </Layout>
    );
  }

  if (error || !card) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-destructive/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-destructive/30">
            <Code2 className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">Profile Not Found</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            {error || "The developer card you're looking for doesn't exist or could not be loaded."}
          </p>
          <Link
            to="/browse"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg shadow-primary/25"
          >
            Browse Developers
          </Link>
        </div>
      </div>
      </Layout>
    );
  }

  const technologies = card.technologies.split(',').map(t => t.trim()).filter(Boolean);
  // Ensure languages is always an array and filter out any type information
  const languages: string[] = Array.isArray(card.languages) 
    ? card.languages.filter((lang: any) => 
        lang && 
        typeof lang === 'string' && 
        !lang.includes('vector') && 
        !lang.includes('String') &&
        lang.trim().length > 0
      )
    : (typeof card.languages === 'string' && card.languages)
      ? (card.languages as string).split(',').map((l: string) => l.trim()).filter((l: string) => 
          l && !l.includes('vector') && !l.includes('String')
        )
      : [];
  const isOwner = currentAccount?.address === card.owner;
  // Extract core skills from skills array
  const coreSkills = card.skills.map(skill => skill.skill);
  
  // Only display on-chain profileViews - do not use local storage
  const rawProfileViews = card.analytics.profileViews ?? 0;
  console.log(`🔍 Profile Views - Raw from blockchain: ${rawProfileViews}, Card ID: ${card.id}`);
  
  // Filter out unreasonably large values (likely dummy/default values or parsing errors)
  // Also ensure the value is a valid number
  const totalProfileViews = (typeof rawProfileViews === 'number' && !isNaN(rawProfileViews) && rawProfileViews >= 0 && rawProfileViews <= 1000000) 
    ? rawProfileViews 
    : 0;
  
  if (rawProfileViews !== totalProfileViews) {
    console.warn(`⚠️ Profile Views filtered: ${rawProfileViews} -> ${totalProfileViews} (Card ID: ${card.id})`);
  }
  
  console.log(`📊 Profile Views - On-chain only: ${totalProfileViews}`);

  const formatRating = (rating: number) => {
    return (rating / 100).toFixed(1); // Convert from stored format (450 = 4.5 stars)
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleMessageOwner = () => {
    if (!currentAccount?.address) {
      // Redirect to connect wallet or show login modal
      return;
    }
    // Navigate to messages with the card owner
    navigate(`/dashboard-messages?user=${card.owner}`);
  };

  return (
    <Layout>
      <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link to="/browse" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors group">
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Developers</span>
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-8 mb-8">
                  <div className="relative">
                    <img src={card.imageUrl} alt={card.name} className="w-32 h-32 rounded-2xl object-cover ring-4 ring-border shadow-lg"/>
                    {card.verified && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-2 rounded-full shadow-lg">
                        <Shield className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">{card.name}</h1>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold border border-primary/20">
                            {card.niche}
                          </span>
                          {card.verified && (
                            <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
                            card.openToWork 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-500 text-white'
                          }`}>
                            <div className={`h-2 w-2 rounded-full ${
                              card.openToWork ? 'bg-white' : 'bg-white/70'
                            }`}></div>
                            {card.openToWork ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        {card.analytics.averageRating > 0 && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(card.analytics.averageRating / 100)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {formatRating(card.analytics.averageRating)} ({card.analytics.totalReviews} reviews)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      {card.skills.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {card.skills[0]?.yearsExperience ? `${card.skills[0].yearsExperience} yrs` : 'Senior'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span>{card.yearsOfExperience} yrs</span>
                      <span>Card ID: DH-{card.id}</span>
                      <span>{totalProfileViews.toLocaleString()} views</span>
                      <span>Updated {formatDate(card.lastUpdated)}</span>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                {card.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3">About</h3>
                    <p className="text-foreground leading-relaxed">{card.description}</p>
                  </div>
                )}
              </motion.div>

              {/* Work Preferences */}
              {(card.workPreferences.workTypes.length > 0 || card.workPreferences.locationPreference || card.workPreferences.hourlyRate) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
                >
                  <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Briefcase className="h-6 w-6 text-primary" />
                    Work Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {card.workPreferences.workTypes.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Work Types</h4>
                        <div className="flex flex-wrap gap-2">
                          {card.workPreferences.workTypes.map((type, index) => (
                            <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {card.workPreferences.locationPreference && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Location Preference</h4>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">{card.workPreferences.locationPreference}</span>
                        </div>
                      </div>
                    )}
                    {card.workPreferences.hourlyRate && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Hourly Rate</h4>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">${card.workPreferences.hourlyRate}/hour</span>
                        </div>
                      </div>
                    )}
                    {card.workPreferences.availability && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Availability</h4>
                        <span className="text-muted-foreground">{card.workPreferences.availability}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Core Skills */}
              {coreSkills.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
                >
                  <h3 className="text-xl font-semibold text-foreground mb-6">Core Skills</h3>
                  <div className="flex flex-wrap gap-3">
                    {coreSkills.map((skill, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-lg border border-primary/20 font-medium text-sm"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Skills & Expertise */}
              {card.skills.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
                >
                  <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Award className="h-6 w-6 text-primary" />
                    Skills & Expertise
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {card.skills.map((skill, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="p-4 bg-background/50 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{skill.skill}</span>
                          <span className="text-sm text-muted-foreground">{skill.yearsExperience} yrs</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(skill.proficiency / 10) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {skill.proficiency}/10
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Technologies */}
              {technologies.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
                >
                  <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Code2 className="h-6 w-6 text-primary" />
                    Technologies
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {technologies.map((tech, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-all group cursor-default"
                      >
                        <span className="text-primary font-medium text-sm">{tech}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Languages */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
              >
                <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Languages className="h-6 w-6 text-primary" />
                  Languages
                </h3>
                {languages.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {languages.map((language: string, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-all group cursor-default"
                      >
                        <span className="text-primary font-medium text-sm">{language}</span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Languages className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No languages specified</p>
                  </div>
                )}
              </motion.div>

              {/* Featured Projects */}
              {card.featuredProjects && card.featuredProjects.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
                >
                  <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                    <FolderOpen className="h-6 w-6 text-primary" />
                    Featured Projects
                  </h3>
                  <div className="space-y-4">
                    {card.featuredProjects.map((project: FeaturedProject, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-border hover:bg-accent transition-all"
                      >
                        <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {(() => {
                            const thumb = project.thumbnail?.trim() || '';
                            console.log(`🔍 Featured project "${project.title}" thumbnail:`, thumb);
                            
                            if (!thumb) {
                              return <FolderOpen className="h-8 w-8 text-primary/50" />;
                            }
                            
                            // Determine the image URL
                            let imageUrl = thumb;
                            
                            // If it's already a full URL (http/https), use it directly
                            if (thumb.startsWith('http://') || thumb.startsWith('https://')) {
                              imageUrl = thumb;
                            }
                            // If it's a walrus URL, use it directly
                            else if (WalrusService.isWalrusUrl(thumb)) {
                              imageUrl = thumb;
                            }
                            // Otherwise, assume it's a blob ID and construct the walrus URL
                            else {
                              imageUrl = WalrusService.getBlobUrl(thumb);
                            }
                            
                            console.log(`🖼️ Using thumbnail URL for "${project.title}":`, imageUrl);
                            
                            return (
                              <img 
                                src={imageUrl}
                                alt={project.title}
                                className="w-full h-full object-cover"
                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                  console.warn(`⚠️ Failed to load thumbnail for "${project.title}":`, imageUrl);
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  if (target.parentElement) {
                                    target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><svg class="h-8 w-8 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg></div>';
                                  }
                                }}
                                onLoad={() => {
                                  console.log(`✅ Successfully loaded thumbnail for "${project.title}"`);
                                }}
                              />
                            );
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground mb-1">{project.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {project.description || 'No description available'}
                          </p>
                        </div>
                        <a
                          href={project.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2 flex-shrink-0"
                        >
                          Open Link
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Reviews */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    Reviews ({card.reviews.length})
                  </h3>
                  {currentAccount?.address && 
                   currentAccount.address !== card.owner && 
                   !card.reviews.some(r => r.reviewer.toLowerCase() === currentAccount.address?.toLowerCase()) && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Star className="h-4 w-4" />
                      Leave Review
                    </button>
                  )}
                </div>
                {card.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {card.reviews.slice(0, 5).map((review, index) => (
                      <motion.div
                        key={index}
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
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No reviews yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-2">Be the first to leave a review!</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact & Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-6 border border-border shadow-2xl shadow-primary/5 sticky top-24"
              >
                <h3 className="text-xl font-semibold text-foreground mb-6">Get in Touch</h3>
                <div className="space-y-4">
                  {/* Message Owner Button */}
                  {!isOwner && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleMessageOwner}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 mb-4"
                    >
                      <MessageSquare className="h-5 w-5" />
                      Message
                    </motion.button>
                  )}
                  
                  {isOwner ? (
                    <motion.button
                      disabled
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-muted border border-border text-muted-foreground font-semibold rounded-lg cursor-not-allowed opacity-60 mb-4"
                    >
                      <Calendar className="h-5 w-5" />
                      Request Intro Call
                    </motion.button>
                  ) : (
                    <motion.a
                      href={`mailto:${card.contact}?subject=Request%20Intro%20Call&body=Hi%20${encodeURIComponent(card.name)}%2C%0A%0AI%20would%20like%20to%20schedule%20an%20intro%20call%20with%20you.%0A%0AThank%20you%21`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-background border border-border text-foreground font-semibold rounded-lg hover:bg-accent transition-colors mb-4"
                    >
                      <Calendar className="h-5 w-5" />
                      Request Intro Call
                    </motion.a>
                  )}
                  
                  <a href={`mailto:${card.contact}`} className="flex items-center gap-4 p-4 bg-background hover:bg-accent rounded-xl transition-all group border border-border hover:border-primary/50">
                    <div className="p-3 bg-primary/10 text-primary rounded-lg">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground">Email</div>
                      <div className="text-sm text-muted-foreground truncate">{card.contact}</div>
                    </div>
                  </a>
                  
                  {card.portfolio && (
                    <a href={card.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-background hover:bg-accent rounded-xl transition-all group border border-border hover:border-primary/50">
                      <div className="p-3 bg-primary/10 text-primary rounded-lg">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground">Portfolio</div>
                        <div className="text-sm text-muted-foreground truncate">{card.portfolio}</div>
                      </div>
                    </a>
                  )}
                </div>
              </motion.div>

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-6 border border-border shadow-2xl shadow-primary/5"
              >
                <h3 className="text-xl font-semibold text-foreground mb-6">Social Links</h3>
                {(card.socialLinks.github || card.socialLinks.linkedin || card.socialLinks.twitter || card.socialLinks.personalWebsite) ? (
                  <div className="space-y-3">
                    {card.socialLinks.github && (
                      <a href={card.socialLinks.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-background hover:bg-accent rounded-lg transition-all group border border-border hover:border-primary/50">
                        <Github className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        <span className="text-sm text-foreground">GitHub</span>
                      </a>
                    )}
                    {card.socialLinks.linkedin && (
                      <a href={card.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-background hover:bg-accent rounded-lg transition-all group border border-border hover:border-primary/50">
                        <Linkedin className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        <span className="text-sm text-foreground">LinkedIn</span>
                      </a>
                    )}
                    {card.socialLinks.twitter && (
                      <a href={card.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-background hover:bg-accent rounded-lg transition-all group border border-border hover:border-primary/50">
                        <Twitter className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        <span className="text-sm text-foreground">Twitter</span>
                      </a>
                    )}
                    {card.socialLinks.personalWebsite && (
                      <a href={card.socialLinks.personalWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-background hover:bg-accent rounded-lg transition-all group border border-border hover:border-primary/50">
                        <Globe className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        <span className="text-sm text-foreground">Website</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Globe className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No social links provided</p>
                  </div>
                )}
              </motion.div>

              {/* Analytics */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-6 border border-border shadow-2xl shadow-primary/5"
              >
                <h3 className="text-xl font-semibold text-foreground mb-6">Profile Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Profile Views</span>
                    <span className="font-semibold text-foreground">{totalProfileViews.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Contact clicks</span>
                    <span className="font-semibold text-foreground">{(card.analytics.contactClicks ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reviews</span>
                    <span className="font-semibold text-foreground">{card.analytics.totalReviews || 0}</span>
                  </div>
                  {card.analytics.averageRating > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="font-semibold text-foreground">{formatRating(card.analytics.averageRating)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !submittingReview && setShowReviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl p-6 max-w-md w-full border border-border shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Leave a Review</h2>
                <button
                  onClick={() => !submittingReview && setShowReviewModal(false)}
                  disabled={submittingReview}
                  className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setSelectedRating(rating)}
                      onMouseEnter={() => setHoveredRating(rating)}
                      onMouseLeave={() => setHoveredRating(0)}
                      disabled={submittingReview}
                      className="focus:outline-none disabled:opacity-50"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          rating <= (hoveredRating || selectedRating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                  {selectedRating > 0 && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      {selectedRating}/5
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Review (Optional)
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  disabled={submittingReview}
                  placeholder="Share your experience with this developer..."
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 resize-none"
                />
                <div className="text-xs text-muted-foreground mt-1 text-right">
                  {reviewText.length}/500
                </div>
              </div>

              {reviewError && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <p className="text-sm text-destructive">{reviewError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => !submittingReview && setShowReviewModal(false)}
                  disabled={submittingReview}
                  className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || selectedRating === 0}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default CardDetails;
