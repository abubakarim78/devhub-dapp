import React, { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle,
  Star,
  Eye,
  MessageSquare,
  ExternalLink,
  TrendingUp,
  Activity,
  CheckCircle2
} from 'lucide-react';
import StarBackground from '@/components/common/StarBackground';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useTheme } from '@/contexts/ThemeContext';

interface Project {
  id: string;
  title: string;
  short_summary: string;
  description: string;
  category: string;
  experience_level: string;
  budget_min: number;
  budget_max: number;
  timeline_weeks: number;
  required_skills: string[];
  owner: string;
  applications_status: string;
  creation_timestamp: number;
  views: number;
  applications: number;
  rating: number;
}

const DashboardProjects: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { theme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // TODO: Fetch projects from the blockchain
    // This is a placeholder for actual blockchain integration
    const fetchProjects = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Mock data for demonstration
        const mockProjects: Project[] = [
          {
            id: '1',
            title: 'Sui Grants Portal',
            short_summary: 'Build submission UI and on-chain verification',
            description: 'Create a comprehensive grants portal for the Sui ecosystem with submission UI, on-chain verification, and review system.',
            category: 'Web3',
            experience_level: 'Senior',
            budget_min: 5000,
            budget_max: 15000,
            timeline_weeks: 8,
            required_skills: ['React', 'TypeScript', 'Sui SDK', 'Move'],
            owner: '0x123...abc',
            applications_status: 'Open',
            creation_timestamp: Date.now() - 86400000,
            views: 45,
            applications: 12,
            rating: 4.8
          },
          {
            id: '2',
            title: 'DEX Analytics Dashboard',
            short_summary: 'Data visualization for swaps and liquidity',
            description: 'Build an analytics dashboard for DEX operations with real-time data visualization and trading insights.',
            category: 'DeFi',
            experience_level: 'Mid',
            budget_min: 3000,
            budget_max: 8000,
            timeline_weeks: 6,
            required_skills: ['Vue.js', 'D3.js', 'Web3', 'Analytics'],
            owner: '0x456...def',
            applications_status: 'Open',
            creation_timestamp: Date.now() - 172800000,
            views: 32,
            applications: 8,
            rating: 4.6
          },
          {
            id: '3',
            title: 'Sui Wallet SDK Examples',
            short_summary: 'Create templates for common flows',
            description: 'Develop comprehensive SDK examples and templates for common wallet integration patterns.',
            category: 'Tools',
            experience_level: 'Junior',
            budget_min: 2000,
            budget_max: 5000,
            timeline_weeks: 4,
            required_skills: ['JavaScript', 'Sui SDK', 'Documentation'],
            owner: '0x789...ghi',
            applications_status: 'Closed',
            creation_timestamp: Date.now() - 259200000,
            views: 28,
            applications: 15,
            rating: 4.9
          },
          {
            id: '4',
            title: 'NFT Marketplace Integration',
            short_summary: 'Integrate NFT marketplace with Sui blockchain',
            description: 'Build a comprehensive NFT marketplace with minting, trading, and auction functionality.',
            category: 'NFT',
            experience_level: 'Senior',
            budget_min: 8000,
            budget_max: 20000,
            timeline_weeks: 12,
            required_skills: ['React', 'Solidity', 'IPFS', 'Web3'],
            owner: '0xabc...123',
            applications_status: 'Open',
            creation_timestamp: Date.now() - 345600000,
            views: 67,
            applications: 23,
            rating: 4.7
          }
        ];
        
        setProjects(mockProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' || project.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate project statistics
  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.applications_status === 'Open').length,
    completed: projects.filter(p => p.applications_status === 'Closed').length,
    totalBudget: projects.reduce((sum, p) => sum + p.budget_max, 0),
    avgRating: projects.length > 0 ? projects.reduce((sum, p) => sum + p.rating, 0) / projects.length : 0
  };

  const categories = [
    'all',
    'Web3',
    'DeFi',
    'NFT',
    'Gaming',
    'Infrastructure',
    'Tools',
  ];

  // User not connected state
  if (!currentAccount) {
    return (
      <div className="bg-background min-h-screen pt-16 flex items-center justify-center relative">
        <StarBackground />
        <div className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30"
          >
            <FolderKanban className="h-16 w-16 text-primary" />
          </motion.div>
          <h2 className="text-4xl font-bold text-foreground mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-8 text-lg">You need to connect your Sui wallet to access projects.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen text-foreground relative">
      <StarBackground />
      
      <div className="relative z-10 pt-32 pb-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <DashboardSidebar />
            
            <main className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key="projects-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  {/* Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <FolderKanban className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold text-foreground">Projects</h1>
                        <p className="text-muted-foreground mt-1">
                          Browse and manage development projects
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-lg"
                    >
                      <Plus size={20} />
                      Create Project
                    </motion.button>
                  </motion.div>

                  {/* Project Stats Cards */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                  >
                    {/* Total Projects Card */}
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-xl border border-blue-500/20 rounded-xl p-6 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-10 translate-x-10"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-blue-500/20 rounded-lg">
                            <FolderKanban className="h-6 w-6 text-blue-500" />
                          </div>
                          <TrendingUp className="h-5 w-5 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-1">
                          {projectStats.total}
                        </h3>
                        <p className="text-muted-foreground text-sm">Total Projects</p>
                        <div className="mt-2 text-xs text-blue-500 font-medium">
                          +12% from last month
                        </div>
                      </div>
                    </motion.div>

                    {/* Active Projects Card */}
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-xl border border-green-500/20 rounded-xl p-6 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-10 translate-x-10"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-green-500/20 rounded-lg">
                            <Activity className="h-6 w-6 text-green-500" />
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-1">
                          {projectStats.active}
                        </h3>
                        <p className="text-muted-foreground text-sm">Active Projects</p>
                        <div className="mt-2 text-xs text-green-500 font-medium">
                          {projectStats.total > 0 ? Math.round((projectStats.active / projectStats.total) * 100) : 0}% of total
                        </div>
                      </div>
                    </motion.div>

                    {/* Completed Projects Card */}
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-10 translate-x-10"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-purple-500/20 rounded-lg">
                            <CheckCircle2 className="h-6 w-6 text-purple-500" />
                          </div>
                          <Star className="h-5 w-5 text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-1">
                          {projectStats.completed}
                        </h3>
                        <p className="text-muted-foreground text-sm">Completed</p>
                        <div className="mt-2 text-xs text-purple-500 font-medium">
                          {projectStats.avgRating.toFixed(1)}★ avg rating
                        </div>
                      </div>
                    </motion.div>

                    {/* Total Budget Card */}
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 backdrop-blur-xl border border-orange-500/20 rounded-xl p-6 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -translate-y-10 translate-x-10"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-orange-500/20 rounded-lg">
                            <DollarSign className="h-6 w-6 text-orange-500" />
                          </div>
                          <TrendingUp className="h-5 w-5 text-orange-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-1">
                          ${(projectStats.totalBudget / 1000).toFixed(0)}k
                        </h3>
                        <p className="text-muted-foreground text-sm">Total Budget</p>
                        <div className="mt-2 text-xs text-orange-500 font-medium">
                          ${Math.round(projectStats.totalBudget / projectStats.total).toLocaleString()} avg
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Search and Filter Bar */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <Search
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                          size={20}
                        />
                        <input
                          type="text"
                          placeholder="Search projects..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-card/70 backdrop-blur-xl border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                        />
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-4 py-3 bg-card/70 backdrop-blur-xl border border-border rounded-lg hover:bg-accent transition-colors"
                      >
                        <Filter size={20} />
                        Filters
                      </motion.button>
                    </div>

                    {/* Category Pills */}
                    <div className="flex gap-2 flex-wrap">
                      {categories.map((category) => (
                        <motion.button
                          key={category}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFilterCategory(category)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            filterCategory === category
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card/70 backdrop-blur-xl text-muted-foreground hover:bg-accent border border-border'
                          }`}
                        >
                          {category === 'all' ? 'All Categories' : category}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Projects Grid */}
                  {loading ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredProjects.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      {filteredProjects.map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -5 }}
                          className={`bg-card/70 backdrop-blur-xl border border-border rounded-lg p-6 hover:shadow-lg transition-all ${
                            theme === 'dark' 
                              ? 'hover:border-primary/50' 
                              : 'hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                              {project.category}
                            </span>
                            {project.applications_status === 'Open' ? (
                              <span className="flex items-center gap-1 text-green-500 text-xs">
                                <CheckCircle size={14} />
                                Open
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                                <XCircle size={14} />
                                Closed
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-bold text-foreground mb-2">
                            {project.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                            {project.short_summary}
                          </p>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <DollarSign size={16} />
                              <span>
                                ${project.budget_min.toLocaleString()} - $
                                {project.budget_max.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock size={16} />
                              <span>{project.timeline_weeks} weeks</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users size={16} />
                              <span>{project.experience_level}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.required_skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded"
                              >
                                {skill}
                              </span>
                            ))}
                            {project.required_skills.length > 3 && (
                              <span className="px-2 py-1 text-muted-foreground text-xs">
                                +{project.required_skills.length - 3} more
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Eye size={14} />
                                <span>{project.views}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare size={14} />
                                <span>{project.applications}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star size={14} className="text-yellow-500" />
                                <span>{project.rating}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              View Details
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                            >
                              <ExternalLink size={16} />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-20"
                    >
                      <FolderKanban className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        No projects found
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {currentAccount
                          ? 'Be the first to create a project!'
                          : 'Connect your wallet to view and create projects'}
                      </p>
                      {currentAccount && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowCreateModal(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          <Plus size={20} />
                          Create Your First Project
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card/90 backdrop-blur-xl border border-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground">
                  Create New Project
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </motion.button>
              </div>
              <p className="text-muted-foreground mb-4">
                Project creation form will be implemented here with integration
                to the smart contract.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(false)}
                className="w-full py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardProjects;
