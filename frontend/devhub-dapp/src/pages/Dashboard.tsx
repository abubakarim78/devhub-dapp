import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { User, AlertCircle, CheckCircle, Activity, X, Search, Star, Zap, Briefcase, Users, Wallet, Send, Download, Loader2 } from 'lucide-react';
import StarBackground from '@/components/common/StarBackground';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useContract } from '@/hooks/useContract';
import { 
  getPlatformStatistics,
  getCardCount,
  getProjectCount,
  getPlatformFeeBalance,
  getAllActiveCards,
  getOpenProjects,
  getSuggestedDevelopers
} from '@/lib/suiClient';

interface DashboardStats {
  activeProjects: number;
  newMessages: number;
  profileViews: number;
  profileHealth: number;
}

interface ActivityItem {
  id: string;
  type: 'review' | 'connection' | 'payment' | 'project';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'pending' | 'warning';
}

interface SuggestedDeveloper {
  id: string;
  name: string;
  avatar: string;
  skills: string;
  status: 'available' | 'busy' | 'offline';
  verified?: boolean;
  experience?: number;
  views?: number;
}

interface OpenProject {
  id: string;
  title: string;
  description: string;
  budget?: string;
  skills: string[];
  status: 'open' | 'in-progress' | 'completed';
}

// Toast Component
const Toast: React.FC<{
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className={`flex items-center space-x-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl ${type === 'success'
        ? 'bg-green-500/20 border border-green-500/40'
        : 'bg-red-500/20 border border-red-500/40'
        }`}>
        {type === 'success' ? (
          <CheckCircle className="h-5 w-5 text-green-400" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-400" />
        )}
        <span className={`font-medium ${type === 'success' ? 'text-green-100' : 'text-red-100'
          }`}>
          {message}
        </span>
        <button
          onClick={onClose}
          className={`ml-2 ${type === 'success' ? 'text-green-300 hover:text-green-100' : 'text-red-300 hover:text-red-100'
            }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};





const Dashboard: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { theme } = useTheme();
  const { getUserCards, useConnections } = useContract();
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    newMessages: 0,
    profileViews: 0,
    profileHealth: 0
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [suggestedDevelopers, setSuggestedDevelopers] = useState<SuggestedDeveloper[]>([]);
  const [openProjects, setOpenProjects] = useState<OpenProject[]>([]);
  const [userCards, setUserCards] = useState<any[]>([]);

  const closeToast = () => {
    setToast(null);
  };

  // Load dashboard data on component mount
  useEffect(() => {
    if (currentAccount?.address) {
      loadDashboardData();
    }
  }, [currentAccount?.address]);

  const loadDashboardData = useCallback(async () => {
    if (!currentAccount?.address) return;
    
    setLoading(true);
    try {
      // Load user cards
      const cards = await getUserCards(currentAccount.address);
      setUserCards(cards);
      
      // Load platform statistics
      const cardCount = await getCardCount();
      const projectCount = await getProjectCount();
      
      // Calculate profile health based on card completeness
      const profileHealth = cards.length > 0 ? 
        Math.min(100, (cards[0]?.bio ? 20 : 0) + (cards[0]?.skills?.length > 0 ? 20 : 0) + 
        (cards[0]?.location ? 20 : 0) + (cards[0]?.website ? 20 : 0) + (cards[0]?.github ? 20 : 0)) : 0;
      
      setStats({
        activeProjects: Math.floor(Math.random() * 5) + 1, // Mock for now
        newMessages: Math.floor(Math.random() * 20) + 1, // Mock for now
        profileViews: Math.floor(Math.random() * 100) + 10, // Mock for now
        profileHealth
      });
      
      // Load activities (mock for now)
      setActivities([
        {
          id: '1',
          type: 'review',
          title: 'You received a 5★ review',
          description: 'From Maya Code on Sui Wallet Audit',
          timestamp: '2h ago',
          status: 'success'
        },
        {
          id: '2',
          type: 'connection',
          title: 'New connection',
          description: 'Ken Builder wants to connect',
          timestamp: '4h ago',
          status: 'pending'
        },
        {
          id: '3',
          type: 'payment',
          title: 'Project milestone paid',
          description: 'Sui Explorer UI • Milestone 2',
          timestamp: 'Yesterday',
          status: 'success'
        }
      ]);
      
      // Load suggested developers using the new smart suggestion algorithm
      const suggestedCards = await getSuggestedDevelopers(3, currentAccount.address);
      const suggestions = suggestedCards.map((card, index) => {
        const cardName = typeof card?.name === 'string' ? card.name : `Developer ${index + 1}`;
        const firstChar = typeof cardName === 'string' && cardName.length > 0 ? cardName.charAt(0).toUpperCase() : 'D';
        
        // Get skills from the card data
        const skillsText = card?.technologies || 'Developer';
        
        // Determine status based on card data
        let status: 'available' | 'busy' | 'offline' = 'available';
        if (card?.analytics?.totalViews > 100) {
          status = 'busy'; // High-profile developers might be busier
        }
        
        return {
          id: card?.id ? card.id.toString() : `developer-${index + 1}`,
          name: cardName,
          avatar: firstChar,
          skills: skillsText,
          status: status,
          verified: card?.verified || false,
          experience: card?.yearsOfExperience || 0,
          views: card?.analytics?.totalViews || 0
        };
      });
      setSuggestedDevelopers(suggestions);
      
      // Load open projects
      const projects = await getOpenProjects();
      const openProjectsData = projects.slice(0, 3).map((project, index) => ({
        id: project?.id ? project.id.toString() : `project-${index + 1}`,
        title: typeof project?.title === 'string' ? project.title : `Project ${index + 1}`,
        description: typeof project?.description === 'string' ? project.description : 'No description available',
        budget: typeof project?.budget === 'string' ? project.budget : 'TBD',
        skills: Array.isArray(project?.requiredSkills) ? project.requiredSkills : [],
        status: 'open' as const
      }));
      setOpenProjects(openProjectsData);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setToast({ message: 'Failed to load dashboard data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentAccount?.address, getUserCards]);



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
            <User className="h-16 w-16 text-primary" />
          </motion.div>
          <h2 className="text-4xl font-bold text-foreground mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-8 text-lg">You need to connect your Sui wallet to access your dashboard.</p>
          <div className="bg-primary/10 backdrop-blur-sm p-6 rounded-xl border border-primary/30 max-w-md mx-auto">
            <p className="text-primary">
              Connect your wallet to view and manage your developer card.
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="bg-background min-h-screen text-foreground relative">
      <StarBackground />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      <div className="relative z-10 pt-32 pb-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <DashboardSidebar />
            
            <main className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key="dashboard-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  {/* Dashboard Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent mb-4">
                      Dashboard
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8">
                      Welcome back. Track your activity, opportunities, and profile health.
                    </p>
                    
                    {/* Refresh Button */}
                    <div className="flex items-center gap-4 mb-6">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={loadDashboardData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Activity className="h-4 w-4" />
                        )}
                        {loading ? 'Loading...' : 'Refresh Data'}
                      </motion.button>
                      {userCards.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {userCards.length} developer card{userCards.length !== 1 ? 's' : ''} found
                        </div>
                      )}
                    </div>
                    
                    {/* Search and Action Buttons */}
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <div className="flex-1 max-w-md">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search developers, projects"
                            className="w-full pl-10 pr-4 py-3 bg-background/70 backdrop-blur-xl border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 items-center">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg"
                        >
                          <Link to="/create" className="block">
                            Create Profile
                          </Link>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all shadow-lg"
                        >
                          Post a Project
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Key Metrics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`rounded-2xl p-6 shadow-2xl cursor-pointer transition-all ${
                        theme === 'dark' 
                          ? 'bg-gradient-to-br from-primary/20 to-primary/30 border border-primary/30 text-primary-foreground' 
                          : 'bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20 text-primary'
                      }`}
                    >
                      <div className="text-3xl font-bold mb-2">
                        {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.activeProjects}
                      </div>
                      <div className={`font-medium ${theme === 'dark' ? 'text-primary-foreground/80' : 'text-primary/80'}`}>Active Projects</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`rounded-2xl p-6 shadow-2xl cursor-pointer transition-all ${
                        theme === 'dark' 
                          ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/30 border border-blue-500/30 text-blue-100' 
                          : 'bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/20 text-blue-600'
                      }`}
                    >
                      <div className="text-3xl font-bold mb-2">
                        {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.newMessages}
                      </div>
                      <div className={`font-medium ${theme === 'dark' ? 'text-blue-100/80' : 'text-blue-600/80'}`}>New Messages</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`rounded-2xl p-6 shadow-2xl cursor-pointer transition-all ${
                        theme === 'dark' 
                          ? 'bg-gradient-to-br from-green-500/20 to-green-600/30 border border-green-500/30 text-green-100' 
                          : 'bg-gradient-to-br from-green-500/10 to-green-600/20 border border-green-500/20 text-green-600'
                      }`}
                    >
                      <div className="text-3xl font-bold mb-2">
                        {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.profileViews}
                      </div>
                      <div className={`font-medium ${theme === 'dark' ? 'text-green-100/80' : 'text-green-600/80'}`}>Profile Views</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`rounded-2xl p-6 shadow-2xl cursor-pointer transition-all ${
                        theme === 'dark' 
                          ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/30 border border-orange-500/30 text-orange-100' 
                          : 'bg-gradient-to-br from-orange-500/10 to-orange-600/20 border border-orange-500/20 text-orange-600'
                      }`}
                    >
                      <div className="text-3xl font-bold mb-2">
                        {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : `${stats.profileHealth}%`}
                      </div>
                      <div className={`font-medium ${theme === 'dark' ? 'text-orange-100/80' : 'text-orange-600/80'}`}>Profile Health</div>
                    </motion.div>
                  </div>

                  {/* Dashboard Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Activity */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl transition-all cursor-pointer ${
                        theme === 'dark' 
                          ? 'hover:border-blue-500/50' 
                          : 'hover:border-blue-500/30'
                      }`}
                    >
                  <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Activity className="h-6 w-6 text-primary" />
                    Recent Activity
                  </h3>
                      <div className="space-y-4">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : activities.length === 0 ? (
                          <div className="text-center py-8">
                            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No recent activity</p>
                          </div>
                        ) : (
                          activities.map((activity, index) => (
                            <motion.div
                              key={activity.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                              className={`flex items-start gap-3 p-4 rounded-xl border ${
                                activity.type === 'review' ? 'bg-green-500/10 border-green-500/20' :
                                activity.type === 'connection' ? 'bg-blue-500/10 border-blue-500/20' :
                                activity.type === 'payment' ? 'bg-orange-500/10 border-orange-500/20' :
                                'bg-purple-500/10 border-purple-500/20'
                              }`}
                            >
                              {activity.type === 'review' && <Star className="h-5 w-5 text-green-400 mt-1" />}
                              {activity.type === 'connection' && <Zap className="h-5 w-5 text-blue-400 mt-1" />}
                              {activity.type === 'payment' && <Briefcase className="h-5 w-5 text-orange-400 mt-1" />}
                              {activity.type === 'project' && <Briefcase className="h-5 w-5 text-purple-400 mt-1" />}
                              <div className="flex-1">
                                <div className="font-semibold text-foreground">{activity.title}</div>
                                <div className="text-sm text-muted-foreground">{activity.description}</div>
                                <div className="text-xs text-muted-foreground mt-1">{activity.timestamp}</div>
                                {activity.type === 'connection' && (
                                  <div className="flex gap-2 mt-2">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                                    >
                                      Ignore
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                      Accept
                                    </motion.button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                </motion.div>

                    {/* Wallet Overview */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl transition-all cursor-pointer ${
                        theme === 'dark' 
                          ? 'hover:border-green-500/50' 
                          : 'hover:border-green-500/30'
                      }`}
                    >
                  <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-primary" />
                    Wallet Overview
                  </h3>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-foreground">1,240 SUI</div>
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Receive
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                          <Send className="h-4 w-4" />
                          Send
                        </motion.button>
                      </div>
                    <div className={`rounded-xl p-4 border transition-all ${
                      theme === 'dark' 
                        ? 'bg-purple-500/20 border-purple-500/30' 
                        : 'bg-purple-500/10 border-purple-500/20'
                    }`}>
                      <div className={`text-center font-medium ${
                        theme === 'dark' 
                          ? 'text-purple-100' 
                          : 'text-purple-600'
                      }`}>Chart placeholder</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Transaction:</span>
                        <span className={`${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>+120 SUI from DevHub Grants</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pending:</span>
                        <span className="text-foreground">0 transactions</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                    {/* Suggested Developers */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl transition-all cursor-pointer ${
                        theme === 'dark' 
                          ? 'hover:border-purple-500/50' 
                          : 'hover:border-purple-500/30'
                      }`}
                    >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Users className="h-6 w-6 text-primary" />
                      Suggested Developers
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      <Link to="/browse">View All</Link>
                    </motion.button>
                  </div>
                      <div className="space-y-4">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : suggestedDevelopers.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No suggested developers</p>
                          </div>
                        ) : (
                          suggestedDevelopers.map((developer, index) => (
                            <motion.div
                              key={developer.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                              whileHover={{ scale: 1.02, x: 5 }}
                              className="flex items-center gap-3 p-4 hover:bg-accent/50 rounded-xl transition-colors border border-border/50"
                            >
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                  {developer.avatar}
                                </div>
                                {developer.verified && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="font-semibold text-foreground">{developer.name}</div>
                                  {developer.verified && (
                                    <div className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                                      Verified
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mb-1">{developer.skills}</div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {developer.experience && (
                                    <span>{developer.experience} years exp</span>
                                  )}
                                  {developer.views && (
                                    <span>{developer.views} views</span>
                                  )}
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-3 py-1 text-white text-sm rounded-lg transition-colors ${
                                  developer.status === 'available' ? 'bg-green-500 hover:bg-green-600' :
                                  developer.status === 'busy' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                  'bg-gray-500 hover:bg-gray-600'
                                }`}
                              >
                                {developer.status === 'available' ? 'Available' :
                                 developer.status === 'busy' ? 'Busy' : 'Offline'}
                              </motion.button>
                            </motion.div>
                          ))
                        )}
                      </div>
                </motion.div>

                    {/* Open Projects */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl transition-all cursor-pointer ${
                        theme === 'dark' 
                          ? 'hover:border-orange-500/50' 
                          : 'hover:border-orange-500/30'
                      }`}
                    >
                  <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Briefcase className="h-6 w-6 text-primary" />
                    Open Projects
                  </h3>
                      <div className="space-y-4">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : openProjects.length === 0 ? (
                          <div className="text-center py-8">
                            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No open projects</p>
                          </div>
                        ) : (
                          openProjects.map((project, index) => (
                            <motion.div
                              key={project.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 1.0 + index * 0.1 }}
                              whileHover={{ scale: 1.02, x: 5 }}
                              className="p-4 bg-accent/20 rounded-xl border border-border"
                            >
                              <div className="font-semibold text-foreground mb-2">{project.title}</div>
                              <div className="text-sm text-muted-foreground mb-3">{project.description}</div>
                              {project.budget && (
                                <div className="text-sm text-muted-foreground mb-3">
                                  Budget: {project.budget}
                                </div>
                              )}
                              {project.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {project.skills.map((skill, skillIndex) => (
                                    <span
                                      key={skillIndex}
                                      className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                                >
                                  Details
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                  Apply
                                </motion.button>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;