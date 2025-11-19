import { useState, useEffect, useCallback, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useContract } from "./hooks/useContract";
import Footer from "./components/common/Footer";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import CreateCard from "./pages/CreateCard";
import Dashboard from "./pages/Dashboard";
import MyProfile from "./pages/MyProfile";
import Messages from "./pages/Messages";
import ChannelDashboard from "./pages/ChannelDashboard";
import Connections from "./pages/Connections";
import CardDetails from "./pages/CardDetails";
import AdminPanel from "./pages/AdminPanel";
import SuperAdmin from "./pages/SuperAdmin";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import ApplyProject from "./pages/ApplyProject";
import DashboardProjects from "./pages/DashboardProjects";
import DashboardProjectDetails from "./pages/DashboardProjectDetails";
import Proposals from "./pages/DashboardProposals";
import CreateProject from "./pages/CreateProject";
import ReviewSubmitProject from "./pages/ReviewSubmitProject";
import Collaborations from "./pages/Collaborations";
import DashboardSettings from "./pages/DashboardSettings";
import Navbar from "./components/common/Navbar";
import Layout from "./components/common/Layout";
import DashboardLayout from "./components/common/DashboardLayout";
import { useGlowingCursor } from "./hooks/useGlowingCursor";
import { Toaster } from "./components/ui/sonner";
import "./index.css";

export interface DevCard {
  id: number;
  owner: string;
  name: string;
  title: string;
  imageUrl: string;
  yearsOfExperience: number;
  technologies: string;
  portfolio: string;
  contact: string;
  openToWork: boolean;
}


// Admin status cache
const adminStatusCache = new Map<
  string,
  { status: boolean; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function App() {
  const currentAccount = useCurrentAccount();
  const { isAdmin } = useContract();
  const [isAdminUser, setIsAdminUser] = useState(false);
  useGlowingCursor();
  // Memoize the current account address
  const currentAddress = useMemo(
    () => currentAccount?.address,
    [currentAccount],
  );

  // Check cache for admin status
  const getCachedAdminStatus = useCallback(
    (address: string): boolean | null => {
      const cached = adminStatusCache.get(address);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.status;
      }
      return null;
    },
    [],
  );

  // Cache admin status
  const setCachedAdminStatus = useCallback(
    (address: string, status: boolean) => {
      adminStatusCache.set(address, { status, timestamp: Date.now() });
    },
    [],
  );

  // Debounced admin status check
  const checkAdminStatus = useCallback(
    async (address: string) => {
      // Check cache first
      const cachedStatus = getCachedAdminStatus(address);
      if (cachedStatus !== null) {
        setIsAdminUser(cachedStatus);
        return;
      }

      // Check admin status silently in the background
      try {
        // Add timeout to the admin check
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Admin check timeout")), 15000);
        });

        const adminStatusPromise = isAdmin(address);

        const adminStatus = await Promise.race([
          adminStatusPromise,
          timeoutPromise,
        ]);

        setIsAdminUser(adminStatus);
        setCachedAdminStatus(address, adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdminUser(false);

        // Cache failed result as false for shorter duration
        setCachedAdminStatus(address, false);
      }
    },
    [isAdmin, getCachedAdminStatus, setCachedAdminStatus],
  );

  useEffect(() => {
    if (currentAddress) {
      checkAdminStatus(currentAddress);
    } else {
      setIsAdminUser(false);
    }
  }, [currentAddress, checkAdminStatus]);

  return (
    <Router>
      <div id="glow-cursor" className="glow-cursor" />

      <div className="min-h-screen flex flex-col">
        <Navbar isAdmin={isAdminUser} />

        <div className="flex-1">
          <Routes>
            {/* Dashboard routes with sidebar - DashboardLayout already includes Layout */}
            <Route
              element={
                <DashboardLayout>
                  <Outlet />
                </DashboardLayout>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard-profile" element={<MyProfile />} />
              <Route path="/dashboard-messages" element={<Messages />} />
              <Route path="/dashboard-messages/:id" element={<Messages />} />
              <Route path="/dashboard-channels" element={<ChannelDashboard />} />
              <Route path="/dashboard-connections" element={<Connections />} />
              <Route path="/dashboard-projects" element={<DashboardProjects />} />
              <Route path="/dashboard-projects/:id" element={<DashboardProjectDetails />} />
              <Route path="/dashboard-proposals" element={<Proposals />} />
              <Route path="/dashboard-settings" element={<DashboardSettings />} />
            </Route>

            {/* Regular pages without dashboard sidebar */}
            <Route
              element={
                <Layout>
                  <Outlet />
                </Layout>
              }
            >
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/create" element={<CreateCard />} />
              <Route path="/card/:id" element={<CardDetails />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              <Route path="/projects/:id/apply" element={<ApplyProject />} />
              <Route path="/projects/new" element={<CreateProject />} />
              <Route path="/projects/review" element={<ReviewSubmitProject />} />
              <Route path="/collaborations" element={<Collaborations />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/super-admin" element={<SuperAdmin />} />
            </Route>
          </Routes>
        </div>

        <Footer />
      </div>
      <Toaster />
    </Router>
  );
}

export default App;
