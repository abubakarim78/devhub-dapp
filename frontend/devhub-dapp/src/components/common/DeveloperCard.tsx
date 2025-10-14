import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { DevCardData } from '@/lib/suiClient'; // Assuming this is your type location
import { ArrowUpRight, Clock } from 'lucide-react';

interface DeveloperCardProps {
  developer: DevCardData;
}

const DeveloperCard: React.FC<DeveloperCardProps> = ({ developer }) => {
  const technologies = developer.technologies.split(',').map(t => t.trim());

  return (
    <motion.div
      className="group relative bg-secondary/50 rounded-2xl p-6 border border-border overflow-hidden h-full flex flex-col"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="absolute top-0 right-0 h-24 w-24 bg-primary/10 rounded-bl-full blur-2xl group-hover:bg-primary/20 transition-all duration-300"></div>
      
      <div className="flex-grow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <img 
              src={developer.imageUrl} 
              alt={developer.name} 
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-border"
            />
            <div>
              <h3 className="font-bold text-lg text-foreground">{developer.name}</h3>
              <p className="text-sm text-primary">{developer.title}</p>
            </div>
          </div>
          <div className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ${
            developer.openToWork
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            {developer.openToWork ? 'Available' : 'Busy'}
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm mb-5 line-clamp-2">
          {developer.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {technologies.slice(0, 3).map(skill => (
            <span key={skill} className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-medium">
              {skill}
            </span>
          ))}
          {technologies.length > 3 && (
            <span className="bg-secondary text-muted-foreground text-xs px-3 py-1 rounded-full font-medium">
              +{technologies.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{developer.yearsOfExperience} years exp.</span>
        </div>
        <Link
          to={`/card/${developer.id}`}
          className="inline-flex items-center gap-1 font-semibold text-sm text-foreground group-hover:text-primary transition-colors"
        >
          View Profile <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
};

export default DeveloperCard;