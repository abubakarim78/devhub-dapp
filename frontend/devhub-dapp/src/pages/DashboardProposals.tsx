import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
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
  ExternalLink,
  CheckCircle,
  XCircle,
  Eye,
  X,
  Mail,
  Github,
  Loader2,
  AlertCircle
} from "lucide-react";
import Layout from "@/components/common/Layout";
import { 
  PACKAGE_ID, 
  DEVHUB_OBJECT_ID, 
  ProjectApplication, 
  getProjectApplications, 
  getProjectInfo,
  updateProposalStatusTransaction,
  createPlatformStatisticsTransaction,
  getUserProposals,
  getProposalsByStatus,
  getProposalDetails
} from "@/lib/suiClient";

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
  const { mutate: signExecute } = useSignAndExecuteTransaction();
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
  const [selectedApplication, setSelectedApplication] = useState<ProjectApplication | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposalsByStatusId, setProposalsByStatusId] = useState<string | null>(null);
  const [platformStatisticsId, setPlatformStatisticsId] = useState<string | null>(null);
  const [userProposalsId, setUserProposalsId] = useState<string | null>(null);

  // Discover helper objects (proposalsByStatusId, platformStatisticsId, and userProposalsId)
  useEffect(() => {
    const discover = async () => {
      if (!currentAccount?.address) return;
      try {
        // 1) UserProposals (owned by user)
        const owned = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: { StructType: `${PACKAGE_ID}::devhub::UserProposals` },
          options: { showType: true, showContent: true },
        });
        console.log(`🔍 Found ${owned.data?.length || 0} UserProposals objects`);
        if (owned.data && owned.data.length > 0) {
          const foundId = owned.data[0].data?.objectId || null;
          if (foundId) {
            setUserProposalsId(foundId);
            console.log('✅ Found UserProposals ID:', foundId);
            // Also verify it's accessible by trying to get proposals
            try {
              const testProposals = await getUserProposals(foundId);
              console.log(`✅ Verified UserProposals object - contains ${testProposals.length} proposals`);
            } catch (e) {
              console.warn('⚠️ UserProposals object found but query failed:', e);
            }
          }
        } else {
          console.log('⚠️ No UserProposals object found for user. User may need to create one.');
        }

        // 2) ProposalsByStatus (shared). Cache id in localStorage if found previously.
        const cachedPBS = localStorage.getItem("devhub_proposals_by_status_id");
        if (cachedPBS) {
          setProposalsByStatusId(cachedPBS);
        } else {
          // Try to find it by querying shared objects
          // Note: This might need adjustment based on how the object is stored
          const sharedObjects = await suiClient.getOwnedObjects({
            owner: currentAccount.address,
            filter: { StructType: `${PACKAGE_ID}::devhub::ProposalsByStatus` },
            options: { showType: true },
          });
          // ProposalsByStatus is typically a shared object, so it might not be in owned objects
          // For now, we'll rely on localStorage or creation
        }

        // 3) PlatformStatistics (shared). Cache id in localStorage if found previously.
        const cachedPS = localStorage.getItem("devhub_platform_statistics_id");
        if (cachedPS) {
          setPlatformStatisticsId(cachedPS);
        }
      } catch (e) {
        console.error('Error discovering helper objects:', e);
      }
    };
    discover();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount?.address]);

  // Fetch proposals I submitted
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        if (!currentAccount?.address) {
          setProposals([]);
          setQuickStats({ submitted: 0, inReview: 0, accepted: 0, rejected: 0 });
          return;
        }

        console.log('🔍 Fetching proposals for:', currentAccount.address);
        
        // First, try to get proposals from UserProposals object if available
        let proposalIds: string[] = [];
        if (userProposalsId) {
          try {
            console.log('🔍 Attempting to get proposals from UserProposals:', userProposalsId);
            proposalIds = await getUserProposals(userProposalsId);
            console.log(`📋 Found ${proposalIds.length} proposal IDs from UserProposals:`, proposalIds);
          } catch (e) {
            console.warn('⚠️ Error getting proposals from UserProposals, falling back to owned objects:', e);
          }
        } else {
          console.log('⚠️ UserProposals ID not found, will use owned objects fallback');
        }

        // Fallback: Get proposals from owned objects
        if (proposalIds.length === 0) {
          console.log('🔍 Falling back to querying owned Proposal objects...');
          // Try proposal module first (most likely)
          let objects = await suiClient.getOwnedObjects({
            owner: currentAccount.address,
            filter: { StructType: `${PACKAGE_ID}::proposal::Proposal` },
            options: { showContent: true, showType: true },
          });
          console.log(`📋 Query result (proposal module): Found ${objects.data?.length || 0} Proposal objects`);
          
          // If none found, try devhub module
          if ((objects.data || []).length === 0) {
            objects = await suiClient.getOwnedObjects({
              owner: currentAccount.address,
              filter: { StructType: `${PACKAGE_ID}::devhub::Proposal` },
              options: { showContent: true, showType: true },
            });
            console.log(`📋 Query result (devhub module): Found ${objects.data?.length || 0} Proposal objects`);
          }
          
          proposalIds = (objects.data || []).map(obj => obj.data?.objectId || '').filter(id => id);
          console.log(`📋 Found ${proposalIds.length} proposal objects from owned objects:`, proposalIds);
        }

        if (proposalIds.length === 0) {
          setProposals([]);
          setQuickStats({ submitted: 0, inReview: 0, accepted: 0, rejected: 0 });
          return;
        }

        // Get status from ProposalsByStatus if available
        const statusMap = new Map<string, string>();
        if (proposalsByStatusId) {
          try {
            const statuses = ['in-review', 'accepted', 'rejected'];
            for (const status of statuses) {
              const ids = await getProposalsByStatus(proposalsByStatusId, status);
              ids.forEach(id => statusMap.set(id, status));
            }
            console.log('📊 Status map:', Array.from(statusMap.entries()));
          } catch (e) {
            console.warn('Error getting proposals by status:', e);
          }
        }

        // Fetch proposal details and map them
        const mapped: Proposal[] = await Promise.all(
          proposalIds.map(async (proposalId, idx) => {
            try {
              // Try to get proposal details first
              let proposalDetails = null;
              try {
                proposalDetails = await getProposalDetails(proposalId);
              } catch (e) {
                console.warn(`Error getting proposal details for ${proposalId}:`, e);
              }

              // Fallback: Get proposal object directly
              let fields: any = {};
              if (!proposalDetails) {
                try {
                  const obj = await suiClient.getObject({
                    id: proposalId,
                    options: { showContent: true, showType: true },
                  });
                  if (obj.data?.content && 'fields' in obj.data.content) {
                    fields = (obj.data.content as any).fields;
                  }
                } catch (e) {
                  console.warn(`Error getting proposal object ${proposalId}:`, e);
                }
              } else {
                fields = proposalDetails as any;
              }

              const title: string = fields.proposal_title || fields.title || proposalDetails?.proposalTitle || 'Untitled';
              const budgetVal: any = fields.budget ?? fields.requested_compensation ?? fields.budget_amount ?? proposalDetails?.budget ?? 0;
              const timelineWeeks: any = fields.timeline_weeks ?? fields.timeline ?? fields.duration_weeks ?? proposalDetails?.timelineWeeks ?? 0;
              
              // Get status from ProposalsByStatus map, or from proposal object, or default to 'draft'
              const statusFromMap = statusMap.get(proposalId);
              const statusRaw: string = statusFromMap || (fields.status || proposalDetails?.status || '').toString().toLowerCase();

              const status: Proposal['status'] = statusRaw === 'accepted' ? 'accepted' :
                statusRaw === 'rejected' ? 'rejected' :
                statusRaw === 'in-review' || statusRaw === 'in_review' ? 'in-review' : 'draft';

              return {
                id: proposalId,
                number: `#${(proposalIds.length - idx).toString().padStart(3, '0')}`,
                title,
                budget: typeof budgetVal === 'number' || typeof budgetVal === 'bigint' ? `$${budgetVal}` : (budgetVal ? String(budgetVal) : '-') ,
                timeline: timelineWeeks ? `${timelineWeeks} weeks` : '-',
                status,
                actions: 'Open',
              };
            } catch (e) {
              console.error(`Error processing proposal ${proposalId}:`, e);
              return {
                id: proposalId,
                number: `#${(proposalIds.length - idx).toString().padStart(3, '0')}`,
                title: 'Unknown Proposal',
                budget: '-',
                timeline: '-',
                status: 'draft' as const,
                actions: 'Open',
              };
            }
          })
        );

        // Filter out any null/undefined proposals
        const validProposals = mapped.filter(p => p !== null && p !== undefined);

        setProposals(validProposals);

        const qs: QuickStats = {
          submitted: validProposals.length,
          inReview: validProposals.filter(p => p.status === 'in-review').length,
          accepted: validProposals.filter(p => p.status === 'accepted').length,
          rejected: validProposals.filter(p => p.status === 'rejected').length,
        };
        setQuickStats(qs);
      } catch (e) {
        console.error('Error loading proposals:', e);
        setProposals([]);
        setQuickStats({ submitted: 0, inReview: 0, accepted: 0, rejected: 0 });
      }
    };

    fetchProposals();
  }, [currentAccount?.address, suiClient, refreshKey, userProposalsId, proposalsByStatusId]);

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
    console.log('🔄 Refreshing proposals and applications...');
    setRefreshKey(prev => prev + 1);
  };

  // Debug: Inspect a transaction (can be called from browser console)
  useEffect(() => {
    // Make inspectApplicationTransaction available globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).inspectApplicationTransaction = (digest: string) => {
        return inspectApplicationTransaction(digest, suiClient);
      };
      console.log('💡 Debug: Call inspectApplicationTransaction("A7cmEYo3aDyKjvtMBDh8BZEPUkiVThpyL3BGuqaP9sRU") to inspect the transaction');
    }
  }, [suiClient]);

  // Handle application status update
  const handleUpdateStatus = async (application: ProjectApplication, newStatus: string) => {
    if (!currentAccount?.address) {
      setError("Please connect your wallet to update application status");
      return;
    }

    if (!application.proposalId) {
      setError("Application proposal ID is missing. This application may not have been properly submitted.");
      console.error('Application missing proposalId:', application);
      return;
    }

    setUpdatingStatus(application.id);
    setError(null);

    try {
      // Ensure we have the required object IDs
      let ensuredProposalsByStatusId = proposalsByStatusId;
      let ensuredPlatformStatisticsId = platformStatisticsId;

      // Get proposalsByStatusId from localStorage if not set
      if (!ensuredProposalsByStatusId) {
        const cached = localStorage.getItem("devhub_proposals_by_status_id");
        if (cached) {
          ensuredProposalsByStatusId = cached;
          setProposalsByStatusId(cached);
        } else {
          throw new Error("ProposalsByStatus object not found. Please ensure it exists.");
        }
      }

      // Get or create platformStatisticsId
      if (!ensuredPlatformStatisticsId) {
        const cached = localStorage.getItem("devhub_platform_statistics_id");
        if (cached) {
          ensuredPlatformStatisticsId = cached;
          setPlatformStatisticsId(cached);
        } else {
          // Create PlatformStatistics object
          console.log('📝 Creating PlatformStatistics object...');
          setError("Creating PlatformStatistics object... Please approve the transaction.");
          const txCreatePS = createPlatformStatisticsTransaction();
          
          await new Promise<void>((resolve, reject) => {
            signExecute(
              { transaction: txCreatePS, options: { showEffects: true } } as any,
              {
                onSuccess: async (res: any) => {
                  try {
                    console.log('✅ PlatformStatistics created, digest:', res.digest);
                    await suiClient.waitForTransaction({ digest: res.digest });
                    
                    // Extract object ID from transaction
                    const tx = await suiClient.getTransactionBlock({ 
                      digest: res.digest, 
                      options: { showEffects: true, showObjectChanges: true } 
                    });
                    
                    const created = tx.objectChanges?.find(
                      (change: any) => change.type === 'created' && 
                      change.objectType?.includes('PlatformStatistics')
                    );
                    
                    if (created && 'objectId' in created) {
                      const objectId = created.objectId;
                      localStorage.setItem("devhub_platform_statistics_id", objectId);
                      ensuredPlatformStatisticsId = objectId;
                      setPlatformStatisticsId(objectId);
                      console.log('✅ PlatformStatistics ID:', objectId);
                    } else {
                      throw new Error("Failed to retrieve PlatformStatistics object ID");
                    }
                    
                    resolve();
                  } catch (e) {
                    console.error('Error waiting for PlatformStatistics transaction:', e);
                    reject(e);
                  }
                },
                onError: (error) => {
                  console.error('Error creating PlatformStatistics:', error);
                  reject(error);
                },
              }
            );
          });
          setError(null);
        }
      }

      if (!ensuredProposalsByStatusId || !ensuredPlatformStatisticsId) {
        throw new Error("Required objects not available");
      }

      // Update status - normalize status to match contract expectations
      // Contract expects: "accepted", "rejected", "in-review" (lowercase with hyphen)
      const normalizedStatus = newStatus.toLowerCase().replace(/\s+/g, '-');
      console.log('🔄 Updating proposal status:', {
        proposalId: application.proposalId,
        newStatus,
        normalizedStatus,
        proposalsByStatusId: ensuredProposalsByStatusId,
        platformStatisticsId: ensuredPlatformStatisticsId
      });

      setError("Updating application status... Please approve the transaction.");
      const tx = updateProposalStatusTransaction(
        application.proposalId,
        ensuredPlatformStatisticsId,
        ensuredProposalsByStatusId,
        normalizedStatus
      );

      await new Promise<void>((resolve, reject) => {
        signExecute(
          { transaction: tx, options: { showEffects: true } } as any,
          {
            onSuccess: async (res: any) => {
              try {
                console.log('✅ Status updated, digest:', res.digest);
                await suiClient.waitForTransaction({ digest: res.digest });
                setError(null);
                // Refresh applications
                handleRefresh();
                resolve();
              } catch (e) {
                console.error('Error waiting for status update transaction:', e);
                reject(e);
              }
            },
            onError: (error) => {
              console.error('Error updating status:', error);
              setError(error?.message || String(error));
              reject(error);
            },
          }
        );
      });

      // Close modal if open
      if (isDetailModalOpen) {
        setIsDetailModalOpen(false);
        setSelectedApplication(null);
      }
    } catch (e: any) {
      console.error('Error updating status:', e);
      setError(e?.message || String(e));
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Open application detail modal
  const openApplicationDetail = (application: ProjectApplication) => {
    setSelectedApplication(application);
    setIsDetailModalOpen(true);
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

  // Helper function to normalize status for comparison (handles both "in-review" and "In Review")
  const normalizeStatus = (status: string): string => {
    if (!status) return '';
    const normalized = status.toLowerCase().replace(/\s+/g, '-');
    // Map common variations
    if (normalized === 'in-review' || normalized === 'in_review') return 'in-review';
    if (normalized === 'pending') return 'pending';
    if (normalized === 'accepted') return 'accepted';
    if (normalized === 'rejected') return 'rejected';
    return normalized;
  };

  // Helper function to format status for display
  const formatStatusForDisplay = (status: string): string => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'in-review':
        return 'In Review';
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      default:
        return status; // Return original if unknown
    }
  };

  const getStatusColor = (status: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case "accepted":
        return "bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30";
      case "rejected":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30";
      case "in-review":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30";
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
                    <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 mt-4 md:mt-0">
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
                        className="w-full px-4 sm:px-6 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
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
                        className="w-full px-4 sm:px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                      <h3 className="text-xl font-bold text-foreground">Your Proposals</h3>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 sm:px-4 py-2 bg-accent/20 text-foreground rounded-lg hover:bg-accent/30 transition-colors flex items-center gap-2 text-sm sm:text-base flex-1 sm:flex-initial"
                        >
                          <Download className="h-4 w-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">Export</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleRefresh}
                          disabled={loadingApplications}
                          className="px-3 sm:px-4 py-2 bg-accent/20 text-foreground rounded-lg hover:bg-accent/30 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-initial"
                        >
                          <RefreshCw className={`h-4 w-4 flex-shrink-0 ${loadingApplications ? 'animate-spin' : ''}`} />
                          <span className="whitespace-nowrap">Refresh</span>
                        </motion.button>
                      </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col gap-4 mb-6">
                      <div className="w-full">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search proposals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-background/70 backdrop-blur-xl border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground text-sm sm:text-base"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <select className="w-full sm:w-auto sm:flex-1 px-4 py-3 bg-background/70 backdrop-blur-xl border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base">
                          <option>Opportunity: Any</option>
                          <option>Sui Grants</option>
                          <option>Developer Bounties</option>
                        </select>
                        <select className="w-full sm:w-auto sm:flex-1 px-4 py-3 bg-background/70 backdrop-blur-xl border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base">
                          <option>Sort: Recent</option>
                          <option>Sort: Oldest</option>
                          <option>Sort: Budget</option>
                        </select>
                      </div>
                    </div>

                    {/* Main Tabs - My Proposals vs Applications to My Projects */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 mb-6 border-b border-border overflow-x-auto">
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
                        className={`px-4 sm:px-6 py-2 sm:py-3 rounded-t-lg font-medium transition-all border-b-2 whitespace-nowrap text-sm sm:text-base ${
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
                        className={`px-4 sm:px-6 py-2 sm:py-3 rounded-t-lg font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base ${
                          activeTab === 'applications-to-my-projects'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-transparent text-gray-700 dark:text-foreground hover:bg-accent/30 border-transparent'
                        }`}
                      >
                        <Briefcase className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden sm:inline">Applications to My Projects</span>
                        <span className="sm:hidden">Applications</span>
                        {projectApplications.reduce((sum, p) => sum + p.applications.length, 0) > 0 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary-foreground flex-shrink-0">
                            {projectApplications.reduce((sum, p) => sum + p.applications.length, 0)}
                          </span>
                        )}
                      </motion.button>
                    </div>

                    {/* Status Tabs - Only show for My Proposals */}
                    {activeTab === 'my-proposals' && (
                      <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
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
                              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap flex-shrink-0 ${
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
                                        normalizeStatus(application.applicationStatus) === 'pending' 
                                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                          : normalizeStatus(application.applicationStatus) === 'accepted'
                                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                          : normalizeStatus(application.applicationStatus) === 'in-review'
                                          ? 'bg-primary/20 text-primary border border-primary/30'
                                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                      }`}>
                                        {formatStatusForDisplay(application.applicationStatus)}
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
                                    <div className="mt-4 flex gap-2">
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => openApplicationDetail(application)}
                                        className="flex-1 px-3 py-2 bg-accent/20 text-foreground rounded-lg hover:bg-accent/30 transition-colors flex items-center justify-center gap-2 text-sm"
                                      >
                                        <Eye className="h-4 w-4" />
                                        View Details
                                      </motion.button>
                                      {normalizeStatus(application.applicationStatus) !== 'accepted' && (
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => handleUpdateStatus(application, 'Accepted')}
                                          disabled={updatingStatus === application.id}
                                          className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                        >
                                          {updatingStatus === application.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <CheckCircle className="h-4 w-4" />
                                          )}
                                          Accept
                                        </motion.button>
                                      )}
                                      {normalizeStatus(application.applicationStatus) !== 'rejected' && (
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => handleUpdateStatus(application, 'Rejected')}
                                          disabled={updatingStatus === application.id}
                                          className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                        >
                                          {updatingStatus === application.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <XCircle className="h-4 w-4" />
                                          )}
                                          Reject
                                        </motion.button>
                                      )}
                                      {normalizeStatus(application.applicationStatus) !== 'in-review' && normalizeStatus(application.applicationStatus) !== 'accepted' && normalizeStatus(application.applicationStatus) !== 'rejected' && (
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => handleUpdateStatus(application, 'In Review')}
                                          disabled={updatingStatus === application.id}
                                          className="px-3 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                        >
                                          {updatingStatus === application.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <RefreshCw className="h-4 w-4" />
                                          )}
                                          In Review
                                        </motion.button>
                                      )}
                                    </div>
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
                    className="grid grid-cols-2 sm:flex sm:flex-row justify-end gap-3"
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
                      className="w-full px-4 sm:px-6 py-3 bg-accent/20 text-foreground font-semibold rounded-xl hover:bg-accent/30 transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <motion.div
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.5, delay: 1.4 }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </motion.div>
                      <span className="hidden sm:inline">Back to </span>Dashboard
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
                      className="w-full px-4 sm:px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
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

      {/* Application Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedApplication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsDetailModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Application Details</h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-2 hover:bg-accent/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive-foreground px-4 py-3 flex items-start gap-3"
                >
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Error</p>
                    <p className="text-xs mt-1">{error}</p>
                  </div>
                </motion.div>
              )}

              <div className="space-y-6">
                {/* Applicant Info */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Applicant Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Role</p>
                      <p className="text-foreground font-medium">{selectedApplication.yourRole}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Address</p>
                      <p className="text-foreground font-mono text-sm">{selectedApplication.applicantAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                        normalizeStatus(selectedApplication.applicationStatus) === 'pending' 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : normalizeStatus(selectedApplication.applicationStatus) === 'accepted'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : normalizeStatus(selectedApplication.applicationStatus) === 'in-review'
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {formatStatusForDisplay(selectedApplication.applicationStatus)}
                      </span>
                    </div>
                    {selectedApplication.contactEmail && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Contact Email</p>
                        <p className="text-foreground flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {selectedApplication.contactEmail}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Proposal Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Proposal Summary
                  </h3>
                  <p className="text-foreground whitespace-pre-wrap">{selectedApplication.proposalSummary}</p>
                </div>

                {/* Project Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-foreground">Compensation</h4>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{selectedApplication.requestedCompensation} SUI</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-foreground">Timeline</h4>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{selectedApplication.expectedDurationWeeks} weeks</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-foreground">Start Date</h4>
                    </div>
                    <p className="text-foreground">{new Date(selectedApplication.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-foreground">Availability</h4>
                    </div>
                    <p className="text-foreground">{selectedApplication.availabilityHrsPerWeek} hrs/week</p>
                  </div>
                </div>

                {/* Links */}
                {selectedApplication.githubRepoLink && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Github className="h-5 w-5" />
                      Links
                    </h3>
                    <a 
                      href={selectedApplication.githubRepoLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {selectedApplication.githubRepoLink}
                    </a>
                  </div>
                )}

                {/* Team Members */}
                {selectedApplication.teamMembers && selectedApplication.teamMembers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Team Members</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.teamMembers.map((member, idx) => (
                        <span key={idx} className="px-3 py-1 bg-muted/30 rounded-lg text-sm text-foreground">
                          {member}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  {normalizeStatus(selectedApplication.applicationStatus) !== 'accepted' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleUpdateStatus(selectedApplication, 'Accepted')}
                      disabled={updatingStatus === selectedApplication.id}
                      className="flex-1 px-4 py-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {updatingStatus === selectedApplication.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                      Accept Application
                    </motion.button>
                  )}
                  {normalizeStatus(selectedApplication.applicationStatus) !== 'rejected' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleUpdateStatus(selectedApplication, 'Rejected')}
                      disabled={updatingStatus === selectedApplication.id}
                      className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {updatingStatus === selectedApplication.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                      Reject Application
                    </motion.button>
                  )}
                  {normalizeStatus(selectedApplication.applicationStatus) !== 'in-review' && normalizeStatus(selectedApplication.applicationStatus) !== 'accepted' && normalizeStatus(selectedApplication.applicationStatus) !== 'rejected' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleUpdateStatus(selectedApplication, 'In Review')}
                      disabled={updatingStatus === selectedApplication.id}
                      className="flex-1 px-4 py-3 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {updatingStatus === selectedApplication.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-5 w-5" />
                      )}
                      Set to In Review
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardProposals;