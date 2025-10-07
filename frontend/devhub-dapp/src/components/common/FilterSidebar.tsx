import { motion } from 'framer-motion';
import { Bookmark, Zap, Star, MapPin, Search } from 'lucide-react';

const SidebarCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5"
  >
    <h3 className="font-semibold text-white mb-4">{title}</h3>
    <div className="space-y-2">
      {children}
    </div>
  </motion.div>
);

const FilterItem = ({ icon, label, count }: { icon: React.ReactNode, label: string, count: number }) => (
  <button className="w-full flex justify-between items-center text-sm text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-md transition-colors">
    <span className="flex items-center gap-2">
      {icon}
      {label}
    </span>
    <span className="bg-gray-700 text-gray-400 text-xs font-medium px-2 py-0.5 rounded-full">{count}</span>
  </button>
);

export const FilterSidebar = () => {
  return (
    <aside className="hidden lg:block space-y-6">
      <SidebarCard title="Saved Searches">
        <FilterItem icon={<Bookmark size={16}/>} label="Auditors • EU • FT" count={14} />
        <FilterItem icon={<Bookmark size={16}/>} label="Move + React • PT" count={27} />
      </SidebarCard>

      <SidebarCard title="Quick Filters">
        <FilterItem icon={<Zap size={16}/>} label="Available now" count={68} />
        <FilterItem icon={<Star size={16}/>} label="Top rated" count={32} />
        <FilterItem icon={<MapPin size={16}/>} label="Your timezone" count={44} />
      </SidebarCard>

      <SidebarCard title="Looking for">
        <FilterItem icon={<Search size={16}/>} label="Smart Contract Engineer" count={112} />
        <FilterItem icon={<Search size={16}/>} label="Full-Stack Engineer" count={201} />
        <FilterItem icon={<Search size={16}/>} label="Security Auditor" count={47} />
      </SidebarCard>
    </aside>
  );
};