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
      <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
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

