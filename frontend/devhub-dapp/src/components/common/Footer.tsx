import React from 'react';
import { Code2, Twitter, Github, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-black border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">DevHub</span>
            </div>
            <p className="text-sm text-gray-400 leading-6">
              Decentralized developer profiles on Sui. Showcase skills, connect, and collaborate.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Browse Developers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Create Card</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Dashboard</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Admin</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sui Docs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Stay updated</h4>
            <p className="text-sm text-gray-400 mb-4">Get updates about new features and launches.</p>
            <div className="flex rounded-lg border border-gray-700 overflow-hidden">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 text-sm bg-gray-900 text-white placeholder-gray-400 focus:outline-none"
              />
              <button className="bg-blue-600 text-white px-6 py-3 text-sm hover:bg-blue-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-gray-400">© {year} DevHub. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex items-center space-x-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
