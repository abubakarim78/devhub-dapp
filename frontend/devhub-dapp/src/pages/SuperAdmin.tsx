import React, { useState, useEffect, useCallback } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useContract } from "../hooks/useContract";
import {
  grantAdminRoleTransaction,
  revokeAdminRoleTransaction,
  withdrawFeesTransaction,
  getPlatformFeeBalance,
  getPlatformStats,
  getRecentActivity,
  getPlatformFee,
  getActivityStats,
} from "../lib/suiClient";
import SuperAdminSidebar, {
  SuperAdminTab,
} from "@/components/SuperAdminSidebar";
import SuperAdminOverview from "@/components/SuperAdminOverview";
import SuperAdminAdmins from "@/components/SuperAdminAdmins";
import SuperAdminFees from "@/components/SuperAdminFees";
import SuperAdminActivity from "@/components/SuperAdminActivity";
import RemoveAdminDialog from "@/components/RemoveAdminDialog";

const SuperAdminSkeletonLoader: React.FC = () => (
  <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-secondary/50 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl animate-pulse">
              <div className="h-8 bg-muted rounded w-3/4 mb-8"></div>
              <div className="space-y-3">
                <div className="h-10 bg-muted rounded w-full"></div>
                <div className="h-10 bg-muted rounded w-full"></div>
                <div className="h-10 bg-muted rounded w-full"></div>
                <div className="h-10 bg-muted rounded w-full"></div>
              </div>
            </div>
          </div>
          {/* Main Content Skeleton */}
          <main className="lg:col-span-3">
            <div className="h-12 bg-muted rounded w-64 mb-8 animate-pulse"></div>
            <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-2xl animate-pulse">
              <div className="h-8 bg-muted rounded w-48 mb-6"></div>
              <div className="h-10 bg-muted rounded w-full mb-4"></div>
              <div className="h-12 bg-muted rounded w-1/3"></div>
            </div>
          </main>
        </div>
      </div>
    </div>
);

const SuperAdmin: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { isSuperAdmin: checkIsSuperAdmin, getAdmins, getSuperAdmin, getCardCount } = useContract();

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin management
  const [newAdminAddress, setNewAdminAddress] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [removingAdmin, setRemovingAdmin] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<string | null>(null);
  const [adminSearchTerm, setAdminSearchTerm] = useState("");
  const [adminRoleFilter, setAdminRoleFilter] = useState<"All" | "Admin" | "Super">("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [adminsPerPage] = useState(10);
  const [newAdminRole, setNewAdminRole] = useState<"Admin" | "Super">("Admin");
  const [newAdminNote, setNewAdminNote] = useState("");


  // Activity log data
  const [activityLog, setActivityLog] = useState<Array<{
    when: string;
    type: string;
    actor: string;
    details: string;
    txStatus: string;
    status: string;
  }>>([]);

  // Platform fees
  const [platformFeeBalance, setPlatformFeeBalance] = useState<number>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawRecipient, setWithdrawRecipient] = useState<string>("");
  const [withdrawingFees, setWithdrawingFees] = useState(false);
  
  // Real admin data from contract
  const [admins, setAdmins] = useState<string[]>([]);
  const [superAdmin, setSuperAdmin] = useState<string | null>(null);
  const [totalCards, setTotalCards] = useState<number>(0);

  // Fee configuration
  const [currentTradingFee, setCurrentTradingFee] = useState<number>(0.1); // 0.1 SUI from contract
  const [currentListingFee] = useState<number>(0.2); // 0.2 SUI from contract (fixed)
  const [newTradingFee, setNewTradingFee] = useState<string>("");
  const [newListingFee, setNewListingFee] = useState<string>("");
  const [updatingFees, setUpdatingFees] = useState(false);

  // Platform statistics
  const [platformStats, setPlatformStats] = useState<{
    totalDevelopers: number;
    activeDevelopers: number;
    verifiedDevelopers: number;
    openProjects: number;
  }>({
    totalDevelopers: 0,
    activeDevelopers: 0,
    verifiedDevelopers: 0,
    openProjects: 0,
  });

  // Activity statistics
  const [activityStats, setActivityStats] = useState<{
    totalEvents: number;
    adminEvents: number;
    feeEvents: number;
    cardEvents: number;
  }>({
    totalEvents: 0,
    adminEvents: 0,
    feeEvents: 0,
    cardEvents: 0,
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState<SuperAdminTab>("overview");

  // Activity log filtering and pagination
  const [activityFilter, setActivityFilter] = useState<string>('All');
  const [activityCurrentPage, setActivityCurrentPage] = useState<number>(1);
  const [activityEventsPerPage] = useState<number>(5);

  // Add this useEffect in SuperAdmin.tsx to handle hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (["overview", "admins", "fees", "activity"].includes(hash)) {
        setActiveTab(hash as SuperAdminTab);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const verifySuperAdmin = useCallback(async () => {
    if (!currentAccount) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const isAuth = await checkIsSuperAdmin(currentAccount.address);
      setIsAuthorized(isAuth);
      if (isAuth) {
        await fetchAllData();
      }
    } catch (err) {
      setError("Failed to verify super admin status.");
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, [currentAccount, checkIsSuperAdmin]);

  const fetchAllData = useCallback(async () => {
    try {
      console.log('🔄 Fetching all platform data...');
      const [
        feeBalance, 
        adminsList, 
        superAdminAddress, 
        stats, 
        activity,
        platformFee,
        activityStatsData,
        cardCount
      ] = await Promise.all([
        getPlatformFeeBalance(),
        getAdmins(),
        getSuperAdmin(),
        getPlatformStats(),
        getRecentActivity(),
        getPlatformFee(),
        getActivityStats(),
        getCardCount()
      ]);
      
      console.log('✅ Platform data fetched successfully:', {
        feeBalance,
        adminsCount: adminsList.length,
        superAdmin: superAdminAddress,
        stats,
        activityCount: activity.length,
        platformFee,
        activityStats: activityStatsData,
        cardCount
      });
      
      setPlatformFeeBalance(feeBalance);
      setAdmins(adminsList);
      setSuperAdmin(superAdminAddress);
      setPlatformStats(stats);
      setActivityLog(activity);
      setActivityStats(activityStatsData);
      setTotalCards(cardCount);
      setCurrentTradingFee(platformFee / 1_000_000_000); // Convert from MIST to SUI
    } catch (err) {
      console.error('❌ Error fetching platform data:', err);
      setError("Failed to fetch platform data.");
    }
  }, [getPlatformFeeBalance, getAdmins, getSuperAdmin, getCardCount]);

  // Add a refresh function for manual balance updates
  const refreshPlatformFeeBalance = useCallback(async () => {
    try {
      console.log('🔄 Refreshing platform fee balance...');
      const feeBalance = await getPlatformFeeBalance();
      setPlatformFeeBalance(feeBalance);
      console.log('✅ Platform fee balance refreshed:', feeBalance);
    } catch (err) {
      console.error('❌ Error refreshing platform fee balance:', err);
      setError("Failed to refresh platform fee balance.");
    }
  }, [getPlatformFeeBalance]);

  useEffect(() => {
    verifySuperAdmin();
  }, [verifySuperAdmin]);

  const handleAddAdmin = async () => {
    if (!newAdminAddress || !/^0x[a-fA-F0-9]{64}$/.test(newAdminAddress)) {
      alert("Please enter a valid Sui address.");
      return;
    }

    setAddingAdmin(true);
    try {
      const tx = grantAdminRoleTransaction(newAdminAddress);
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            alert("Admin added successfully!");
            setNewAdminAddress("");
            fetchAllData();
          },
          onError: (err) => {
            alert(`Failed to add admin: ${err.message}`);
          },
          onSettled: () => {
            setAddingAdmin(false);
          },
        },
      );
    } catch (err) {
      setAddingAdmin(false);
      alert(
        `An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleRemoveAdmin = async (adminAddress: string) => {
    setAdminToRemove(adminAddress);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveAdmin = async () => {
    if (!adminToRemove) return;
    
    setRemovingAdmin(adminToRemove);
    setShowRemoveConfirm(false);
    
    try {
      const tx = revokeAdminRoleTransaction(adminToRemove);
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            alert("Admin removed successfully!");
            fetchAllData();
          },
          onError: (err) => {
            alert(`Failed to remove admin: ${err.message}`);
          },
          onSettled: () => {
            setRemovingAdmin(null);
            setAdminToRemove(null);
          },
        },
      );
    } catch (err) {
      setRemovingAdmin(null);
      setAdminToRemove(null);
      alert(
        `An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleWithdrawFees = async () => {
    if (
      !withdrawAmount ||
      !withdrawRecipient ||
      !/^0x[a-fA-F0-9]{64}$/.test(withdrawRecipient)
    ) {
      alert("Please enter valid amount and recipient address.");
      return;
    }

    const amount = parseFloat(withdrawAmount) * 1_000_000_000; // Convert to MIST
    if (amount > platformFeeBalance) {
      alert("Insufficient platform fee balance.");
      return;
    }

    setWithdrawingFees(true);
    try {
      const tx = withdrawFeesTransaction(withdrawRecipient, amount);
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            alert("Fees withdrawn successfully!");
            setWithdrawAmount("");
            setWithdrawRecipient("");
            // Refresh the platform fee balance specifically
            refreshPlatformFeeBalance();
            fetchAllData();
          },
          onError: (err) => {
            alert(`Failed to withdraw fees: ${err.message}`);
          },
          onSettled: () => {
            setWithdrawingFees(false);
          },
        },
      );
    } catch (err) {
      setWithdrawingFees(false);
      alert(
        `An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleUpdateFees = async () => {
    if (!newTradingFee || !newListingFee) {
      alert("Please enter both platform fee and project posting fee.");
      return;
    }

    const platformFee = parseFloat(newTradingFee);
    const projectFee = parseFloat(newListingFee);

    if (platformFee < 0) {
      alert("Platform fee must be positive.");
      return;
    }

    if (projectFee < 0) {
      alert("Project posting fee must be positive.");
      return;
    }

    setUpdatingFees(true);
    try {
      // Note: Fee updates would require contract functions to be implemented
      // For now, we'll show a message that this feature is not yet implemented
      alert("Fee update functionality is not yet implemented in the contract. Current fees are fixed at 0.1 SUI (platform) and 0.2 SUI (project posting).");
      
      // In a real implementation, you would call the contract function here
      // const tx = updateFeesTransaction(platformFee * 1_000_000_000, projectFee * 1_000_000_000);
      // signAndExecute({ transaction: tx }, { ... });

      setNewTradingFee("");
      setNewListingFee("");
    } catch (err) {
      alert(
        `Failed to update fees: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setUpdatingFees(false);
    }
  };

  const handleResetFees = () => {
    setNewTradingFee("");
    setNewListingFee("");
  };

  const handleMaxWithdraw = () => {
    setWithdrawAmount((platformFeeBalance / 1_000_000_000).toString());
  };

  // Admin management handlers
  
  // Convert real admin data to display format
  const getDisplayAdmins = useCallback(() => {
    const displayAdmins = [];
    
    console.log('🔍 getDisplayAdmins - Raw admins array:', admins);
    console.log('🔍 getDisplayAdmins - Super admin:', superAdmin);
    
    // Add super admin
    if (superAdmin) {
      displayAdmins.push({
        address: superAdmin,
        role: "Super",
        status: "Active",
        notes: "Super Administrator",
      });
    }
    
    // Add regular admins (filter out vector entries and super admin)
    const filteredAdmins = admins.filter(address => {
      const isValid = address && 
                     !address.includes('vector') && 
                     address !== superAdmin;
      console.log(`🔍 Filtering admin "${address}": ${isValid}`);
      return isValid;
    });
    
    console.log('🔍 Filtered admins:', filteredAdmins);
    
    filteredAdmins.forEach((address) => {
      displayAdmins.push({
        address: address,
        role: "Admin",
        status: "Active",
        notes: "Administrator",
      });
    });
    
    console.log('🔍 Final display admins:', displayAdmins);
    return displayAdmins;
  }, [admins, superAdmin]);

  // Filter admins based on search term and role
  const filteredAdmins = getDisplayAdmins().filter(
    (admin) => {
      const matchesSearch = 
        admin.address.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
        admin.notes.toLowerCase().includes(adminSearchTerm.toLowerCase());
      
      const matchesRole = adminRoleFilter === "All" || admin.role === adminRoleFilter;
      
      return matchesSearch && matchesRole;
    }
  );

  const totalPages = Math.ceil(filteredAdmins.length / adminsPerPage);

  if (loading || isAuthorized === null) {
    return <SuperAdminSkeletonLoader />;
  }

  if (!isAuthorized) {
    return (
      <div className="pt-16 sm:pt-20 md:pt-24 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <div className="w-32 h-32 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-destructive/30">
              <Shield className="h-16 w-16 text-destructive" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Access Denied
            </h2>
            <p className="text-muted-foreground mb-6">
              You are not authorized to access the super admin panel.
            </p>
          </motion.div>
        </div>
    );
  }

  return (
    <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <SuperAdminSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            <main className="lg:col-span-3">
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 mb-8">
                  <p className="text-red-300 font-medium">Error: {error}</p>
                </div>
              )}

              {/* Overview Tab */}
              {activeTab === "overview" && (
                <SuperAdminOverview
                  platformStats={platformStats}
                  platformFeeBalance={platformFeeBalance}
                  totalCards={totalCards}
                  getDisplayAdmins={getDisplayAdmins}
                  onNavigateToAdmins={() => setActiveTab("admins")}
                  onNavigateToFees={() => setActiveTab("fees")}
                />
              )}

              {/* Admins Tab */}
              {activeTab === "admins" && (
                <SuperAdminAdmins
                  filteredAdmins={filteredAdmins}
                  getDisplayAdmins={getDisplayAdmins}
                  totalPages={totalPages}
                  currentPage={currentPage}
                  adminsPerPage={adminsPerPage}
                  adminSearchTerm={adminSearchTerm}
                  setAdminSearchTerm={setAdminSearchTerm}
                  adminRoleFilter={adminRoleFilter}
                  setAdminRoleFilter={setAdminRoleFilter}
                  setCurrentPage={setCurrentPage}
                  newAdminAddress={newAdminAddress}
                  setNewAdminAddress={setNewAdminAddress}
                  newAdminRole={newAdminRole}
                  setNewAdminRole={setNewAdminRole}
                  newAdminNote={newAdminNote}
                  setNewAdminNote={setNewAdminNote}
                  addingAdmin={addingAdmin}
                  handleAddAdmin={handleAddAdmin}
                  removingAdmin={removingAdmin}
                  handleRemoveAdmin={handleRemoveAdmin}
                />
              )}

              {/* Fees Tab */}
              {activeTab === "fees" && (
                <SuperAdminFees
                  platformFeeBalance={platformFeeBalance}
                  currentTradingFee={currentTradingFee}
                  currentListingFee={currentListingFee}
                  newTradingFee={newTradingFee}
                  setNewTradingFee={setNewTradingFee}
                  newListingFee={newListingFee}
                  setNewListingFee={setNewListingFee}
                  updatingFees={updatingFees}
                  handleUpdateFees={handleUpdateFees}
                  handleResetFees={handleResetFees}
                  withdrawAmount={withdrawAmount}
                  setWithdrawAmount={setWithdrawAmount}
                  withdrawRecipient={withdrawRecipient}
                  setWithdrawRecipient={setWithdrawRecipient}
                  withdrawingFees={withdrawingFees}
                  handleWithdrawFees={handleWithdrawFees}
                  handleMaxWithdraw={handleMaxWithdraw}
                  onRefreshBalance={refreshPlatformFeeBalance}
                />
              )}

              {/* Activity Log Tab */}
              {activeTab === "activity" && (
                <SuperAdminActivity
                  activityLog={activityLog}
                  activityStats={activityStats}
                  platformFeeBalance={platformFeeBalance}
                  activityFilter={activityFilter}
                  setActivityFilter={setActivityFilter}
                  activityCurrentPage={activityCurrentPage}
                  setActivityCurrentPage={setActivityCurrentPage}
                  activityEventsPerPage={activityEventsPerPage}
                />
              )}
            </main>
          </div>
        </div>

      {/* Confirmation Dialog */}
      <RemoveAdminDialog
        isOpen={showRemoveConfirm}
        adminToRemove={adminToRemove}
        onClose={() => {
          setShowRemoveConfirm(false);
          setAdminToRemove(null);
        }}
        onConfirm={confirmRemoveAdmin}
      />
    </div>
  );
};

export default SuperAdmin;
