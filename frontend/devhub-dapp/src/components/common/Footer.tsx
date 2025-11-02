import React from 'react';
import { Code2, Twitter, Github, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-primary rounded-lg">
                <Code2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">DevHub</span>
            </div>
            <p className="text-sm text-muted-foreground leading-6">
              Decentralized developer profiles on Sui. Showcase skills, connect, and collaborate.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Browse Developers</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Create Card</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Dashboard</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Admin</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Sui Docs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Stay updated</h4>
            <p className="text-sm text-muted-foreground mb-4">Get updates about new features and launches.</p>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 text-sm bg-secondary text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button className="bg-primary text-primary-foreground px-6 py-3 text-sm hover:bg-primary/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted-foreground">© {year} DevHub. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex items-center space-x-6">
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
