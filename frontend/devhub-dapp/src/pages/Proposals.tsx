import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Eye,
} from "lucide-react";
import StarBackground from "@/components/common/StarBackground";

interface Proposal {
  id: string;
  opportunity_title: string;
  proposal_title: string;
  team_name: string;
  contact_email: string;
  summary: string;
  budget: number;
  timeline_weeks: number;
  status: string;
  created_at: number;
  last_updated: number;
  owner_address: string;
}

const Proposals = () => {
  const currentAccount = useCurrentAccount();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // TODO: Fetch proposals from the blockchain
    // This is a placeholder for actual blockchain integration
    const fetchProposals = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setProposals([]);
      } catch (error) {
        console.error("Error fetching proposals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.proposal_title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      proposal.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.opportunity_title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || proposal.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "Draft", label: "Draft" },
    { value: "InReview", label: "In Review" },
    { value: "Accepted", label: "Accepted" },
    { value: "Rejected", label: "Rejected" },
    { value: "Declined", label: "Declined" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Draft":
        return <Edit size={14} className="text-gray-500" />;
      case "InReview":
        return <AlertCircle size={14} className="text-blue-500" />;
      case "Accepted":
        return <CheckCircle size={14} className="text-green-500" />;
      case "Rejected":
        return <XCircle size={14} className="text-red-500" />;
      case "Declined":
        return <XCircle size={14} className="text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "InReview":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Accepted":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "Declined":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 relative">
      <StarBackground />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">
                  Proposals
                </h1>
                <p className="text-muted-foreground mt-1">
                  Submit and track your project proposals
                </p>
              </div>
            </div>
            {currentAccount && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={20} />
                Create Proposal
              </button>
            )}
          </div>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <input
                type="text"
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-lg hover:bg-accent transition-colors">
              <Filter size={20} />
              Filters
            </button>
          </div>

          {/* Status Pills */}
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterStatus(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-accent"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Proposals List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredProposals.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filteredProposals.map((proposal, index) => (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all hover:border-primary/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(proposal.status)}`}
                      >
                        {getStatusIcon(proposal.status)}
                        {proposal.status === "InReview"
                          ? "In Review"
                          : proposal.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(proposal.created_at)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-1">
                      {proposal.proposal_title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Opportunity: {proposal.opportunity_title}
                    </p>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {proposal.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} />
                    <span>${proposal.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{proposal.timeline_weeks} weeks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Team: {proposal.team_name}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <Eye size={16} />
                    View Details
                  </button>
                  {proposal.owner_address === currentAccount?.address &&
                    proposal.status === "Draft" && (
                      <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-2">
                        <Edit size={16} />
                        Edit
                      </button>
                    )}
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
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No proposals found
            </h3>
            <p className="text-muted-foreground mb-6">
              {currentAccount
                ? searchQuery || filterStatus !== "all"
                  ? "No proposals match your filters. Try adjusting your search."
                  : "Start by creating your first proposal!"
                : "Connect your wallet to view and create proposals"}
            </p>
            {currentAccount && !searchQuery && filterStatus === "all" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={20} />
                Create Your First Proposal
              </button>
            )}
          </motion.div>
        )}

        {/* Create Proposal Modal Placeholder */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground">
                  Create New Proposal
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4 mb-6">
                <p className="text-muted-foreground">
                  Proposal creation form will be implemented here with
                  integration to the smart contract.
                </p>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">
                    What you'll need:
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Opportunity title and proposal title</li>
                    <li>• Team name and contact information</li>
                    <li>• Project summary and methodology</li>
                    <li>• Budget and timeline details</li>
                    <li>• Key deliverables and milestones</li>
                    <li>• Team members and their roles</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-full py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Proposals;
