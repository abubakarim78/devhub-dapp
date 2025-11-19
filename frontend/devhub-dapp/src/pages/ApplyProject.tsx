import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Github,
  CheckCircle,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Link as LinkIcon,
  Target,
  Code2,
  Plus,
  X,
} from "lucide-react";
import {
  applyToProjectTransaction,
  createProposalsByStatusTransaction,
  createUserProposalsObjectTransaction,
  createHelperObjectsBatchTransaction,
  DEVHUB_OBJECT_ID,
  PACKAGE_ID,
  addMilestoneToProposalTransaction,
} from "@/lib/suiClient";

type Milestone = {
  id: string;
  description: string;
  dueDate: string; // ISO date string
  budget: number;
};

type FormState = {
  yourRole: string;
  availabilityHrsPerWeek: number;
  startDate: string;
  expectedDurationWeeks: number;
  proposalSummary: string;
  requestedCompensation: number;
  milestonesCount: number;
  githubRepoLink: string;
  onChainAddress: string;
  teamMembers: string[];
  coverLetterWalrusBlobId?: string;
  portfolioWalrusBlobIds: string[];
  opportunityTitle: string;
  proposalTitle: string;
  teamName: string;
  contactEmail: string;
  summary: string;
  budget: number;
  timelineWeeks: number;
  methodology: string;
  milestones: Milestone[];
};

export default function ApplyProject() {
  const { id } = useParams(); // project object id (string)
  const navigate = useNavigate();
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutate: signExecute } = useSignAndExecuteTransaction();

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectNumberId, setProjectNumberId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({
    yourRole: "",
    availabilityHrsPerWeek: 20,
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // Default to 2 weeks from now
    expectedDurationWeeks: 6,
    proposalSummary: "",
    requestedCompensation: 0,
    milestonesCount: 3,
    githubRepoLink: "",
    onChainAddress: "",
    teamMembers: [],
    coverLetterWalrusBlobId: undefined,
    portfolioWalrusBlobIds: [],
    opportunityTitle: "",
    proposalTitle: "",
    teamName: "",
    contactEmail: "",
    summary: "",
    budget: 0,
    timelineWeeks: 6,
    methodology: "",
    milestones: [],
  });

  // Populate applicant address by default
  useEffect(() => {
    if (account?.address) {
      setForm((f) => ({ ...f, onChainAddress: account.address }));
    }
  }, [account?.address]);

  // Resolve numeric project ID from DevHub Table by matching object id
  useEffect(() => {
    const resolveProjectId = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch DevHub object to get projects table id
        const devhubObj = await client.getObject({ id: DEVHUB_OBJECT_ID, options: { showContent: true } });
        const devhubFields = (devhubObj.data?.content as any)?.fields;
        if (!devhubFields?.projects) throw new Error("Projects table not found on DevHub");

        const tableId =
          (devhubFields.projects.fields?.id?.id ||
            devhubFields.projects.id?.id ||
            devhubFields.projects.id ||
            devhubFields.projects)
            ?.toString?.() || String(devhubFields.projects);

        // List dynamic fields under the table
        const dyn = await client.getDynamicFields({ parentId: tableId, limit: 200 });

        // Iterate each key and fetch the value object; when match on value.fields.id.id == our object id, capture key
        for (const entry of dyn.data || []) {
          try {
            const fieldObj = await client.getDynamicFieldObject({ parentId: tableId, name: entry.name as any });
            const container = fieldObj.data?.content as any;
            const valueNode = container?.fields?.value ?? container?.fields;
            const fields = valueNode?.fields ?? valueNode;
            const valueId = fields?.id?.id || fieldObj.data?.objectId;
            if (valueId && String(valueId).toLowerCase() === String(id).toLowerCase()) {
              // Name for Table<u64, T> has shape { type: '0x2::table::...::Name', value: { type: 'u64', value: '123' } }
              // Try common patterns:
              const name: any = entry.name;
              let numeric: number | null = null;
              if (name && typeof name === "object") {
                if (typeof (name as any).value === "object" && (name as any).value?.value !== undefined) {
                  const maybe = Number((name as any).value.value);
                  numeric = Number.isFinite(maybe) ? maybe : null;
                } else if (typeof (name as any).value === "string" || typeof (name as any).value === "number") {
                  const maybe = Number((name as any).value);
                  numeric = Number.isFinite(maybe) ? maybe : null;
                }
              }
              if (numeric === null) {
                // Fallback: attempt to parse from JSON string
                const str = JSON.stringify(entry.name);
                const match = str.match(/"value":\s*"?(\d+)"?/);
                if (match) numeric = Number(match[1]);
              }
              if (numeric !== null) {
                setProjectNumberId(numeric);
                break;
              }
            }
          } catch (_) {
            // ignore individual dynamic field errors
          }
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    resolveProjectId();
  }, [client, id]);

  const [userProposalsId, setUserProposalsId] = useState<string | null>(null);
  const [proposalsByStatusId, setProposalsByStatusId] = useState<string | null>(null);

  // Discover helper objects (no transactions here)
  useEffect(() => {
    const discover = async () => {
      if (!account?.address) return;
      try {
        // 1) UserProposals (owned by user)
        const owned = await client.getOwnedObjects({
          owner: account.address,
          filter: { StructType: `${PACKAGE_ID}::devhub::UserProposals` },
          options: { showType: true },
        });
        if (owned.data?.length) {
          setUserProposalsId(owned.data[0].data?.objectId || null);
        }

        // 2) ProposalsByStatus (shared). Cache id in localStorage if found previously.
        const cached = localStorage.getItem("devhub_proposals_by_status_id");
        if (cached) {
          setProposalsByStatusId(cached);
        }
      } catch (e) {
        console.error(e);
      }
    };
    discover();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.address]);

  // Capture created shared object ids from successful submission if possible via effects
  const afterSuccessPersistSharedIds = async (digest: string) => {
    try {
      const tx = await client.getTransactionBlock({ digest, options: { showEffects: true } });
      const created = tx.effects?.created || [];
      const shared = created.find((c: any) => (c.owner as any)?.Shared);
      if (shared?.reference?.objectId) {
        localStorage.setItem("devhub_proposals_by_status_id", shared.reference.objectId);
        setProposalsByStatusId(shared.reference.objectId);
      }
    } catch (_) {
      // ignore
    }
  };

  const disabled = submitting || !account?.address || !projectNumberId || loading;

  const onSubmit = async () => {
    console.log('🚀 Submit button clicked', { 
      account: account?.address, 
      projectNumberId, 
      userProposalsId, 
      submitting, 
      loading 
    });
    
    if (!account?.address) {
      setError("Please connect your wallet first");
      return;
    }
    
    if (!projectNumberId) {
      setError("Project ID not resolved yet. Please wait...");
      return;
    }

    if (loading) {
      setError("Still loading project information...");
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      // Ensure helper objects exist; create if missing now (only on submit)
      // Batch creation if both are missing to reduce wallet signatures
      let ensuredUserProposalsId = userProposalsId;
      let ensuredProposalsByStatusId = proposalsByStatusId;
      
      const needsUserProposals = !ensuredUserProposalsId;
      const needsProposalsByStatus = !ensuredProposalsByStatusId;

      if (needsUserProposals || needsProposalsByStatus) {
        if (needsUserProposals && needsProposalsByStatus) {
          // Both missing - batch them together in one transaction
          console.log('📝 Creating both helper objects in one transaction...');
          setError("Creating required objects... Please approve the transaction.");
          const txBatch = createHelperObjectsBatchTransaction();
          await new Promise<void>((resolve, reject) => {
            signExecute(
              { transaction: txBatch, options: { showEffects: true } } as any,
              {
                onSuccess: async (res: any) => {
                  try {
                    console.log('✅ Helper objects created, digest:', res.digest);
                    await client.waitForTransaction({ digest: res.digest });
                    await afterSuccessPersistSharedIds(res.digest);
                    resolve();
                  } catch (e) {
                    console.error('Error waiting for batch transaction:', e);
                    reject(e);
                  }
                },
                onError: (error) => {
                  console.error('Error creating helper objects:', error);
                  reject(error);
                },
              }
            );
          });
          setError(null);
          
          // Fetch created objects
          const owned = await client.getOwnedObjects({
            owner: account.address,
            filter: { StructType: `${PACKAGE_ID}::devhub::UserProposals` },
            options: { showType: true },
          });
          ensuredUserProposalsId = owned.data?.[0]?.data?.objectId || null;
          setUserProposalsId(ensuredUserProposalsId);
          
          const cached = localStorage.getItem("devhub_proposals_by_status_id");
          if (cached) {
            ensuredProposalsByStatusId = cached;
            setProposalsByStatusId(cached);
          } else {
            throw new Error("Failed to retrieve ProposalsByStatus object ID");
          }
          
          console.log('✅ UserProposals ID:', ensuredUserProposalsId);
          console.log('✅ ProposalsByStatus ID:', ensuredProposalsByStatusId);
        } else if (needsUserProposals) {
          // Only UserProposals missing
          console.log('📝 Creating UserProposals object...');
          setError("Creating your proposals object... Please approve the transaction.");
          const txCreateUser = createUserProposalsObjectTransaction();
          await new Promise<void>((resolve, reject) => {
            signExecute(
              { transaction: txCreateUser } as any,
              {
                onSuccess: async (res: any) => {
                  try {
                    console.log('✅ UserProposals created, digest:', res.digest);
                    await client.waitForTransaction({ digest: res.digest });
                    resolve();
                  } catch (e) {
                    console.error('Error waiting for UserProposals transaction:', e);
                    reject(e);
                  }
                },
                onError: (error) => {
                  console.error('Error creating UserProposals:', error);
                  reject(error);
                },
              }
            );
          });
          setError(null);
          const again = await client.getOwnedObjects({
            owner: account.address,
            filter: { StructType: `${PACKAGE_ID}::devhub::UserProposals` },
            options: { showType: true },
          });
          ensuredUserProposalsId = again.data?.[0]?.data?.objectId || null;
          if (!ensuredUserProposalsId) {
            throw new Error("Failed to create UserProposals object");
          }
          setUserProposalsId(ensuredUserProposalsId);
          console.log('✅ UserProposals ID:', ensuredUserProposalsId);
        } else if (needsProposalsByStatus) {
          // Only ProposalsByStatus missing
          console.log('📝 Creating ProposalsByStatus object...');
          setError("Creating proposals status object... Please approve the transaction.");
          const txCreatePBS = createProposalsByStatusTransaction();
          await new Promise<void>((resolve, reject) => {
            signExecute(
              { transaction: txCreatePBS, options: { showEffects: true } } as any,
              {
                onSuccess: async (res: any) => {
                  try {
                    console.log('✅ ProposalsByStatus created, digest:', res.digest);
                    await client.waitForTransaction({ digest: res.digest });
                    await afterSuccessPersistSharedIds(res.digest);
                    resolve();
                  } catch (e) {
                    console.error('Error waiting for ProposalsByStatus transaction:', e);
                    reject(e);
                  }
                },
                onError: (error) => {
                  console.error('Error creating ProposalsByStatus:', error);
                  reject(error);
                },
              }
            );
          });
          setError(null);
          const cached = localStorage.getItem("devhub_proposals_by_status_id");
          if (cached) {
            ensuredProposalsByStatusId = cached;
            setProposalsByStatusId(cached);
          } else {
            throw new Error("Failed to create ProposalsByStatus object");
          }
          console.log('✅ ProposalsByStatus ID:', ensuredProposalsByStatusId);
        }
      }

      if (!ensuredUserProposalsId || !ensuredProposalsByStatusId) {
        throw new Error("Required proposal objects not available");
      }

      // Ensure all required fields have defaults to prevent empty string issues
      const applicationData = {
        yourRole: form.yourRole || "Developer",
        availabilityHrsPerWeek: form.availabilityHrsPerWeek || 20,
        startDate: form.startDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        expectedDurationWeeks: form.expectedDurationWeeks || 6,
        proposalSummary: form.proposalSummary || "",
        requestedCompensation: form.requestedCompensation || form.milestones.reduce((sum, m) => sum + (m.budget || 0), 0) || 0,
        milestonesCount: form.milestones.length || form.milestonesCount || 1,
        githubRepoLink: form.githubRepoLink || "",
        onChainAddress: form.onChainAddress || account?.address || "",
        teamMembers: form.teamMembers || [],
        coverLetterWalrusBlobId: form.coverLetterWalrusBlobId,
        portfolioWalrusBlobIds: form.portfolioWalrusBlobIds || [],
        opportunityTitle: form.opportunityTitle || "Project Application",
        proposalTitle: form.proposalTitle || "Application Proposal",
        teamName: form.teamName || "Individual",
        contactEmail: form.contactEmail || account?.address || "",
        summary: form.summary || form.proposalSummary || "",
        budget: form.budget || form.requestedCompensation || 0,
        timelineWeeks: form.timelineWeeks || form.expectedDurationWeeks || 6,
        methodology: form.methodology || form.proposalSummary || "",
      };

      // Validate critical fields
      if (!applicationData.onChainAddress) {
        throw new Error("On-chain address is required");
      }

      console.log('📤 Submitting application with:', {
        userProposalsId: ensuredUserProposalsId,
        proposalsByStatusId: ensuredProposalsByStatusId,
        projectNumberId,
        applicationData
      });

      setError("Submitting your application... Please approve the transaction.");
      const tx = applyToProjectTransaction(ensuredUserProposalsId, ensuredProposalsByStatusId, projectNumberId, applicationData);

      await new Promise<void>((resolve, reject) => {
        signExecute(
          { transaction: tx, options: { showEffects: true } } as any,
          {
            onSuccess: async (res: any) => {
              try {
                console.log('✅ Application submitted, digest:', res.digest);
                await client.waitForTransaction({ digest: res.digest });
                console.log('✅ Transaction confirmed');
                
                // Extract proposal ID from transaction events
                const tx = await client.getTransactionBlock({ 
                  digest: res.digest, 
                  options: { showEvents: true, showEffects: true } 
                });
                
                // Find ProposalCreated event to get proposal ID
                const events = tx.events || [];
                const proposalEvent = events.find((e: any) => 
                  e.type?.includes('ProposalCreated') || e.type?.includes('proposal_created')
                );
                
                let proposalId: string | null = null;
                if (proposalEvent) {
                  const parsed = proposalEvent.parsedJson || proposalEvent;
                  proposalId = (parsed as any)?.proposal_id || (parsed as any)?.proposalId || null;
                }
                
                // Add milestones if any were provided
                if (proposalId && form.milestones.length > 0) {
                  console.log(`📝 Adding ${form.milestones.length} milestones to proposal ${proposalId}`);
                  setError("Adding milestones to proposal...");
                  
                  // Add milestones one by one (could be batched in future)
                  for (const milestone of form.milestones) {
                    if (milestone.description.trim()) {
                      const dueDateTimestamp = new Date(milestone.dueDate).getTime();
                      const milestoneTx = addMilestoneToProposalTransaction(
                        proposalId,
                        milestone.description,
                        dueDateTimestamp,
                        milestone.budget
                      );
                      
                      await new Promise<void>((resolve, reject) => {
                        signExecute(
                          { transaction: milestoneTx } as any,
                          {
                            onSuccess: async (milestoneRes: any) => {
                              try {
                                await client.waitForTransaction({ digest: milestoneRes.digest });
                                console.log('✅ Milestone added');
                                resolve();
                              } catch (e) {
                                console.error('Error adding milestone:', e);
                                reject(e);
                              }
                            },
                            onError: (error) => {
                              console.error('Error adding milestone:', error);
                              reject(error);
                            },
                          }
                        );
                      });
                    }
                  }
                  console.log('✅ All milestones added');
                }
                
                resolve();
              } catch (e) {
                console.error('Error waiting for application transaction:', e);
                reject(e);
              }
            },
            onError: (error) => {
              console.error('Error submitting application:', error);
              reject(error);
            },
          }
        );
      });

      console.log('✅ Application submitted successfully, navigating...');
      navigate(`/projects/${id}`);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  // Milestone management
  const addMilestone = () => {
    if (form.milestones.length >= 10) return;
    setForm((f) => ({
      ...f,
      milestones: [
        ...f.milestones,
        { 
          id: Date.now().toString(), 
          description: "", 
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          budget: 0 
        },
      ],
    }));
  };

  const removeMilestone = (milestoneId: string) => {
    setForm((f) => ({
      ...f,
      milestones: f.milestones.filter((m) => m.id !== milestoneId),
    }));
  };

  const updateMilestone = (milestoneId: string, field: keyof Milestone, value: string | number) => {
    setForm((f) => ({
      ...f,
      milestones: f.milestones.map((m) =>
        m.id === milestoneId ? { ...m, [field]: value } : m
      ),
    }));
  };

  return (
    <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Apply to Project
              </h1>
              <p className="text-sm sm:text-base text-foreground/80 mt-1 sm:mt-2">
                Submit your proposal and application details.
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground flex items-center gap-2"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </motion.div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive-foreground px-4 py-3 flex items-start gap-3"
              >
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Error</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl p-6"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">
                    <User size={18} />
                  </div>
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Your Role</label>
                    <input
                      value={form.yourRole}
                      onChange={(e) => set("yourRole", e.target.value)}
                      className="w-full bg-input text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="e.g., Lead Frontend Engineer"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Clock size={14} />
                        Availability (hrs/week)
                      </label>
                      <input
                        type="number"
                        value={form.availabilityHrsPerWeek}
                        onChange={(e) => set("availabilityHrsPerWeek", Number(e.target.value || 0))}
                        className="w-full bg-input text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Calendar size={14} />
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => set("startDate", e.target.value)}
                        className="w-full bg-input text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <Clock size={14} />
                      Expected Duration (weeks)
                    </label>
                    <input
                      type="number"
                      value={form.expectedDurationWeeks}
                      onChange={(e) => set("expectedDurationWeeks", Number(e.target.value || 0))}
                      className="w-full bg-input text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="6"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Proposal Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl p-6"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">
                    <FileText size={18} />
                  </div>
                  Proposal Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Proposal Summary</label>
                    <textarea
                      value={form.proposalSummary}
                      onChange={(e) => set("proposalSummary", e.target.value)}
                      rows={5}
                      className="w-full min-h-[120px] bg-input text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2 resize-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Outline your approach, milestones, and deliverables..."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <DollarSign size={14} />
                        Requested Compensation
                      </label>
                      <input
                        type="number"
                        value={form.requestedCompensation}
                        onChange={(e) => set("requestedCompensation", Number(e.target.value || 0))}
                        className="w-full bg-input text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Target size={14} />
                        Payment Milestones
                      </label>
                      <input
                        type="number"
                        value={form.milestonesCount}
                        onChange={(e) => set("milestonesCount", Number(e.target.value || 0))}
                        className="w-full bg-input text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="3"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Methodology</label>
                    <textarea
                      value={form.methodology}
                      onChange={(e) => set("methodology", e.target.value)}
                      rows={3}
                      className="w-full bg-input text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2 resize-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Describe your approach and methodology..."
                    />
                  </div>
                </div>
              </motion.div>

              {/* Milestones Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">
                      <Target size={18} />
                    </div>
                    Payment Milestones
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {form.milestones.length}/10 milestones
                  </span>
                </div>
                <div className="space-y-4">
                  {form.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="grid grid-cols-12 gap-3 items-end p-4 bg-muted/30 rounded-lg border border-border"
                    >
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-xs font-medium text-foreground mb-1">
                          Description
                        </label>
                        <input
                          value={milestone.description}
                          onChange={(e) => updateMilestone(milestone.id, "description", e.target.value)}
                          className="w-full bg-input text-foreground border border-border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-ring"
                          placeholder="Milestone description..."
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-xs font-medium text-foreground mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={milestone.dueDate}
                          onChange={(e) => updateMilestone(milestone.id, "dueDate", e.target.value)}
                          className="w-full bg-input text-foreground border border-border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="col-span-5 sm:col-span-3">
                        <label className="block text-xs font-medium text-foreground mb-1">
                          Budget ($)
                        </label>
                        <input
                          type="number"
                          value={milestone.budget || ""}
                          onChange={(e) => updateMilestone(milestone.id, "budget", Number(e.target.value || 0))}
                          className="w-full bg-input text-foreground border border-border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-ring"
                          placeholder="0"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => removeMilestone(milestone.id)}
                          className="w-full p-1.5 rounded-md bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                          type="button"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {form.milestones.length < 10 && (
                    <button
                      onClick={addMilestone}
                      className="w-full py-2 rounded-md border border-dashed border-border text-foreground/70 hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
                      type="button"
                    >
                      <Plus size={16} />
                      Add Milestone
                    </button>
                  )}
                  {form.milestones.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Budget:</span>
                        <span className="font-semibold text-foreground">
                          ${form.milestones.reduce((sum, m) => sum + (m.budget || 0), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Links & Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl p-6"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">
                    <LinkIcon size={18} />
                  </div>
                  Links & Contact
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Github size={14} />
                        GitHub / Portfolio Links
                      </label>
                      <input
                        value={form.githubRepoLink}
                        onChange={(e) => set("githubRepoLink", e.target.value)}
                        className="w-full bg-input text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Code2 size={14} />
                        On-chain Address
                      </label>
                      <input
                        value={form.onChainAddress}
                        onChange={(e) => set("onChainAddress", e.target.value)}
                        className="w-full bg-input text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="0x..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <Mail size={14} />
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => set("contactEmail", e.target.value)}
                      className="w-full bg-input text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="flex gap-3 justify-end"
              >
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 rounded-md bg-muted text-foreground/80 hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Button clicked, disabled:', disabled);
                    if (!disabled) {
                      onSubmit();
                    } else {
                      console.warn('Button is disabled:', { submitting, account: !!account?.address, projectNumberId, loading });
                      if (!account?.address) {
                        setError("Please connect your wallet first");
                      } else if (!projectNumberId) {
                        setError("Project ID not resolved yet. Please wait...");
                      } else if (loading) {
                        setError("Still loading project information...");
                      }
                    }
                  }}
                  className={`px-6 py-2 rounded-md flex items-center gap-2 transition-colors ${
                    disabled
                      ? "bg-muted text-foreground/50 cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Submit Application
                    </>
                  )}
                </button>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Review Checklist */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl p-5"
              >
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary" />
                  Review Checklist
                </h3>
                <ul className="text-xs text-foreground/90 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-primary/60" />
                    <span>Clear scope and milestones provided</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-primary/60" />
                    <span>Timeline aligns to project requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-primary/60" />
                    <span>Compensation fits budget</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-primary/60" />
                    <span>Links to relevant past work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-primary/60" />
                    <span>Contact information is complete</span>
                  </li>
                </ul>
              </motion.div>

              {/* On-chain Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl p-5"
              >
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Code2 size={16} className="text-primary" />
                  On-chain Actions
                </h3>
                <div className="space-y-2 text-xs text-foreground/80">
                  <p>Your application will be stored on-chain in the DevHub contract.</p>
                  <div className="rounded-md border border-primary/30 bg-primary/10 p-3 mt-3">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-foreground/70">Project ID</span>
                      <span className="font-mono text-foreground font-semibold">{projectNumberId ?? "—"}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-foreground/80">
                    You will be prompted in your wallet to review and sign the transaction.
                  </p>
                </div>
              </motion.div>

              {/* Loading State */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl p-5 flex items-center gap-3"
                >
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Resolving project ID...</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}