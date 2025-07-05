import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, ExternalLink, Clock, Calendar, Code2, Briefcase, Loader2 } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { DevCardData } from '../lib/suiClient';

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
        const cardData = await getCardInfo(parseInt(id));
        if (cardData) {
          setCard(cardData);
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
  }, [id, getCardInfo]);

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Profile</h2>
          <p className="text-gray-600">Fetching developer card details...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Code2 className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Card Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The developer card you\'re looking for doesn\'t exist.'}</p>
          <Link
            to="/browse"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Developers
          </Link>
        </div>
      </div>
    );
  }

  const technologies = card.technologies.split(', ');

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/browse"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Browse</span>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <div className="flex items-start space-x-6 mb-6">
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-32 h-32 rounded-2xl object-cover ring-4 ring-white/50 shadow-lg"
                />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{card.name}</h1>
                  <p className="text-xl text-blue-600 font-semibold mb-4">{card.title}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{card.yearsOfExperience} years experience</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Card #{card.id}</span>
                    </div>
                  </div>
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full font-medium ${
                    card.openToWork 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      card.openToWork ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <span>{card.openToWork ? 'Available for work' : 'Currently unavailable'}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {card.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                  <p className="text-gray-600 leading-relaxed">{card.description}</p>
                </div>
              )}
            </div>

            {/* Technologies */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Code2 className="h-5 w-5 text-blue-600" />
                <span>Technologies & Skills</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {technologies.map((tech, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-blue-800 font-medium">{tech}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Blockchain Info */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <span>Blockchain Information</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Owner Address:</span>
                  <span className="font-mono text-sm text-gray-900">
                    {card.owner.slice(0, 6)}...{card.owner.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Card ID:</span>
                  <span className="font-semibold text-gray-900">#{card.id}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Network:</span>
                  <span className="font-semibold text-blue-600">Sui Testnet</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Get in Touch</h3>
              <div className="space-y-3">
                <a
                  href={`mailto:${card.contact}`}
                  className="flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
                >
                  <div className="p-2 bg-blue-600 text-white rounded-lg group-hover:bg-blue-700 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Send Email</div>
                    <div className="text-sm text-gray-600">{card.contact}</div>
                  </div>
                </a>
                <a
                  href={card.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                >
                  <div className="p-2 bg-gray-600 text-white rounded-lg group-hover:bg-gray-700 transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">View Portfolio</div>
                    <div className="text-sm text-gray-600">External link</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Card ID</span>
                  <span className="font-semibold text-gray-900">#{card.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Experience</span>
                  <span className="font-semibold text-gray-900">{card.yearsOfExperience} years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Technologies</span>
                  <span className="font-semibold text-gray-900">{technologies.length}</span>
                </div>
              </div>
            </div>

            {/* Availability Card */}
            <div className={`rounded-2xl p-6 text-white ${
              card.openToWork 
                ? 'bg-gradient-to-r from-green-600 to-teal-600' 
                : 'bg-gradient-to-r from-gray-600 to-gray-700'
            }`}>
              <h3 className="text-lg font-semibold mb-2">Availability Status</h3>
              <p className={`text-sm mb-4 ${
                card.openToWork ? 'text-green-100' : 'text-gray-100'
              }`}>
                {card.openToWork 
                  ? 'Currently available for new projects and opportunities.' 
                  : 'Not available for new projects at the moment.'}
              </p>
              {card.openToWork && (
                <a
                  href={`mailto:${card.contact}`}
                  className="block w-full py-3 bg-white text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors text-center"
                >
                  Contact Now
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetails;