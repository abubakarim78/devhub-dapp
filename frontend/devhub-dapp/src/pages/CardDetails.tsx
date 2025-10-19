import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, ExternalLink, Clock, Calendar, Code2, Loader2, Star } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { DevCardData } from '../lib/suiClient';
import { incrementView } from '../lib/analytics';
import StarBackground from '@/components/common/StarBackground';
import { motion } from 'framer-motion';

const CardDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
      <div className="bg-background min-h-screen flex items-center justify-center relative">
        <StarBackground/>
        <div className="text-center relative z-10">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Loading Profile...</h2>
          <p className="text-muted-foreground">Fetching developer details from the blockchain.</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center relative">
        <StarBackground/>
        <div className="text-center relative z-10 max-w-md mx-auto px-4">
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
    );
  }

  const technologies = card.technologies.split(',').map(t => t.trim()).filter(Boolean);

  return (
    <div className="bg-background min-h-screen text-foreground relative">
      <StarBackground/>
      
      <div className="relative z-10 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link to="/browse" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors group">
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Developers</span>
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-8 mb-8">
                  <img src={card.imageUrl} alt={card.name} className="w-32 h-32 rounded-2xl object-cover ring-4 ring-border shadow-lg"/>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h1 className="text-4xl font-bold text-foreground mb-1">{card.name}</h1>
                        <p className="text-xl text-primary font-semibold">{card.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><span>{card.yearsOfExperience} years experience</span></div>
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /><span>Card ID: #{card.id}</span></div>
                    </div>
                    
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${
                      card.openToWork 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${card.openToWork ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`}></div>
                      <span>{card.openToWork ? 'Available for work' : 'Currently busy'}</span>
                    </div>
                  </div>
                </div>

                {card.description && (
                  <div className="pt-6 border-t border-border">
                    <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><Star className="h-5 w-5 text-yellow-400" />About</h3>
                    <p className="text-muted-foreground leading-relaxed text-base">{card.description}</p>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
              >
                <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2"><Code2 className="h-6 w-6 text-primary" />Technologies & Skills</h3>
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
            </div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-6 border border-border shadow-2xl shadow-primary/5 sticky top-24"
              >
                <h3 className="text-xl font-semibold text-foreground mb-6">Get in Touch</h3>
                <div className="space-y-4">
                  <a href={`mailto:${card.contact}`} className="flex items-center gap-4 p-4 bg-background hover:bg-accent rounded-xl transition-all group border border-border hover:border-primary/50">
                    <div className="p-3 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20"><Mail className="h-5 w-5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground">Email</div>
                      <div className="text-sm text-muted-foreground truncate">{card.contact}</div>
                    </div>
                  </a>
                  <a href={card.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-background hover:bg-accent rounded-xl transition-all group border border-border hover:border-primary/50">
                    <div className="p-3 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20"><ExternalLink className="h-5 w-5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground">Portfolio</div>
                      <div className="text-sm text-muted-foreground truncate">{card.portfolio}</div>
                    </div>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetails;