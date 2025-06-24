import React, { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Shield, DollarSign, Users, TrendingUp, Download, UserCheck, Settings } from 'lucide-react';

interface AdminPanelProps {
  isAdmin: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isAdmin }) => {
  const currentAccount = useCurrentAccount();
  const [platformFees, setPlatformFees] = useState(5.4); // Mock data
  const [totalCards] = useState(1247);
  const [activeUsers] = useState(892);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const recentTransactions = [
    { id: 1, user: '0x1234...5678', amount: 0.1, type: 'Card Creation', date: '2024-01-15' },
    { id: 2, user: '0x2345...6789', amount: 0.1, type: 'Card Creation', date: '2024-01-15' },
    { id: 3, user: '0x3456...7890', amount: 0.1, type: 'Card Creation', date: '2024-01-14' },
    { id: 4, user: '0x4567...8901', amount: 0.1, type: 'Card Creation', date: '2024-01-14' },
    { id: 5, user: '0x5678...9012', amount: 0.1, type: 'Card Creation', date: '2024-01-13' },
  ];

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= platformFees) {
      setPlatformFees(prev => prev - amount);
      setWithdrawAmount('');
      alert(`Successfully withdrew ${amount} SUI`);
    } else {
      alert('Invalid withdrawal amount');
    }
  };

  if (!currentAccount) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-12 w-12 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h2>
          <p className="text-gray-600 mb-6">You need to connect your wallet to access the admin panel.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have admin privileges to access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-xl text-gray-600">Platform management and analytics dashboard</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{platformFees.toFixed(2)} SUI</div>
                <div className="text-sm text-gray-600">Platform Fees</div>
              </div>
            </div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+12% from last month</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{totalCards.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Cards</div>
              </div>
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+8% from last week</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{activeUsers.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
            </div>
            <div className="flex items-center text-sm text-purple-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+15% from last month</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">24.7%</div>
                <div className="text-sm text-gray-600">Growth Rate</div>
              </div>
            </div>
            <div className="flex items-center text-sm text-orange-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+3% from last week</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Fee Management */}
          <div className="lg:col-span-2 space-y-8">
            {/* Withdraw Fees */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                <span>Platform Fee Management</span>
              </h3>
              
              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Available Balance</h4>
                    <p className="text-sm text-gray-600">Total accumulated platform fees</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">{platformFees.toFixed(2)} SUI</div>
                    <div className="text-sm text-green-700">~${(platformFees * 2.3).toFixed(2)} USD</div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Amount (SUI)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={platformFees}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleWithdraw}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-teal-700 transition-all duration-200"
                  >
                    Withdraw Fees
                  </button>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setWithdrawAmount((platformFees * 0.5).toString())}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  50%
                </button>
                <button
                  onClick={() => setWithdrawAmount(platformFees.toString())}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  All
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                      <th className="pb-3">User</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id} className="text-sm border-b border-gray-100 last:border-0">
                        <td className="py-3 font-mono text-gray-900">{tx.user}</td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg">
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-green-600">{tx.amount} SUI</td>
                        <td className="py-3 text-gray-600">{tx.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Platform Settings */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <span>Platform Settings</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Fee (SUI)
                  </label>
                  <input
                    type="number"
                    value="0.1"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Fee for creating developer cards</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Address
                  </label>
                  <input
                    type="text"
                    value={currentAccount.address}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Export Data */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Export Data</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
                  <Download className="h-4 w-4" />
                  <span>Export Transactions</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-600 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors">
                  <Download className="h-4 w-4" />
                  <span>Export User Data</span>
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Platform Status</span>
                  <span className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Online</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Blockchain Connection</span>
                  <span className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Connected</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Healthy</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;