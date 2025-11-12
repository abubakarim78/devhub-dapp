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
  RefreshCw,
  Briefcase,
  User,
  Calendar,
  DollarSign,
  Clock,
  ExternalLink
} from "lucide-react";
import Layout from "@/components/common/Layout";
import { PACKAGE_ID, DEVHUB_OBJECT_ID, ProjectApplication, getProjectApplications, getProjectInfo } from "@/lib/suiClient";

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

interface ProjectWithApplications {
  projectId: number;
  projectTitle: string;
  applications: ProjectApplication[];
}

const DashboardProposals = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [projectApplications, setProjectApplications] = useState<ProjectWithApplications[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats>({ submitted: 0, inReview: 0, accepted: 0, rejected: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-proposals"); // "my-proposals" or "applications-to-my-projects"
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "drafts", "in-review", "accepted"
  const [currentPage, setCurrentPage] = useState(1);
  const proposalsPerPage = 4;
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch proposals I submitted
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

  // Fetch applications to my projects
  useEffect(() => {
    let isMounted = true;
    let cancelled = false;

    const fetchApplicationsToMyProjects = async () => {
      if (!currentAccount?.address || cancelled) return;
      
      setLoadingApplications(true);
      try {
        // Get all projects owned by the user
        const devhubObj = await suiClient.getObject({
          id: DEVHUB_OBJECT_ID,
          options: { showContent: true },
        });

        if (cancelled || !isMounted) return;

        const devhubFields = (devhubObj.data?.content as any)?.fields;
        if (!devhubFields?.projects) {
          if (isMounted) setProjectApplications([]);
          return;
        }

        const tableId = (devhubFields.projects.fields?.id?.id || devhubFields.projects.id?.id || devhubFields.projects.id || devhubFields.projects)?.toString?.() || String(devhubFields.projects);
        const dyn = await suiClient.getDynamicFields({ parentId: tableId, limit: 200 });

        if (cancelled || !isMounted) return;

        const projectsWithApps: ProjectWithApplications[] = [];

        console.log(`📋 Found ${dyn.data?.length || 0} projects in table`);
        
        for (const entry of dyn.data || []) {
          if (cancelled || !isMounted) break;
          
          try {
            const fieldObj = await suiClient.getDynamicFieldObject({ parentId: tableId, name: entry.name as any });
            const container = fieldObj.data?.content as any;
            const valueNode = container?.fields?.value ?? container?.fields;
            const fields = valueNode?.fields ?? valueNode;
            
            if (!fields) {
              console.log('⚠️ No fields found for project entry');
              continue;
            }
            
            const ownerAddress = fields.owner || fields.owner_address || '';
            console.log(`🔍 Checking project owner: ${ownerAddress} vs ${currentAccount.address}`);
            
            if (ownerAddress.toLowerCase() !== currentAccount.address.toLowerCase()) {
              console.log(`⏭️ Skipping project - not owned by current user`);
              continue;
            }
            
            console.log(`✅ Found owned project:`, fields.title || 'Untitled');

            // Extract project_id from table key
            const name: any = entry.name;
            let numeric: number | null = null;
            if (name && typeof name === 'object') {
              if (typeof (name as any).value === 'object' && (name as any).value?.value !== undefined) {
                numeric = Number((name as any).value.value);
              } else if (typeof (name as any).value === 'string' || typeof (name as any).value === 'number') {
                numeric = Number((name as any).value);
              }
            }
            if (numeric === null) {
              const str = JSON.stringify(entry.name);
              const match = str.match(/"value":\s*"?(\d+)"?/);
              if (match) numeric = Number(match[1]);
            }

            if (numeric !== null && !cancelled && isMounted) {
              console.log(`🔍 Fetching applications for project ${numeric} (${fields.title || 'Untitled'})`);
              try {
                const applications = await getProjectApplications(numeric, suiClient);
                console.log(`📊 Applications for project ${numeric}:`, applications?.length || 0, applications);
                
                // Log raw application data for debugging
                if (applications && applications.length > 0) {
                  console.log(`✅ Found ${applications.length} applications for project ${numeric}:`, applications);
                  applications.forEach((app, idx) => {
                    console.log(`  Application ${idx + 1}:`, {
                      id: app.id,
                      applicant: app.applicantAddress,
                      role: app.yourRole,
                      status: app.applicationStatus,
                    });
                  });
                } else {
                  console.log(`⚠️ No applications found for project ${numeric}`);
                }
                
                if (cancelled || !isMounted) break;
                
                // Always add project, even if no applications (so user can see all their projects)
                const projectInfo = await getProjectInfo(numeric);
                if (cancelled || !isMounted) break;
                
                if (applications && applications.length > 0) {
                  projectsWithApps.push({
                    projectId: numeric,
                    projectTitle: projectInfo?.title || fields.title || 'Untitled Project',
                    applications: applications,
                  });
                  console.log(`✅ Added project ${numeric} with ${applications.length} applications`);
                } else {
                  // Add project even without applications for visibility
                  projectsWithApps.push({
                    projectId: numeric,
                    projectTitle: projectInfo?.title || fields.title || 'Untitled Project',
                    applications: [],
                  });
                  console.log(`ℹ️ Added project ${numeric} with 0 applications`);
                }
              } catch (appError) {
                console.error(`Error fetching applications for project ${numeric}:`, appError);
              }
            }
          } catch (_) {
            // Skip errors for individual projects
          }
        }

        if (isMounted && !cancelled) {
          setProjectApplications(projectsWithApps);
          setLoadingApplications(false);
        }
      } catch (e) {
        console.error('Error loading applications to my projects:', e);
        if (isMounted && !cancelled) {
          setProjectApplications([]);
          setLoadingApplications(false);
        }
      }
    };

    fetchApplicationsToMyProjects();

    return () => {
      cancelled = true;
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount?.address, refreshKey]);

  // Refresh handler
  const handleRefresh = () => {
    console.log('🔄 Refreshing applications...');
    setRefreshKey(prev => prev + 1);
  };

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch = proposal.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || proposal.status === statusFilter;
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
  }, [activeTab, searchQuery, statusFilter]);

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
                          onClick={handleRefresh}
                          disabled={loadingApplications}
                          className="px-4 py-2 bg-accent/20 text-foreground rounded-lg hover:bg-accent/30 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className={`h-4 w-4 ${loadingApplications ? 'animate-spin' : ''}`} />
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

                    {/* Main Tabs - My Proposals vs Applications to My Projects */}
                    <div className="flex gap-2 mb-6 border-b border-border">
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 1.0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setActiveTab('my-proposals');
                          setCurrentPage(1);
                        }}
                        className={`px-6 py-3 rounded-t-lg font-medium transition-all border-b-2 ${
                          activeTab === 'my-proposals'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-transparent text-gray-700 dark:text-foreground hover:bg-accent/30 border-transparent'
                        }`}
                      >
                        My Proposals
                      </motion.button>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 1.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setActiveTab('applications-to-my-projects');
                          setCurrentPage(1);
                        }}
                        className={`px-6 py-3 rounded-t-lg font-medium transition-all border-b-2 flex items-center gap-2 ${
                          activeTab === 'applications-to-my-projects'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-transparent text-gray-700 dark:text-foreground hover:bg-accent/30 border-transparent'
                        }`}
                      >
                        <Briefcase className="h-4 w-4" />
                        Applications to My Projects
                        {projectApplications.reduce((sum, p) => sum + p.applications.length, 0) > 0 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary-foreground">
                            {projectApplications.reduce((sum, p) => sum + p.applications.length, 0)}
                          </span>
                        )}
                      </motion.button>
                    </div>

                    {/* Status Tabs - Only show for My Proposals */}
                    {activeTab === 'my-proposals' && (
                      <div className="flex gap-2 mb-6">
                        {['All', 'Drafts', 'In Review', 'Accepted'].map((tab, index) => {
                          const tabValue = tab.toLowerCase().replace(' ', '-');
                          return (
                            <motion.button
                              key={tab}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: 1.0 + index * 0.1 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setStatusFilter(tabValue)}
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                statusFilter === tabValue
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-accent/20 text-gray-700 dark:text-foreground hover:bg-accent/30'
                              }`}
                            >
                              {tab}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {/* Content based on active tab */}
                    {activeTab === 'my-proposals' ? (
                      /* Proposals Table */
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
                    ) : (
                      /* Applications to My Projects */
                      <div className="space-y-6">
                        {loadingApplications ? (
                          <div className="flex items-center justify-center py-12">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <RefreshCw className="h-8 w-8 text-primary" />
                            </motion.div>
                          </div>
                        ) : projectApplications.length === 0 ? (
                          <div className="text-center py-12">
                            <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">No Projects or Applications Found</h3>
                            <p className="text-muted-foreground mb-4">
                              {currentAccount?.address 
                                ? "You don't have any projects yet, or no applications have been submitted to your projects."
                                : "Please connect your wallet to see applications to your projects."}
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleRefresh}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Refresh
                            </motion.button>
                          </div>
                        ) : (
                          projectApplications.map((project, projectIndex) => (
                            <motion.div
                              key={project.projectId}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: projectIndex * 0.1 }}
                              className="bg-background/50 rounded-xl p-6 border border-border"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                  <Briefcase className="h-5 w-5 text-primary" />
                                  {project.projectTitle}
                                </h4>
                                <span className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary border border-primary/20">
                                  {project.applications.length} {project.applications.length === 1 ? 'Application' : 'Applications'}
                                </span>
                              </div>
                              <div className="space-y-4">
                                {project.applications.map((application, appIndex) => (
                                  <motion.div
                                    key={application.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: appIndex * 0.05 }}
                                    className="p-4 bg-card/70 rounded-lg border border-border hover:border-primary/30 transition-colors"
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                          <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                          <p className="font-medium text-foreground">{application.yourRole}</p>
                                          <p className="text-sm text-muted-foreground font-mono">
                                            {application.applicantAddress.slice(0, 6)}...{application.applicantAddress.slice(-4)}
                                          </p>
                                        </div>
                                      </div>
                                      <span className={`px-3 py-1 text-xs rounded-full ${
                                        application.applicationStatus === 'Pending' 
                                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                          : application.applicationStatus === 'Accepted'
                                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                      }`}>
                                        {application.applicationStatus}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{application.proposalSummary}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <DollarSign className="h-4 w-4" />
                                        <span>{application.requestedCompensation} SUI</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>{application.expectedDurationWeeks} weeks</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>{new Date(application.startDate).toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        <span>{application.availabilityHrsPerWeek} hrs/week</span>
                                      </div>
                                    </div>
                                    {application.githubRepoLink && (
                                      <div className="mt-3 flex items-center gap-2">
                                        <ExternalLink className="h-4 w-4 text-primary" />
                                        <a 
                                          href={application.githubRepoLink} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-sm text-primary hover:underline"
                                        >
                                          {application.githubRepoLink}
                                        </a>
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    )}
                  </motion.div>

                  {/* Pagination Controls - Only for My Proposals */}
                  {activeTab === 'my-proposals' && totalPages > 1 && (
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