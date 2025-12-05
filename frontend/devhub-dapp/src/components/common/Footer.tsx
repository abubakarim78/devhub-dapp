import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Github, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-8 xl:px-10 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/DevHub.jpg" 
                alt="TumaHub Logo" 
                className="h-12 w-12 rounded-lg object-cover"
              />
              <span className="text-2xl font-bold text-foreground">TumaHub</span>
            </div>
            <p className="text-sm text-muted-foreground leading-6">
              Decentralized professional network on Sui. Showcase skills, connect, collaborate, and host hackathons across all Web2/Web3 niches.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/browse" className="hover:text-foreground transition-colors">Browse Professionals</Link></li>
              <li><Link to="/create" className="hover:text-foreground transition-colors">Create Card</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link to="/opportunities" className="hover:text-foreground transition-colors">Opportunities</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
              <li><Link to="/admin" className="hover:text-foreground transition-colors">Admin</Link></li>
              <li><a href="https://docs.sui.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Sui Docs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Stay updated</h4>
            <p className="text-sm text-muted-foreground mb-4">Get updates about new features and launches.</p>
            <div className="flex flex-nowrap rounded-lg border border-border overflow-hidden w-full">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 min-w-0 px-4 py-3 text-sm bg-secondary text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button className="bg-primary text-primary-foreground px-4 sm:px-6 py-3 text-sm hover:bg-primary/90 transition-colors flex-shrink-0 whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 md:mt-10 pt-6 sm:pt-8 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">© {year} TumaHub. All rights reserved.</p>
          <div className="flex items-center justify-center md:justify-end space-x-4 sm:space-x-6">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
