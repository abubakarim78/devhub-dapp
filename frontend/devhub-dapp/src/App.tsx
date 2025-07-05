import React, { useState, useEffect } from 'react';
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

function App() {
  const currentAccount = useCurrentAccount();
  const { isAdmin } = useContract();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentAccount) {
        setLoading(true);
        try {
          const adminStatus = await isAdmin(currentAccount.address);
          setIsAdminUser(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdminUser(false);
        } finally {
          setLoading(false);
        }
      } else {
        setIsAdminUser(false);
      }
    };

    checkAdminStatus();
  }, [currentAccount, isAdmin]);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Header isAdmin={isAdminUser} />
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