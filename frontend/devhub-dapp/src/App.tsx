import { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useContract } from './hooks/useContract';
import Header from './components/Header';
import Home from './pages/Home';
import Browse from './pages/Browse';
import CreateCard from './pages/CreateCard';
import Dashboard from './pages/Dashboard';
import CardDetails from './pages/CardDetails';
import AdminPanel from './pages/AdminPanel';

export interface DevCard {
  id: number;
  owner: string;
  name: string;
  title: string;
  imageUrl: string;
  description?: string;
  yearsOfExperience: number;
  technologies: string;
  portfolio: string;
  contact: string;
  openToWork: boolean;
}

// Enhanced loading spinner with timeout
const LoadingSpinner = ({ onTimeout }: { onTimeout?: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onTimeout?.();
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [onTimeout]);

  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Checking admin status...</p>
        <p className="mt-2 text-sm text-gray-500">This may take a few moments</p>
      </div>
    </div>
  );
};

// Admin status cache
const adminStatusCache = new Map<string, { status: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function App() {
  const currentAccount = useCurrentAccount();
  const { isAdmin } = useContract();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminCheckFailed, setAdminCheckFailed] = useState(false);

  // Memoize the current account address
  const currentAddress = useMemo(() => currentAccount?.address, [currentAccount]);

  // Check cache for admin status
  const getCachedAdminStatus = useCallback((address: string): boolean | null => {
    const cached = adminStatusCache.get(address);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.status;
    }
    return null;
  }, []);

  // Cache admin status
  const setCachedAdminStatus = useCallback((address: string, status: boolean) => {
    adminStatusCache.set(address, { status, timestamp: Date.now() });
  }, []);

  // Debounced admin status check
  const checkAdminStatus = useCallback(async (address: string) => {
    // Check cache first
    const cachedStatus = getCachedAdminStatus(address);
    if (cachedStatus !== null) {
      setIsAdminUser(cachedStatus);
      return;
    }

    setLoading(true);
    setAdminCheckFailed(false);

    try {
      // Add timeout to the admin check
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Admin check timeout')), 8000);
      });

      const adminStatusPromise = isAdmin(address);
      
      const adminStatus = await Promise.race([adminStatusPromise, timeoutPromise]);
      
      setIsAdminUser(adminStatus);
      setCachedAdminStatus(address, adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdminUser(false);
      setAdminCheckFailed(true);
      
      // Cache failed result as false for shorter duration
      setCachedAdminStatus(address, false);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, getCachedAdminStatus, setCachedAdminStatus]);

  // Handle loading timeout
  const handleLoadingTimeout = useCallback(() => {
    setLoading(false);
    setAdminCheckFailed(true);
    setIsAdminUser(false);
    console.warn('Admin status check timed out');
  }, []);

  useEffect(() => {
    if (currentAddress) {
      checkAdminStatus(currentAddress);
    } else {
      setIsAdminUser(false);
      setLoading(false);
    }
  }, [currentAddress, checkAdminStatus]);

  // Retry admin check
  const retryAdminCheck = useCallback(() => {
    if (currentAddress) {
      // Clear cache for this address
      adminStatusCache.delete(currentAddress);
      checkAdminStatus(currentAddress);
    }
  }, [currentAddress, checkAdminStatus]);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Header isAdmin={isAdminUser} />
        
        {loading && <LoadingSpinner onTimeout={handleLoadingTimeout} />}
        
        {/* Show retry option if admin check failed */}
        {adminCheckFailed && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Unable to verify admin status. Some features may be limited.
                  </p>
                </div>
              </div>
              <button
                onClick={retryAdminCheck}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/create" element={<CreateCard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/card/:id" element={<CardDetails />} />
          <Route path="/admin" element={<AdminPanel isAdmin={isAdminUser} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;