import React, { ReactNode } from 'react';
import Layout from './Layout';
import DashboardSidebar from '../DashboardSidebar';

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
  return (
    <Layout showStarBackground={showStarBackground} applyDefaultSpacing={false}>
      <div className="pt-32 pb-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <DashboardSidebar />
            <main className="lg:col-span-3">
              {children}
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardLayout;

