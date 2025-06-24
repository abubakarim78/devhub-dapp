import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
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
  viewCount?: number;
  inquiries?: number;
}

function App() {
  const currentAccount = useCurrentAccount();
  const [isAdmin, setIsAdmin] = useState(false);

  // In a real app, you would check if the current account is admin
  // by calling your smart contract's is_admin function
  React.useEffect(() => {
    if (currentAccount) {
      // Mock admin check - replace with actual contract call
      // const adminAddress = "0x..."; // Your admin address
      // setIsAdmin(currentAccount.address === adminAddress);
      setIsAdmin(false); // Set to false by default for demo
    }
  }, [currentAccount]);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Header isAdmin={isAdmin} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/create" element={<CreateCard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/card/:id" element={<CardDetails />} />
          <Route path="/admin" element={<AdminPanel isAdmin={isAdmin} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;