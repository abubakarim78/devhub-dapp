import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, ExternalLink, Clock, Calendar, Code2, Briefcase, Loader2, Share2, Star } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { DevCardData } from '../lib/suiClient';
import { incrementView } from '../lib/analytics';
import StarBackground from '@/components/common/StarBackground';
import { motion } from 'framer-motion';

const CardDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getCardInfo } = useContract();
  const [card, setCard] = useState<DevCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCard = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const numericId = parseInt(id);
        const cardData = await getCardInfo(numericId);
        if (cardData) {
          setCard(cardData);
          incrementView(numericId);
        } else {
          setError('Card not found');
        }
      } catch (err) {
        console.error('Error fetching card:', err);
        setError('Failed to load card details');
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-black min-h-screen pt-16 flex items-center justify-center relative">
        <StarBackground/>
        <div className="text-center relative z-10">
          <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">Loading Profile</h2>
          <p className="text-gray-400">Fetching developer card details from blockchain...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="bg-black min-h-screen pt-16 flex items-center justify-center relative">
        <StarBackground/>
        <div className="text-center relative z-10 max-w-md mx-auto px-4">
          <div className="w-32 h-32 bg-red-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <Code2 className="h-16 w-16 text-red-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Card Not Found</h2>
          <p className="text-gray-400 mb-8 text-lg">
            {error || 'The developer card you\'re looking for doesn\'t exist.'}
          </p>
          <Link
            to="/browse"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
          >
            Browse Developers
          </Link>
        </div>
      </div>
    );
  }

  const technologies = card.technologies.split(', ');

  return (
    <div className="bg-black min-h-screen text-white relative">
      <StarBackground/>
      
      <div className="relative z-10 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              to="/browse"
              className="inline-flex items-center space-x-2 text-gray-400 hover:text-blue-400 mb-8 transition-colors group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Browse</span>
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Profile */}
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-900/70 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl"
              >
                <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-8">
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-40 h-40 rounded-2xl object-cover ring-4 ring-blue-500/30 shadow-2xl shadow-blue-500/20"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                          {card.name}
                        </h1>
                        <p className="text-xl text-blue-400 font-semibold mb-4">{card.title}</p>
                      </div>
                      <button className="p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-colors border border-gray-700/50">
                        <Share2 className="h-5 w-5 text-gray-300" />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                      <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700/30">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span>{card.yearsOfExperience} years experience</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700/30">
                        <Calendar className="h-4 w-4 text-purple-400" />
                        <span>Card #{card.id}</span>
                      </div>
                    </div>
                    
                    <div className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-full font-semibold border-2 ${
                      card.openToWork 
                        ? 'bg-green-500/20 text-green-400 border-green-500/40' 
                        : 'bg-gray-700/50 text-gray-400 border-gray-600/40'
                    }`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        card.openToWork ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                      }`}></div>
                      <span>{card.openToWork ? 'Available for work' : 'Currently unavailable'}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {card.description && (
                  <div className="pt-6 border-t border-gray-700/50">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-400" />
                      <span>About</span>
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-lg">{card.description}</p>
                  </div>
                )}
              </motion.div>

              {/* Technologies */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-gray-900/70 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl"
              >
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                  <Code2 className="h-6 w-6 text-blue-400" />
                  <span>Technologies & Skills</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {technologies.map((tech, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="flex items-center space-x-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 hover:border-blue-400/50 transition-all group cursor-pointer"
                    >
                      <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:scale-125 transition-transform"></div>
                      <span className="text-blue-300 font-medium group-hover:text-blue-200 transition-colors">{tech}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Blockchain Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-gray-900/70 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl"
              >
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                  <Briefcase className="h-6 w-6 text-purple-400" />
                  <span>Blockchain Information</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-colors">
                    <span className="text-gray-400 font-medium">Owner Address:</span>
                    <span className="font-mono text-sm text-white bg-gray-900/50 px-3 py-1 rounded-lg">
                      {card.owner.slice(0, 8)}...{card.owner.slice(-6)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-colors">
                    <span className="text-gray-400 font-medium">Card ID:</span>
                    <span className="font-bold text-white text-lg">#{card.id}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-colors">
                    <span className="text-gray-400 font-medium">Network:</span>
                    <span className="font-semibold text-blue-400 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span>Sui Testnet</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-gray-900/70 backdrop-blur-xl rounded-3xl p-6 border border-gray-700/50 shadow-2xl sticky top-24"
              >
                <h3 className="text-xl font-semibold text-white mb-6">Get in Touch</h3>
                <div className="space-y-4">
                  <a
                    href={`mailto:${card.contact}`}
                    className="flex items-center space-x-4 p-4 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl transition-all group border border-blue-500/30 hover:border-blue-400/50 transform hover:scale-[1.02]"
                  >
                    <div className="p-3 bg-blue-600 text-white rounded-xl group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white mb-1">Send Email</div>
                      <div className="text-sm text-blue-300 truncate">{card.contact}</div>
                    </div>
                  </a>
                  <a
                    href={card.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-4 p-4 bg-gray-700/30 hover:bg-gray-700/50 rounded-xl transition-all group border border-gray-600/30 hover:border-gray-500/50 transform hover:scale-[1.02]"
                  >
                    <div className="p-3 bg-gray-600 text-white rounded-xl group-hover:bg-gray-500 transition-colors">
                      <ExternalLink className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white mb-1">View Portfolio</div>
                      <div className="text-sm text-gray-400">External link</div>
                    </div>
                  </a>
                </div>

                {/* Stats */}
                <div className="mt-8 pt-6 border-t border-gray-700/50">
                  <h4 className="text-lg font-semibold text-white mb-4">Profile Stats</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                      <span className="text-gray-400">Card ID</span>
                      <span className="font-bold text-white">#{card.id}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                      <span className="text-gray-400">Experience</span>
                      <span className="font-bold text-white">{card.yearsOfExperience} years</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                      <span className="text-gray-400">Technologies</span>
                      <span className="font-bold text-white">{technologies.length}</span>
                    </div>
                  </div>
                </div>

                {/* Availability Card */}
                <div className={`mt-6 rounded-2xl p-6 text-white shadow-xl ${
                  card.openToWork 
                    ? 'bg-gradient-to-br from-green-600 to-teal-600 border-2 border-green-400/30' 
                    : 'bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600/30'
                }`}>
                  <h4 className="text-lg font-semibold mb-2 flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      card.openToWork ? 'bg-green-300 animate-pulse' : 'bg-gray-400'
                    }`}></div>
                    <span>Availability Status</span>
                  </h4>
                  <p className={`text-sm mb-5 ${
                    card.openToWork ? 'text-green-100' : 'text-gray-300'
                  }`}>
                    {card.openToWork 
                      ? 'Currently available for new projects and opportunities.' 
                      : 'Not available for new projects at the moment.'}
                  </p>
                  {card.openToWork && (
                    <a
                      href={`mailto:${card.contact}`}
                      className="block w-full py-3 bg-white text-green-600 font-bold rounded-xl hover:bg-green-50 transition-all text-center transform hover:scale-105 shadow-lg"
                    >
                      Contact Now
                    </a>
                  )}
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