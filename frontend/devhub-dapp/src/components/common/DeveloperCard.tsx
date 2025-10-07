import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, MessageSquare, Briefcase, Star, MapPin, GitBranch } from 'lucide-react';

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
    developer: Developer;
}

const statusStyles = {
    Available: 'bg-green-500/20 text-green-400',
    'Open to offers': 'bg-sky-500/20 text-sky-400',
    Busy: 'bg-gray-500/20 text-gray-400',
};

export const DeveloperCard: React.FC<DeveloperCardProps> = ({ developer }) => {
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };

    return (
        <motion.div
            variants={cardVariants}
            className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-white hover:border-brand-purple/50 transition-colors duration-300"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex-shrink-0">
                        <img src={developer.imageUrl} alt={developer.name} className="w-full h-full rounded-full object-cover" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{developer.name}</h3>
                        <p className="text-sm text-gray-400">{`${developer.title} • ${developer.specialties}`}</p>
                        <p className="text-xs text-gray-500 mt-1">{developer.location}</p>
                    </div>
                </div>
                <div className={`text-xs font-medium px-3 py-1 rounded-full ${statusStyles[developer.status]}`}>
                    {developer.status}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
                {developer.skills.slice(0, 4).map((skill) => (
                    <span key={skill} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-md">
                        {skill}
                    </span>
                ))}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 border-t border-gray-800 pt-4">
                <span className="flex items-center gap-1.5"><GitBranch size={14} /> {developer.repos} repos</span>
                <span className="flex items-center gap-1.5"><Star size={14} /> {developer.rating.toFixed(1)} rating</span>
                <span className="flex items-center gap-1.5"><Briefcase size={14} /> {developer.workload}</span>
            </div>

            <div className="flex items-center gap-3">
                <Link
                    to={`/card/${developer.id}`}
                    className="flex-1 text-center font-semibold bg-gray-800 hover:bg-gray-700 py-2.5 px-4 rounded-lg transition-colors"
                >
                    View Profile
                </Link>
                <button className="flex-1 text-center font-semibold bg-brand-purple hover:bg-brand-purple-dark py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <MessageSquare size={16} />
                    Message
                </button>
            </div>
        </motion.div>
    );
};