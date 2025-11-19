import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, ArrowUpRight, Star, MapPin, Shield, Eye, MessageSquare, Heart } from 'lucide-react';
import { DevCardData } from '@/lib/suiClient';

export interface Developer {
    id: string;
    name: string;
    owner?: string;
    description?: string;
    yearsOfExperience?: number;
    technologies?: string;
    portfolio?: string;
    contact?: string;
    openToWork?: boolean;
    isActive?: boolean;
    imageUrl: string;
    title: string;
    specialties: string;
    location: string;
    status: 'Available' | 'Open to offers' | 'Busy';
    skills: string[];
    repos: number;
    experience: number;
    workload: string;
    rating: number;
}

interface DeveloperCardProps {
  developer: DevCardData;
}

const DeveloperCard: React.FC<DeveloperCardProps> = ({ developer }) => {
  const technologies = developer.technologies.split(',').map(t => t.trim()).filter(Boolean);
  
  const formatRating = (rating: number) => {
    return (rating / 100).toFixed(1);
  };

  return (
    <motion.div
      className="group relative bg-secondary/25 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-border overflow-hidden h-full flex flex-col"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
        <div className="absolute top-0 right-0 h-16 w-16 sm:h-24 sm:w-24 bg-primary/10 rounded-bl-full blur-2xl group-hover:bg-primary/20 transition-all duration-300"></div>
        
        <div className="flex-grow">
          <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <img 
                src={developer.imageUrl} 
                alt={developer.name} 
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl object-cover ring-2 ring-border flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base sm:text-lg text-foreground truncate">{developer.name}</h3>
                <p className="text-xs sm:text-sm text-primary truncate">{developer.niche}</p>
              </div>
            </div>
            <div className={`text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-0.5 sm:py-1 rounded-full flex-shrink-0 ${
              developer.openToWork
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-muted text-muted-foreground border border-border'
            }`}>
              {developer.openToWork ? 'Available' : 'Busy'}
            </div>
          </div>

          {developer.description && (
            <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
              {developer.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {technologies.slice(0, 3).map(skill => (
              <span key={skill} className="bg-primary/10 text-primary text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium">
                {skill}
              </span>
            ))}
            {technologies.length > 3 && (
              <span className="bg-muted text-muted-foreground text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium">
                +{technologies.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-3 sm:pt-4 border-t border-border flex justify-between items-center gap-2 sm:gap-4">
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-muted-foreground">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">{developer.yearsOfExperience} years exp.</span>
          </div>
          <Link
            to={`/card/${developer.id}`}
            className="inline-flex items-center gap-1 font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors flex-shrink-0"
          >
            View <span className="hidden sm:inline">Profile</span> <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Link>
        </div>
    </motion.div>
  );
};

export default DeveloperCard;