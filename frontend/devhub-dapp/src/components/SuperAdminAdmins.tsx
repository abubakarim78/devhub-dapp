import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  XCircle, 
  UserPlus, 
  CheckCircle, 
  Loader2 
} from 'lucide-react';

interface Admin {
  address: string;
  role: string;
  status: string;
  notes: string;
}

interface SuperAdminAdminsProps {
  // Data
  filteredAdmins: Admin[];
  getDisplayAdmins: () => Admin[];
  totalPages: number;
  currentPage: number;
  adminsPerPage: number;
  
  // Search and filter states
  adminSearchTerm: string;
  setAdminSearchTerm: (term: string) => void;
  adminRoleFilter: "All" | "Admin" | "Super";
  setAdminRoleFilter: (filter: "All" | "Admin" | "Super") => void;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  
  // Add admin states
  newAdminAddress: string;
  setNewAdminAddress: (address: string) => void;
  newAdminRole: "Admin" | "Super";
  setNewAdminRole: (role: "Admin" | "Super") => void;
  newAdminNote: string;
  setNewAdminNote: (note: string) => void;
  addingAdmin: boolean;
  handleAddAdmin: () => void;
  
  // Remove admin states
  revokeAdminAddress: string;
  setRevokeAdminAddress: (address: string) => void;
  removingAdmin: string | null;
  handleRemoveAdmin: (address: string) => void;
}

const SuperAdminAdmins: React.FC<SuperAdminAdminsProps> = ({
  filteredAdmins,
  getDisplayAdmins,
  totalPages,
  currentPage,
  adminsPerPage,
  adminSearchTerm,
  setAdminSearchTerm,
  adminRoleFilter,
  setAdminRoleFilter,
  setCurrentPage,
  newAdminAddress,
  setNewAdminAddress,
  newAdminRole,
  setNewAdminRole,
  newAdminNote,
  setNewAdminNote,
  addingAdmin,
  handleAddAdmin,
  revokeAdminAddress,
  setRevokeAdminAddress,
  removingAdmin,
  handleRemoveAdmin,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent mb-4">
          Admins
        </h1>
        <p className="text-xl text-muted-foreground">
          View, search, and manage all admin accounts and roles.
        </p>
      </div>

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by address or name"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
            value={adminSearchTerm}
            onChange={(e) => setAdminSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={adminRoleFilter}
          onChange={(e) => setAdminRoleFilter(e.target.value as "All" | "Admin" | "Super")}
          className="px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
        >
          <option value="All">All Roles</option>
          <option value="Admin">Admin Only</option>
          <option value="Super">Super Only</option>
        </select>
        <button 
          onClick={() => {
            setAdminSearchTerm("");
            setAdminRoleFilter("All");
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
        >
          <XCircle className="h-5 w-5" />
          Clear
        </button>
        <button 
          onClick={() => {
            setNewAdminAddress("");
            setNewAdminNote("");
            setNewAdminRole("Admin");
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors"
        >
          <UserPlus className="h-5 w-5" />
          Add Admin
        </button>
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
          <p className="text-muted-foreground text-sm">
            Total Admins
          </p>
          <p className="text-3xl font-bold text-foreground">{getDisplayAdmins().length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-background rounded-lg p-4 border border-border flex flex-col items-center justify-center hover:border-green-500/50 transition-all cursor-pointer"
        >
          <p className="text-muted-foreground text-sm">
            Filtered Results
          </p>
          <p className="text-3xl font-bold text-foreground">{filteredAdmins.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-background rounded-lg p-4 border border-border flex flex-col items-center justify-center hover:border-red-500/50 transition-all cursor-pointer"
        >
          <p className="text-muted-foreground text-sm">
            Super Admins
          </p>
          <p className="text-3xl font-bold text-foreground">{getDisplayAdmins().filter(admin => admin.role === "Super").length}</p>
        </motion.div>
      </div>

      {/* Admin Directory Table */}
      <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-2xl">
        <h3 className="text-2xl font-semibold text-foreground mb-6">
          Admin Directory
        </h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="p-4 text-muted-foreground font-semibold">
                  Admin
                </th>
                <th className="p-4 text-muted-foreground font-semibold">
                  Role
                </th>
                <th className="p-4 text-muted-foreground font-semibold">
                  Status
                </th>
                <th className="p-4 text-muted-foreground font-semibold">
                  Notes
                </th>
                <th className="p-4 text-muted-foreground font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins
                .slice(
                  (currentPage - 1) * adminsPerPage,
                  currentPage * adminsPerPage,
                )
                .map((admin) => (
                  <tr
                    key={admin.address}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="p-4 flex items-center space-x-3">
                      <img
                        src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${admin.address}`}
                        alt="avatar"
                        className="h-8 w-8 rounded-full"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium font-mono text-sm text-foreground">
                          {admin.address.slice(0, 8)}...{admin.address.slice(-8)}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {admin.address}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${admin.role === "Super" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}`}
                      >
                        {admin.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${admin.status === "Active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                      >
                        {admin.status === "Active" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {admin.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {admin.notes || <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            admin.status === "Active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {admin.status === "Active"
                            ? "Granted"
                            : "Revoked"}
                        </span>
                        {admin.role !== "Super" && admin.status === "Active" && (
                          <button
                            onClick={() => handleRemoveAdmin(admin.address)}
                            disabled={removingAdmin === admin.address}
                            className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          >
                            {removingAdmin === admin.address ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.max(1, prev - 1))
              }
              disabled={currentPage === 1}
              className="px-4 py-2 bg-background border border-border rounded-lg text-foreground hover:bg-background/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(totalPages, prev + 1),
                )
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Admin & Revoke Admin */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Quick Add Admin */}
        <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <UserPlus className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              Quick Add Admin
            </h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Grant role by address
          </p>
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="0x Enter SUI address"
                className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                value={newAdminAddress}
                onChange={(e) => setNewAdminAddress(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                value={newAdminRole}
                onChange={(e) =>
                  setNewAdminRole(
                    e.target.value as "Admin" | "Super",
                  )
                }
              >
                <option value="Admin">Role: Admin</option>
                <option value="Super">Role: Super</option>
              </select>
            </div>
            <div>
              <input
                type="text"
                placeholder="Note (optional)"
                className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                value={newAdminNote}
                onChange={(e) => setNewAdminNote(e.target.value)}
              />
            </div>
            <button
              onClick={handleAddAdmin}
              disabled={addingAdmin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingAdmin ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              Grant
            </button>
            <p className="text-sm text-muted-foreground text-center">
              On-chain transaction required.
            </p>
          </div>
        </div>

        {/* Revoke Admin */}
        <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              Revoke Admin
            </h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Remove admin privileges by address
          </p>
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="0x Enter SUI address to revoke"
                className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                value={revokeAdminAddress}
                onChange={(e) => setRevokeAdminAddress(e.target.value)}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Reason for revocation (optional)"
                className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                value={newAdminNote}
                onChange={(e) => setNewAdminNote(e.target.value)}
              />
            </div>
            <button
              onClick={() => handleRemoveAdmin(revokeAdminAddress)}
              disabled={!!removingAdmin || !revokeAdminAddress}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {removingAdmin ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              Revoke Access
            </button>
            <p className="text-sm text-muted-foreground text-center">
              This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SuperAdminAdmins;
