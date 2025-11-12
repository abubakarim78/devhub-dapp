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
      className="group relative bg-secondary/30 backdrop-blur-sm rounded-2xl p-5 border border-border hover:border-primary/50 overflow-hidden h-full flex flex-col shadow-sm hover:shadow-lg transition-all duration-300"
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2, ease: "easeOut" } 
      }}
    >
      {/* Header with avatar and basic info */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative shrink-0">
          <img 
            src={developer.imageUrl} 
            alt={developer.name} 
            className="w-16 h-16 rounded-xl object-cover ring-2 ring-border group-hover:ring-primary/50 transition-all duration-300"
          />
          {developer.verified && (
            <div className="absolute -top-1 -right-1 bg-blue-500 text-white p-1 rounded-full">
              <Shield className="h-2.5 w-2.5" />
            </div>
          )}
          {developer.openToWork && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-background"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
              {developer.name}
            </h3>
            <div className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ml-2 ${
              developer.openToWork
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-muted text-muted-foreground border border-border'
            }`}>
              {developer.openToWork ? 'Available' : 'Busy'}
            </div>
          </div>
          
          <p className="text-sm text-primary font-semibold mb-2">{developer.niche}</p>
          
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{developer.yearsOfExperience}y</span>
            </div>
            {developer.analytics.averageRating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span>{formatRating(developer.analytics.averageRating)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{developer.analytics.totalViews}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Description */}
      {developer.description && (
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
          {developer.description}
        </p>
      )}

      {/* Technologies */}
      <div className="flex flex-wrap gap-2 mb-4">
        {technologies.slice(0, 3).map((skill) => (
          <span 
            key={skill}
            className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md font-medium border border-primary/20"
          >
            {skill}
          </span>
        ))}
        {technologies.length > 3 && (
          <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md font-medium">
            +{technologies.length - 3}
          </span>
        )}
      </div>

      {/* Work preferences */}
      {developer.workPreferences.locationPreference && (
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3 text-primary" />
          <span className="truncate">{developer.workPreferences.locationPreference}</span>
          {developer.workPreferences.hourlyRate && (
            <>
              <span>•</span>
              <span className="font-medium text-foreground">${developer.workPreferences.hourlyRate}/hr</span>
            </>
          )}
        </div>
      )}

      {/* Footer with action */}
      <div className="mt-auto pt-4 border-t border-border">
        <Link
          to={`/card/${developer.id}`}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all group"
        >
          View Profile 
          <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
};

export default DeveloperCard;