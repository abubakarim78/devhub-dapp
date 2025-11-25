import React, { ReactNode, useState } from 'react';
import Layout from './Layout';
import DashboardSidebar from '../DashboardSidebar';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
  children: ReactNode;
  /**
   * Whether to show the star background. Defaults to true.
   */
  showStarBackground?: boolean;
}

/**
 * Dashboard Layout component that wraps dashboard page content
 * Includes the DashboardSidebar and proper spacing
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  showStarBackground = true,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Layout showStarBackground={showStarBackground} applyDefaultSpacing={false} allowOverflow={true}>
      <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden fixed top-20 sm:top-24 left-4 z-50 p-2 bg-secondary/80 backdrop-blur-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors shadow-lg"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
                {/* Sidebar Drawer */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'tween', duration: 0.3 }}
                  className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-background border-r border-border z-50 lg:hidden overflow-y-auto"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-foreground">Dashboard Menu</h2>
                      <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        aria-label="Close sidebar"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <DashboardSidebar onNavigate={() => setSidebarOpen(false)} />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
            {/* Desktop Sidebar - Fixed position, spacer div to maintain grid layout */}
            <div className="hidden lg:block lg:self-start">
              <DashboardSidebar />
            </div>
            {/* Main Content */}
            <main className="lg:col-span-3 xl:col-span-4">
              {children}
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardLayout;

