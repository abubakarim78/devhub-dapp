import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSuiClient } from "@mysten/dapp-kit";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
  ArrowLeft,
  Download,
  RefreshCw
} from "lucide-react";
import Layout from "@/components/common/Layout";
import { PACKAGE_ID } from "@/lib/suiClient";

interface Proposal {
  id: string;
  number: string;
  title: string;
  budget: string;
  timeline: string;
  status: 'draft' | 'in-review' | 'accepted' | 'rejected';
  actions: string;
}

interface QuickStats {
  submitted: number;
  inReview: number;
  accepted: number;
  rejected: number;
}

const DashboardProposals = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats>({ submitted: 0, inReview: 0, accepted: 0, rejected: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const proposalsPerPage = 4;

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        if (!currentAccount?.address) {
          setProposals([]);
          setQuickStats({ submitted: 0, inReview: 0, accepted: 0, rejected: 0 });
          return;
        }

        const objects = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: { StructType: `${PACKAGE_ID}::devhub::Proposal` },
          options: { showContent: true, showType: true },
        });

        const mapped: Proposal[] = (objects.data || []).map((obj, idx) => {
          const fields = (obj.data && obj.data.content && 'fields' in obj.data.content) ? (obj.data.content as any).fields : {};
          const title: string = fields.proposal_title || fields.title || 'Untitled';
          const budgetVal: any = fields.budget ?? fields.requested_compensation ?? fields.budget_amount;
          const timelineWeeks: any = fields.timeline_weeks ?? fields.timeline ?? fields.duration_weeks;
          const statusRaw: string = (fields.status || '').toString().toLowerCase();

          const status: Proposal['status'] = statusRaw === 'accepted' ? 'accepted' :
            statusRaw === 'rejected' ? 'rejected' :
            statusRaw === 'in-review' || statusRaw === 'in_review' ? 'in-review' : 'draft';

          return {
            id: obj.data?.objectId || String(idx),
            number: `#${(objects.data.length - idx).toString().padStart(3, '0')}`,
            title,
            budget: typeof budgetVal === 'number' || typeof budgetVal === 'bigint' ? `$${budgetVal}` : (budgetVal ? String(budgetVal) : '-') ,
            timeline: timelineWeeks ? `${timelineWeeks} weeks` : '-',
            status,
            actions: 'Open',
          };
        });

        setProposals(mapped);

        const qs: QuickStats = {
          submitted: mapped.length,
          inReview: mapped.filter(p => p.status === 'in-review').length,
          accepted: mapped.filter(p => p.status === 'accepted').length,
          rejected: mapped.filter(p => p.status === 'rejected').length,
        };
        setQuickStats(qs);
      } catch (e) {
        console.error('Error loading proposals:', e);
        setProposals([]);
        setQuickStats({ submitted: 0, inReview: 0, accepted: 0, rejected: 0 });
      }
    };

    fetchProposals();
  }, [currentAccount?.address, suiClient]);

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch = proposal.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      activeTab === "all" || proposal.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProposals.length / proposalsPerPage);
  const startIndex = (currentPage - 1) * proposalsPerPage;
  const endIndex = startIndex + proposalsPerPage;
  const currentProposals = filteredProposals.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30";
      case "rejected":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30";
      case "in-review":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-500/30";
      case "draft":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-500/30";
    }
  };

  // User not connected state
  if (!currentAccount) {
    return (
      <Layout>
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30"
          >
            <FileText className="h-16 w-16 text-primary" />
          </motion.div>
          <h2 className="text-4xl font-bold text-foreground mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-8 text-lg">You need to connect your Sui wallet to access your proposals.</p>
          <div className="bg-primary/10 backdrop-blur-sm p-6 rounded-xl border border-primary/30 max-w-md mx-auto">
            <p className="text-primary">
              Connect your wallet to view and manage your proposals.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
                <motion.div
                  key="proposals-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="space-y-8"
                >
                  {/* Proposals Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.7, 
                      delay: 0.1,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    className="flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground mb-2">Developer Dashboard / Proposals</div>
                      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent mb-4">
                        Proposals
                      </h1>
                      <p className="text-xl text-muted-foreground">
                        Track, review, and manage your submitted proposals.
                      </p>
                   </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        whileHover={{ 
                          scale: 1.05, 
                          y: -2,
                          boxShadow: "0 10px 25px rgba(168, 85, 247, 0.4)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-all shadow-lg flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </motion.button>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        whileHover={{ 
                          scale: 1.05, 
                          y: -2,
                          boxShadow: "0 10px 25px rgba(34, 197, 94, 0.4)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        New Proposal
                      </motion.button>
                    </div>
                  </motion.div>

                    {/* Quick Stats */}
                    <motion.div
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.8, 
                        delay: 0.4,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      whileHover={{ 
                        scale: 1.01,
                        transition: { duration: 0.3 }
                      }}
                      className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl"
                    >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-foreground">Quick Stats</h3>
                      <span className="text-sm text-muted-foreground">Last 30 days</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Submitted */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="bg-white-500/20 rounded-xl p-4 border border-purple-500/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-foreground">Submitted</span>
                          <span className="px-2 py-1 bg-purple-500/30 text-purple-700 dark:text-purple-400 rounded-full text-xs">Total</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground mb-1">{quickStats.submitted}</div>
                        <div className="text-xs text-muted-foreground">Across all opportunities</div>
                      </motion.div>

                      {/* In Review */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="bg-white-500/20 rounded-xl p-4 border border-purple-500/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-foreground">In Review</span>
                          <span className="px-2 py-1 bg-primary/30 text-primary-700 dark:text-primary rounded-full text-xs">Active</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground mb-1">{quickStats.inReview}</div>
                        <div className="text-xs text-muted-foreground">Awaiting feedback</div>
                      </motion.div>

                      {/* Accepted */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                        className="bg-white-500/20 rounded-xl p-4 border border-purple-500/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-foreground">Accepted</span>
                          <span className="px-2 py-1 bg-green-500/30 text-green-700 dark:text-green-400 rounded-full text-xs">Won</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground mb-1">{quickStats.accepted}</div>
                        <div className="text-xs text-muted-foreground">Ready to kick off</div>
                      </motion.div>

                      {/* Rejected */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        className="bg-white-500/20 rounded-xl p-4 border border-purple-500/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-foreground">Rejected</span>
                          <span className="px-2 py-1 bg-yellow-500/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs">Declined</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground mb-1">{quickStats.rejected}</div>
                        <div className="text-xs text-muted-foreground">Not moving forward</div>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Your Proposals */}
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.8, 
                      delay: 0.9,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    whileHover={{ 
                      scale: 1.01,
                      transition: { duration: 0.3 }
                    }}
                    className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-foreground">Your Proposals</h3>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-accent/20 text-foreground rounded-lg hover:bg-accent/30 transition-colors flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-accent/20 text-foreground rounded-lg hover:bg-accent/30 transition-colors flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Refresh
                        </motion.button>
                      </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search proposals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-background/70 backdrop-blur-xl border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <select className="px-4 py-3 bg-background/70 backdrop-blur-xl border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent">
                          <option>Opportunity: Any</option>
                          <option>Sui Grants</option>
                          <option>Developer Bounties</option>
                        </select>
                        <select className="px-4 py-3 bg-background/70 backdrop-blur-xl border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent">
                          <option>Sort: Recent</option>
                          <option>Sort: Oldest</option>
                          <option>Sort: Budget</option>
                        </select>
                      </div>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex gap-2 mb-6">
                      {['All', 'Drafts', 'In Review', 'Accepted'].map((tab, index) => (
                        <motion.button
                          key={tab}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 1.0 + index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            activeTab === tab.toLowerCase().replace(' ', '-')
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-accent/20 text-gray-700 dark:text-foreground hover:bg-accent/30'
                          }`}
                        >
                          {tab}
                        </motion.button>
                      ))}
                    </div>

                    {/* Proposals Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <motion.thead
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 1.0 }}
                        >
                          <tr className="bg-white-500/20 border-b border-purple-500/30">
                            <th className="text-left py-3 px-4 text-foreground font-semibold">#</th>
                            <th className="text-left py-3 px-4 text-foreground font-semibold">Title</th>
                            <th className="text-left py-3 px-4 text-foreground font-semibold">Budget</th>
                            <th className="text-left py-3 px-4 text-foreground font-semibold">Timeline</th>
                            <th className="text-left py-3 px-4 text-foreground font-semibold">Status</th>
                            <th className="text-left py-3 px-4 text-foreground font-semibold">Actions</th>
                          </tr>
                        </motion.thead>
                        <AnimatePresence mode="popLayout">
                          <motion.tbody
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 1.1 }}
                          >
                            {currentProposals.map((proposal, index) => (
                              <motion.tr
                                key={proposal.id}
                                layout
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                transition={{ 
                                  duration: 0.3, 
                                  delay: 1.1 + index * 0.1,
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 30
                                }}
                                whileHover={{ 
                                  scale: 1.01,
                                  y: -2,
                                  transition: { duration: 0.2 }
                                }}
                                className="border-b border-border hover:bg-accent/10 transition-colors"
                              >
                              <td className="py-4 px-4 text-foreground">{proposal.number}</td>
                              <td className="py-4 px-4 text-foreground font-medium">{proposal.title}</td>
                              <td className="py-4 px-4 text-foreground">{proposal.budget}</td>
                              <td className="py-4 px-4 text-foreground">{proposal.timeline}</td>
                              <td className="py-4 px-4 relative">
                                <div className="inline-block relative">
                                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${getStatusColor(proposal.status)}`}>
                                    {proposal.status === 'in-review' ? 'In Review' : 
                                     proposal.status === 'accepted' ? 'Accepted' :
                                     proposal.status === 'rejected' ? 'Rejected' : 'Draft'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="px-3 py-1 bg-accent/20 text-foreground rounded-lg hover:bg-accent/30 transition-colors"
                                >
                                  {proposal.actions}
                                </motion.button>
                              </td>
                            </motion.tr>
                          ))}
                          </motion.tbody>
                        </AnimatePresence>
                      </table>
                    </div>
                  </motion.div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 1.1 }}
                      className="flex items-center justify-between bg-card/50 backdrop-blur-xl rounded-xl p-4 border border-border"
                    >
                      <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredProposals.length)} of {filteredProposals.length} proposals
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <motion.button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                          whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                          className={`px-3 py-2 rounded-lg transition-all ${
                            currentPage === 1 
                              ? 'bg-accent/10 text-muted-foreground cursor-not-allowed' 
                              : 'bg-accent/20 text-foreground hover:bg-accent/30'
                          }`}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </motion.button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <motion.button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                currentPage === page
                                  ? 'bg-primary text-primary-foreground shadow-lg'
                                  : 'bg-accent/20 text-foreground hover:bg-accent/30'
                              }`}
                            >
                              {page}
                            </motion.button>
                          ))}
                        </div>

                        <motion.button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                          whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                          className={`px-3 py-2 rounded-lg transition-all ${
                            currentPage === totalPages 
                              ? 'bg-accent/10 text-muted-foreground cursor-not-allowed' 
                              : 'bg-accent/20 text-foreground hover:bg-accent/30'
                          }`}
                        >
                          <ArrowLeft className="h-4 w-4 rotate-180" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Bottom Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: 1.2,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    className="flex justify-end gap-3"
                  >
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 1.3 }}
                      whileHover={{ 
                        scale: 1.05, 
                        y: -2,
                        boxShadow: "0 10px 25px rgba(168, 85, 247, 0.4)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-accent/20 text-foreground font-semibold rounded-xl hover:bg-accent/30 transition-all shadow-lg flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.5, delay: 1.4 }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </motion.div>
                      Back to Dashboard
                    </motion.button>
                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 1.4 }}
                      whileHover={{ 
                        scale: 1.05, 
                        y: -2,
                        boxShadow: "0 10px 25px rgba(34, 197, 94, 0.4)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 0.5, delay: 1.5 }}
                      >
                        <FileText className="h-4 w-4" />
                      </motion.div>
                      Open Proposal
                    </motion.button>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
    </>
  );
};

export default DashboardProposals;