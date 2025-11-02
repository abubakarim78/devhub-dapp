import React, { ReactNode } from 'react';
import StarBackground from './StarBackground';

interface LayoutProps {
  children: ReactNode;
  /**
   * Whether to show the star background. Defaults to true.
   */
  showStarBackground?: boolean;
  /**
   * Additional className for the container wrapper
   */
  className?: string;
  /**
   * Whether to apply default padding and spacing. Defaults to true.
   */
  applyDefaultSpacing?: boolean;
}

/**
 * Main Layout component that wraps page content
 * Handles common layout elements like StarBackground and proper z-index layering
 */
const Layout: React.FC<LayoutProps> = ({
  children,
  showStarBackground = true,
  className = '',
  applyDefaultSpacing = true,
}) => {
  return (
    <div className={`relative overflow-hidden bg-background min-h-screen ${className}`}>
      {showStarBackground && <StarBackground />}
      <div className={`relative z-10 ${applyDefaultSpacing ? '' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default Layout;

