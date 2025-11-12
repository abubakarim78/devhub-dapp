import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, ExternalLink, Clock, Calendar, Code2, Loader2, MessageSquare, Star, MapPin, Briefcase, Globe, Github, Linkedin, Twitter, Award, Eye, TrendingUp, Users, CheckCircle, Shield, Languages, Heart, DollarSign } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { DevCardData } from '../lib/suiClient';
import { incrementView } from '../lib/analytics';
import Layout from '@/components/common/Layout';
import { motion } from 'framer-motion';
import { useCurrentAccount } from '@mysten/dapp-kit';

const CardDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { getCardInfo } = useContract();
  const [card, setCard] = useState<DevCardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
          incrementView(numericId);
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
  }, [id, getCardInfo]);

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
  const isOwner = currentAccount?.address === card.owner;

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
    <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="pt-24 pb-16">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link to="/browse" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors group">
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Developers</span>
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-secondary/50 backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border border-border shadow-2xl shadow-primary/5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8">
                  <img src={card.imageUrl} alt={card.name} className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl sm:rounded-2xl object-cover ring-2 sm:ring-4 ring-border shadow-lg mx-auto sm:mx-0"/>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1">{card.name}</h1>
                        <p className="text-base sm:text-lg md:text-xl text-primary font-semibold">{card.niche}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                      <div className="flex items-center gap-1.5 sm:gap-2"><Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" /><span>{card.yearsOfExperience} years experience</span></div>
                      <div className="flex items-center gap-1.5 sm:gap-2"><Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" /><span>Card ID: #{card.id}</span></div>
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
                        <div className="flex items-center gap-3 mb-2">
                          <h1 className="text-4xl font-bold text-foreground">{card.name}</h1>
                          {card.verified && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </div>
                          )}
                        </div>
                        <p className="text-xl text-primary font-semibold mb-2">{card.niche}</p>
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
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{card.yearsOfExperience} years experience</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        <span>{card.analytics.totalViews} profile views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>Joined {formatDate(card.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm ${
                      card.openToWork 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}>
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${card.openToWork ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`}></div>
                      <span>{card.openToWork ? 'Available for work' : 'Currently busy'}</span>
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

              {/* Skills */}
              {card.skills.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
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
                          <span className="text-sm text-muted-foreground">{skill.yearsExperience}y exp</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(skill.proficiency / 10) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {skill.proficiency}/10 proficiency
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
              {card.languages.length > 0 && (
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
                  <div className="flex flex-wrap gap-3">
                    {card.languages.map((language, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        className="px-4 py-2 bg-accent rounded-lg border border-border"
                      >
                        <span className="text-foreground font-medium text-sm">{language}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Featured Projects */}
              {card.featuredProjects.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
                >
                  <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Featured Projects
                  </h3>
                  <div className="space-y-4">
                    {card.featuredProjects.map((project, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-4 bg-background/50 rounded-lg border border-border hover:bg-accent transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <ExternalLink className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{project}</h4>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Reviews */}
              {card.reviews.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
                >
                  <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    Reviews ({card.reviews.length})
                  </h3>
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
                        <div className="text-xs text-muted-foreground font-mono">
                          From: {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
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
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                    >
                      <MessageSquare className="h-5 w-5" />
                      Message {card.name.split(' ')[0]}
                    </motion.button>
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
              {(card.socialLinks.github || card.socialLinks.linkedin || card.socialLinks.twitter || card.socialLinks.personalWebsite) && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-6 border border-border shadow-2xl shadow-primary/5"
                >
                  <h3 className="text-xl font-semibold text-foreground mb-6">Social Links</h3>
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
                </motion.div>
              )}

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
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Total Views</span>
                    </div>
                    <span className="font-semibold text-foreground">{card.analytics.totalViews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Monthly Views</span>
                    </div>
                    <span className="font-semibold text-foreground">{card.analytics.monthlyViews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Contact Clicks</span>
                    </div>
                    <span className="font-semibold text-foreground">{card.analytics.contactClicks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Reviews</span>
                    </div>
                    <span className="font-semibold text-foreground">{card.analytics.totalReviews}</span>
                  </div>
                  {card.analytics.averageRating > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Average Rating</span>
                      </div>
                      <span className="font-semibold text-foreground">{formatRating(card.analytics.averageRating)}/5</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default CardDetails;
