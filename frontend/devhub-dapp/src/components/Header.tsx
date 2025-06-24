import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Code2, Wallet } from 'lucide-react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

interface HeaderProps {
  isAdmin: boolean;
}

const Header: React.FC<HeaderProps> = ({ isAdmin }) => {
  const location = useLocation();
  const currentAccount = useCurrentAccount();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-200">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              DevHub
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              Home
            </Link>
            <Link
              to="/browse"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/browse') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              Browse Developers
            </Link>
            {currentAccount && (
              <>
                <Link
                  to="/create"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive('/create') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Create Card
                </Link>
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive('/dashboard') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isActive('/admin') 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center space-x-3">
            {currentAccount ? (
              <div className="flex items-center space-x-3">
                <ConnectButton
                  connectText={
                    <span className="flex justify-center gap-2 items-center !text-white !px-2 !py-1">
                      <Wallet className="h-4 w-4 mr-2" color="#ffffff" />
                      Disconnect
                    </span>
                  }
                  className="!bg-gray-600 !rounded-lg !font-medium cursor-pointer hover:!bg-gray-700 transition-all duration-200 !text-sm"
                />
              </div>
            ) : (
              <ConnectButton
                connectText={
                  <span className="flex justify-center gap-2 items-center !text-white !px-2 !py-1">
                    <Wallet className="h-4 w-4 mr-2" color="#ffffff" />
                    Connect Wallet
                  </span>
                }
                className="!bg-[#006fee] !rounded-2xl !font-semibold cursor-pointer hover:opacity-80 transition-all duration-300"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;