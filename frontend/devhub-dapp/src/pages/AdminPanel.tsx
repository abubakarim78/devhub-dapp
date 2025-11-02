import React, { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Shield, RefreshCw, Activity, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useContract } from '../hooks/useContract';
import { getRecentActivity, getActivityStats, getPlatformFeeBalance } from '../lib/suiClient';
import AdminSidebar, { AdminTab } from '@/components/AdminSidebar';
import AdminFeatures from '@/components/common/AdminFeatures';

const AdminSkeletonLoader: React.FC = () => (
    <div className="pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
                    <main className="lg:col-span-3">
                        <div className="h-40 bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl animate-pulse"></div>
                    </main>
                </div>
            </div>
        </div>
);

const AdminPanel: React.FC = () => {
    const currentAccount = useCurrentAccount();
    const { isAdmin: checkIsAdmin, getAdmins, getSuperAdmin } = useContract();

    const [adminVerified, setAdminVerified] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [admins, setAdmins] = useState<string[]>([]);
    const [superAdmin, setSuperAdmin] = useState<string>('');
    const [activityLog, setActivityLog] = useState<Array<{
        when: string;
        type: string;
        actor: string;
        details: string;
        txStatus: string;
        status: string;
    }>>([]);
    const [activityStats, setActivityStats] = useState<{
        totalEvents: number;
        adminEvents: number;
        feeEvents: number;
        cardEvents: number;
    }>({
        totalEvents: 0,
        adminEvents: 0,
        feeEvents: 0,
        cardEvents: 0
    });
    const [platformFeeBalance, setPlatformFeeBalance] = useState<number>(0);
    
    // Activity log filtering and pagination
    const [activityFilter, setActivityFilter] = useState<string>('All');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [eventsPerPage] = useState<number>(5);

    const fetchAdminData = useCallback(async () => {
        try {
            const [adminsList, superAdminAddress, activity, stats, feeBalance] = await Promise.all([
                getAdmins(),
                getSuperAdmin(),
                getRecentActivity(),
                getActivityStats(),
                getPlatformFeeBalance()
            ]);
            setAdmins(adminsList);
            setSuperAdmin(superAdminAddress || '');
            setActivityLog(activity);
            setActivityStats(stats);
            setPlatformFeeBalance(feeBalance);
        } catch (error) {
            console.error('❌ Error fetching admin data:', error);
        }
    }, [getAdmins, getSuperAdmin]);

    const verifyAdminAccess = useCallback(async () => {
        if (!currentAccount) {
            setAdminVerified(false);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const isAdminResult = await checkIsAdmin(currentAccount.address, true);
            setAdminVerified(isAdminResult);
            if (isAdminResult) {
                await fetchAdminData();
            }
        } catch (error) {
            console.error('❌ Admin verification failed:', error);
            setAdminVerified(false);
        } finally {
            setLoading(false);
        }
    }, [currentAccount, checkIsAdmin, fetchAdminData]);

    useEffect(() => {
        verifyAdminAccess();
    }, [verifyAdminAccess]);

    if (loading) {
        return <AdminSkeletonLoader />;
    }

    if (!currentAccount) {
        return (
            <div className="pt-24 flex items-center justify-center min-h-screen">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center max-w-md mx-auto px-4"
                    >
                        <div className="w-24 h-24 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-orange-500/30">
                            <Shield className="h-12 w-12 text-orange-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-4">Admin Access Required</h2>
                        <p className="text-muted-foreground mb-6">You need to connect your wallet to access the admin panel.</p>
                    </motion.div>
            </div>
        );
    }

    if (!adminVerified) {
        return (
            <div className="pt-24 flex items-center justify-center min-h-screen">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center max-w-md mx-auto px-4"
                    >
                        <div className="w-32 h-32 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-destructive/30">
                            <Shield className="h-16 w-16 text-destructive" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-4">Access Denied</h2>
                        <p className="text-muted-foreground mb-6">You are not authorized to access the admin panel.</p>
                        <button
                            onClick={verifyAdminAccess}
                            className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg shadow-primary/25 flex items-center space-x-2 mx-auto"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span>Retry Verification</span>
                        </button>
                    </motion.div>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
                        <main className="lg:col-span-3">
                            {activeTab === 'overview' && <AdminFeatures />}
                            
                            {activeTab === 'admins' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent mb-4">
                                            Admin Directory
                                        </h1>
                                        <p className="text-xl text-muted-foreground">View administrator information and roles.</p>
                                    </div>

                                    {/* Read-Only Notice */}
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Eye className="h-4 w-4 text-yellow-500" />
                                            <span className="text-sm font-medium text-yellow-700">Read-Only Access</span>
                                        </div>
                                        <p className="text-sm text-yellow-600">
                                            This section provides read-only access to admin information. Role management requires Super Admin privileges.
                                        </p>
                                    </div>

                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.1 }}
                                            whileHover={{ scale: 1.02, y: -5 }}
                                            className="bg-background rounded-lg p-4 border border-border flex flex-col items-center justify-center hover:border-blue-500/50 transition-all cursor-pointer"
                                        >
                                            <p className="text-muted-foreground text-sm">Total Admins</p>
                                            <p className="text-3xl font-bold text-foreground">{admins.length}</p>
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                            whileHover={{ scale: 1.02, y: -5 }}
                                            className="bg-background rounded-lg p-4 border border-border flex flex-col items-center justify-center hover:border-green-500/50 transition-all cursor-pointer"
                                        >
                                            <p className="text-muted-foreground text-sm">Super Admin</p>
                                            <p className="text-3xl font-bold text-foreground">1</p>
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.3 }}
                                            whileHover={{ scale: 1.02, y: -5 }}
                                            className="bg-background rounded-lg p-4 border border-border flex flex-col items-center justify-center hover:border-purple-500/50 transition-all cursor-pointer"
                                        >
                                            <p className="text-muted-foreground text-sm">Regular Admins</p>
                                            <p className="text-3xl font-bold text-foreground">{admins.length - 1}</p>
                                        </motion.div>
                                    </div>

                                    {/* Admin Directory Table */}
                                    <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-2xl">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-2xl font-semibold text-foreground">Admin Directory</h3>
                                            <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                                                <Eye className="h-3 w-3" />
                                                <span>Read Only</span>
                                            </div>
                                        </div>
                                        
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[600px] text-left">
                                                <thead>
                                                    <tr className="border-b border-border">
                                                        <th className="p-4 text-sm font-medium text-muted-foreground">Address</th>
                                                        <th className="p-4 text-sm font-medium text-muted-foreground">Role</th>
                                                        <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* All Admins (Super Admin + Regular Admins) */}
                                                    {(() => {
                                                        console.log('🔍 AdminPanel - Raw admins array:', admins);
                                                        console.log('🔍 AdminPanel - Super admin:', superAdmin);
                                                        
                                                        // Create display admins similar to SuperAdmin component
                                                        const displayAdmins = [];
                                                        
                                                        // Add super admin
                                                        if (superAdmin) {
                                                            displayAdmins.push({
                                                                address: superAdmin,
                                                                role: "Super Admin",
                                                                status: "Active"
                                                            });
                                                        }
                                                        
                                                        // Add regular admins (filter out vector entries and super admin)
                                                        const filteredAdmins = admins.filter(admin => {
                                                            const isValid = admin !== superAdmin && 
                                                                           admin && 
                                                                           !admin.includes('vector');
                                                            console.log(`🔍 AdminPanel - Filtering admin "${admin}": ${isValid}`);
                                                            return isValid;
                                                        });
                                                        
                                                        filteredAdmins.forEach(admin => {
                                                            displayAdmins.push({
                                                                address: admin,
                                                                role: "Admin",
                                                                status: "Active"
                                                            });
                                                        });
                                                        
                                                        console.log('🔍 AdminPanel - Final display admins:', displayAdmins);
                                                        return displayAdmins;
                                                    })()
                                                        .map((admin, index) => (
                                                        <tr key={index} className="border-b border-border/50">
                                                            <td className="p-4">
                                                                <div className="font-mono text-sm text-foreground break-all">
                                                                    {admin.address}
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                                    admin.role === "Super Admin" 
                                                                        ? "bg-red-500/20 text-red-400" 
                                                                        : "bg-blue-500/20 text-blue-400"
                                                                }`}>
                                                                    {admin.role}
                                                                </span>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                                                    {admin.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'activity' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent mb-4">
                                            Activity Log
                                        </h1>
                                        <p className="text-xl text-muted-foreground">Audit log of platform activities and admin actions.</p>
                                    </div>

                                    {/* Read-Only Notice */}
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Eye className="h-4 w-4 text-yellow-500" />
                                            <span className="text-sm font-medium text-yellow-700">Read-Only Access</span>
                                        </div>
                                        <p className="text-sm text-yellow-600">
                                            This section provides read-only access to activity logs. Detailed audit information is available to Super Admins.
                                        </p>
                                    </div>

                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.1 }}
                                            whileHover={{ scale: 1.02, y: -5 }}
                                            className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl hover:border-green-500/50 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Total Events</p>
                                                    <p className="text-3xl font-bold text-foreground">{activityStats.totalEvents}</p>
                                                </div>
                                                <button className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                                    {activityStats.totalEvents > 0 ? "Live" : "No Data"}
                                                </button>
                                            </div>
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                            whileHover={{ scale: 1.02, y: -5 }}
                                            className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl hover:border-blue-500/50 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Admin Events</p>
                                                    <p className="text-3xl font-bold text-foreground">{activityStats.adminEvents}</p>
                                                </div>
                                                <button className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                                                    Admin
                                                </button>
                                            </div>
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.3 }}
                                            whileHover={{ scale: 1.02, y: -5 }}
                                            className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl hover:border-purple-500/50 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Platform Fees</p>
                                                    <p className="text-3xl font-bold text-foreground">{(platformFeeBalance / 1_000_000_000).toFixed(2)}</p>
                                                </div>
                                                <button className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                                                    SUI
                                                </button>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Activity Log Table */}
                                    <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-2xl">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-2xl font-semibold text-foreground">Recent Activity</h3>
                                            <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                                                <Eye className="h-3 w-3" />
                                                <span>Read Only</span>
                                            </div>
                                        </div>
                                        
                                        {/* Filter Controls */}
                                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                            <div className="flex-1">
                                                <select
                                                    value={activityFilter}
                                                    onChange={(e) => {
                                                        setActivityFilter(e.target.value);
                                                        setCurrentPage(1);
                                                    }}
                                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                                >
                                                    <option value="All">All Events</option>
                                                    <option value="Role Granted">Role Granted</option>
                                                    <option value="Role Revoked">Role Revoked</option>
                                                    <option value="Withdrawal">Withdrawal</option>
                                                    <option value="Card Created">Card Created</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-muted-foreground">
                                                    Page {currentPage} of {Math.ceil((activityFilter === 'All' ? activityLog : activityLog.filter(item => item.type === activityFilter)).length / eventsPerPage)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {(() => {
                                                const filteredEvents = activityFilter === 'All' 
                                                    ? activityLog 
                                                    : activityLog.filter(item => item.type === activityFilter);
                                                
                                                const paginatedEvents = filteredEvents.slice(
                                                    (currentPage - 1) * eventsPerPage,
                                                    currentPage * eventsPerPage
                                                );

                                                return paginatedEvents.length > 0 ? (
                                                    paginatedEvents.map((item, index) => (
                                                    <div key={index} className="flex items-center space-x-4 p-4 bg-secondary/50 rounded-xl">
                                                        <div className={`p-2 rounded-lg ${
                                                            item.status === 'success' ? 'bg-green-500/20' :
                                                            item.status === 'warning' ? 'bg-yellow-500/20' :
                                                            item.status === 'info' ? 'bg-blue-500/20' :
                                                            'bg-gray-500/20'
                                                        }`}>
                                                            <Activity className={`h-4 w-4 ${
                                                                item.status === 'success' ? 'text-green-500' :
                                                                item.status === 'warning' ? 'text-yellow-500' :
                                                                item.status === 'info' ? 'text-blue-500' :
                                                                'text-gray-500'
                                                            }`} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-foreground">{item.details}</p>
                                                            <p className="text-xs text-muted-foreground">{item.when}</p>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded text-xs ${
                                                            item.status === 'success' ? 'bg-green-500/20 text-green-400' :
                                                            item.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            item.status === 'info' ? 'bg-blue-500/20 text-blue-400' :
                                                            'bg-gray-500/20 text-gray-400'
                                                        }`}>
                                                            {item.type}
                                                        </span>
                                                    </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                                        <p className="text-lg font-medium">No Activity Data Available</p>
                                                        <p className="text-sm">Activity logging will show real blockchain events when available.</p>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Pagination Controls */}
                                        {(() => {
                                            const filteredEvents = activityFilter === 'All' 
                                                ? activityLog 
                                                : activityLog.filter(item => item.type === activityFilter);
                                            const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
                                            
                                            if (totalPages <= 1) return null;
                                            
                                            return (
                                                <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                            disabled={currentPage === 1}
                                                            className="px-3 py-1 bg-background border border-border rounded text-foreground hover:bg-background/80 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Previous
                                                        </button>
                                                        <span className="px-3 py-1 text-muted-foreground">
                                                            Page {currentPage} of {totalPages}
                                                        </span>
                                                        <button
                                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                            disabled={currentPage === totalPages}
                                                            className="px-3 py-1 bg-background border border-border rounded text-foreground hover:bg-background/80 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Next
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm text-muted-foreground">Show:</span>
                                                        <select
                                                            value={eventsPerPage}
                                                            onChange={() => {
                                                                setCurrentPage(1);
                                                            }}
                                                            className="px-2 py-1 rounded border border-border bg-background text-foreground"
                                                            disabled
                                                        >
                                                            <option value={5}>5 events</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </motion.div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
    );
};

export default AdminPanel;