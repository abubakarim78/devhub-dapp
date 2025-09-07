import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Twitter, Github, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-indigo-50/60 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand (reuse header logo) */}
          <div>
            <Link to="/" className="inline-flex items-center space-x-2 group">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-200">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                DevHub
              </span>
            </Link>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Decentralized developer profiles on Sui. Showcase skills, connect, and collaborate.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Product</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>
                <Link to="/browse" className="hover:text-slate-900 transition-colors">Browse Developers</Link>
              </li>
              <li>
                <Link to="/create" className="hover:text-slate-900 transition-colors">Create Card</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-slate-900 transition-colors">Dashboard</Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Company</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>
                <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-slate-900 transition-colors">Admin</Link>
              </li>
              <li>
                <a href="https://docs.sui.io" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">Sui Docs</a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Stay updated</h4>
            <p className="mt-4 text-sm text-slate-600">Get updates about new features and launches.</p>
            <div className="mt-3 flex items-center rounded-full ring-1 ring-inset ring-slate-200 bg-white">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 h-11 px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none rounded-l-full"
              />
              <button
                type="button"
                className="shrink-0 h-11 inline-flex items-center justify-center rounded-r-full whitespace-nowrap bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-colors"
              >
                Subscribe
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">We respect your privacy. Unsubscribe anytime.</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-slate-500">© {year} DevHub. All rights reserved.</p>
          <div className="mt-4 md:mt-0 inline-flex items-center space-x-4 text-sm text-slate-600">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-slate-900 transition-colors">
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-slate-900 transition-colors">
              <Twitter className="h-4 w-4" />
              <span>Twitter</span>
            </a>
            <a href="https://discord.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-slate-900 transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span>Discord</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
