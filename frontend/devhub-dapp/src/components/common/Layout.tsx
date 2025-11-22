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
  /**
   * Whether to allow overflow (needed for sticky positioning). Defaults to false.
   */
  allowOverflow?: boolean;
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
  allowOverflow = false,
}) => {
  return (
    <div className={`relative ${allowOverflow ? 'overflow-visible' : 'overflow-hidden'} bg-background min-h-screen ${className}`}>
      {showStarBackground && (
        <div className="absolute inset-0 overflow-hidden">
          <StarBackground />
        </div>
      )}
      <div className={`relative z-10 ${applyDefaultSpacing ? '' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default Layout;

