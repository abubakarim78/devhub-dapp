import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  RefreshCw, 
  Search, 
  Activity 
} from 'lucide-react';

interface ActivityItem {
  when: string;
  type: string;
  actor: string;
  details: string;
  txStatus: string;
  status: string;
}

interface ActivityStats {
  totalEvents: number;
  adminEvents: number;
  feeEvents: number;
  cardEvents: number;
  projectEvents: number;
}

interface SuperAdminActivityProps {
  // Data
  activityLog: ActivityItem[];
  activityStats: ActivityStats;
  platformFeeBalance: number;
  
  // Filtering and pagination
  activityFilter: string;
  setActivityFilter: (filter: string) => void;
  activityCurrentPage: number;
  setActivityCurrentPage: (page: number) => void;
  activityEventsPerPage: number;
}

const SuperAdminActivity: React.FC<SuperAdminActivityProps> = ({
  activityLog,
  activityStats,
  platformFeeBalance,
  activityFilter,
  setActivityFilter,
  activityCurrentPage,
  setActivityCurrentPage,
  activityEventsPerPage,
}) => {
  // Filter events based on current filter
  const filteredEvents = activityFilter === 'All' 
    ? activityLog 
    : activityLog.filter(item => item.type === activityFilter);
  
  const totalPages = Math.ceil(filteredEvents.length / activityEventsPerPage);

  // Ensure current page doesn't exceed total pages
  const safeCurrentPage = Math.min(activityCurrentPage, Math.max(1, totalPages));
  
  // Recalculate paginated events with safe page
  const safePaginatedEvents = filteredEvents.slice(
    (safeCurrentPage - 1) * activityEventsPerPage,
    safeCurrentPage * activityEventsPerPage
  );


  // Reset to page 1 when filter changes
  useEffect(() => {
    setActivityCurrentPage(1);
  }, [activityFilter, setActivityCurrentPage]);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (totalPages > 0 && activityCurrentPage > totalPages) {
      setActivityCurrentPage(1);
    }
  }, [totalPages, activityCurrentPage, setActivityCurrentPage]);

  return (
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
        <p className="text-xl text-muted-foreground">
          Full audit history of admin actions, fee updates, withdrawals, and
          project creation.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          <Download className="h-5 w-5" />
          Export CSV
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors">
          <RefreshCw className="h-5 w-5" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl hover:border-green-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Events
              </p>
              <p className="text-3xl font-bold text-foreground">
                {activityStats.totalEvents}
              </p>
              <p className="text-xs text-muted-foreground">
                All platform events
              </p>
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
              <p className="text-sm text-muted-foreground">
                Admin Events
              </p>
              <p className="text-3xl font-bold text-foreground">
                {activityStats.adminEvents}
              </p>
              <p className="text-xs text-muted-foreground">
                Role management
              </p>
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
              <p className="text-sm text-muted-foreground">
                Fee Events
              </p>
              <p className="text-3xl font-bold text-foreground">
                {activityStats.feeEvents}
              </p>
              <p className="text-xs text-muted-foreground">
                Fee withdrawals
              </p>
            </div>
            <button className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
              Fees
            </button>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-2xl hover:border-yellow-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Platform Fees
              </p>
              <p className="text-3xl font-bold text-foreground">
                {(platformFeeBalance / 1_000_000_000).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                SUI available
              </p>
            </div>
            <button className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
              Available
            </button>
          </div>
        </motion.div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search address, tx, or note"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <select 
          value={activityFilter}
          onChange={(e) => {
            setActivityFilter(e.target.value);
            setActivityCurrentPage(1);
          }}
          className="px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none"
        >
          <option value="All">Type: All</option>
          <option value="Role Granted">Role Granted</option>
          <option value="Role Revoked">Role Revoked</option>
          <option value="Withdrawal">Withdrawal</option>
          <option value="Card Created">Card Created</option>
          <option value="Project Created">Project Created</option>
        </select>
        <select className="px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none">
          <option>Status: Any</option>
          <option>Confirmed</option>
          <option>Timelocked</option>
          <option>Review</option>
        </select>
        <select className="px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none">
          <option>Date: Last 30d</option>
          <option>Last 7d</option>
          <option>Last 24h</option>
        </select>
        <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
          Advanced
        </button>
      </div>

      {/* Activity Log Table */}
      <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="p-4 text-muted-foreground font-semibold">
                  When
                </th>
                <th className="p-4 text-muted-foreground font-semibold">
                  Type
                </th>
                <th className="p-4 text-muted-foreground font-semibold">
                  Actor
                </th>
                <th className="p-4 text-muted-foreground font-semibold">
                  Details
                </th>
                <th className="p-4 text-muted-foreground font-semibold">
                  Tx / Status
                </th>
              </tr>
            </thead>
            <tbody>
              {safePaginatedEvents.length > 0 ? (
                safePaginatedEvents.map((item, index) => (
                  <tr
                    key={`${item.when}-${item.type}-${item.actor}-${index}`}
                    className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="p-4 text-muted-foreground">
                      {item.when}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{item.actor}</td>
                    <td className="p-4 text-foreground">
                      {item.details}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.txStatus === "Confirmed"
                            ? "bg-green-500/20 text-green-400"
                            : item.txStatus === "Timelocked"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : item.txStatus === "Review"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {item.txStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center space-y-2">
                      <Activity className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No Activity Data Available</p>
                      <p className="text-sm">
                        Activity logging will be available when event querying is implemented.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {(() => {
          if (totalPages <= 1) return null;
          
          return (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActivityCurrentPage(Math.max(1, activityCurrentPage - 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-3 py-1 bg-background border border-border rounded text-foreground hover:bg-background/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-muted-foreground">
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setActivityCurrentPage(Math.min(totalPages, activityCurrentPage + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="px-3 py-1 bg-background border border-border rounded text-foreground hover:bg-background/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <select
                  value={activityEventsPerPage}
                  onChange={() => {
                    setActivityCurrentPage(1);
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
  );
};

export default SuperAdminActivity;
