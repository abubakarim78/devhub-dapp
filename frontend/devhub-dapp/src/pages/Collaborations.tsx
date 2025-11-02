import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MessageCircle,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";

interface Connection {
  user: string;
  status: string;
  notifications_enabled: boolean;
  profile_shared: boolean;
  messages_allowed: boolean;
}

interface ConnectionRequest {
  id: string;
  from: string;
  to: string;
  intro_message: string;
  shared_context: string;
  is_public: boolean;
}

const Collaborations = () => {
  const currentAccount = useCurrentAccount();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<
    ConnectionRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showSendRequestModal, setShowSendRequestModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"connections" | "requests">(
    "connections",
  );

  useEffect(() => {
    // TODO: Fetch connections and requests from the blockchain
    // This is a placeholder for actual blockchain integration
    const fetchData = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setConnections([]);
        setConnectionRequests([]);
      } catch (error) {
        console.error("Error fetching collaborations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredConnections = connections.filter((connection) => {
    const matchesSearch = connection.user
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || connection.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "Connected", label: "Connected" },
    { value: "Pending", label: "Pending" },
    { value: "Muted", label: "Muted" },
    { value: "Unfollowed", label: "Unfollowed" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Connected":
        return <UserCheck size={14} className="text-green-500" />;
      case "Pending":
        return <Clock size={14} className="text-yellow-500" />;
      case "Declined":
        return <XCircle size={14} className="text-red-500" />;
      case "Muted":
        return <BellOff size={14} className="text-gray-500" />;
      case "Unfollowed":
        return <EyeOff size={14} className="text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Connected":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "Declined":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "Muted":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "Unfollowed":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  Collaborations
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5 sm:mt-1">
                  Connect with developers and manage your network
                </p>
              </div>
            </div>
            {currentAccount && (
              <button
                onClick={() => setShowSendRequestModal(true)}
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Send Request</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab("connections")}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === "connections"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              My Connections
              {activeTab === "connections" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === "requests"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Requests
              {connectionRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                  {connectionRequests.length}
                </span>
              )}
              {activeTab === "requests" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          </div>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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
                placeholder={
                  activeTab === "connections"
                    ? "Search connections..."
                    : "Search requests..."
                }
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
          {activeTab === "connections" && (
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
          )}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : activeTab === "connections" ? (
          // Connections List
          filteredConnections.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredConnections.map((connection, index) => (
                <motion.div
                  key={connection.user}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all hover:border-primary/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {truncateAddress(connection.user)}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(connection.status)}`}
                        >
                          {getStatusIcon(connection.status)}
                          {connection.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Notifications
                      </span>
                      <span className="flex items-center gap-1">
                        {connection.notifications_enabled ? (
                          <>
                            <Bell size={14} className="text-green-500" />
                            <span className="text-green-500">Enabled</span>
                          </>
                        ) : (
                          <>
                            <BellOff size={14} className="text-gray-500" />
                            <span className="text-gray-500">Disabled</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Profile</span>
                      <span className="flex items-center gap-1">
                        {connection.profile_shared ? (
                          <>
                            <Eye size={14} className="text-green-500" />
                            <span className="text-green-500">Shared</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} className="text-gray-500" />
                            <span className="text-gray-500">Private</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Messages</span>
                      <span className="flex items-center gap-1">
                        {connection.messages_allowed ? (
                          <>
                            <MessageCircle
                              size={14}
                              className="text-green-500"
                            />
                            <span className="text-green-500">Allowed</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={14} className="text-gray-500" />
                            <span className="text-gray-500">Blocked</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm">
                      <MessageCircle size={14} />
                      Message
                    </button>
                    <button className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                      <Mail size={14} />
                    </button>
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
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No connections yet
              </h3>
              <p className="text-muted-foreground mb-6">
                {currentAccount
                  ? "Start building your network by sending connection requests!"
                  : "Connect your wallet to view and manage your connections"}
              </p>
              {currentAccount && (
                <button
                  onClick={() => setShowSendRequestModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <UserPlus size={20} />
                  Send Connection Request
                </button>
              )}
            </motion.div>
          )
        ) : // Connection Requests
        connectionRequests.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {connectionRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all hover:border-primary/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {truncateAddress(request.from)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Wants to connect with you
                        </p>
                      </div>
                    </div>

                    {request.intro_message && (
                      <div className="mb-3 p-3 bg-secondary/50 rounded-lg">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">Message:</span>{" "}
                          {request.intro_message}
                        </p>
                      </div>
                    )}

                    {request.shared_context && (
                      <p className="text-sm text-muted-foreground mb-3">
                        <span className="font-medium">Context:</span>{" "}
                        {request.shared_context}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          request.is_public
                            ? "bg-green-500/10 text-green-500"
                            : "bg-gray-500/10 text-gray-500"
                        }`}
                      >
                        {request.is_public
                          ? "Public Profile"
                          : "Private Profile"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle size={16} />
                    Accept
                  </button>
                  <button className="flex-1 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2">
                    <XCircle size={16} />
                    Decline
                  </button>
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
            <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No pending requests
            </h3>
            <p className="text-muted-foreground">
              You don't have any connection requests at the moment
            </p>
          </motion.div>
        )}

        {/* Send Request Modal Placeholder */}
        {showSendRequestModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground">
                  Send Connection Request
                </h2>
                <button
                  onClick={() => setShowSendRequestModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4 mb-6">
                <p className="text-muted-foreground text-sm">
                  Connection request form will be implemented here with
                  integration to the smart contract.
                </p>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2 text-sm">
                    What you'll need:
                  </h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Recipient's wallet address</li>
                    <li>• Introduction message</li>
                    <li>• Shared context (optional)</li>
                    <li>• Profile visibility preference</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setShowSendRequestModal(false)}
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

export default Collaborations;
