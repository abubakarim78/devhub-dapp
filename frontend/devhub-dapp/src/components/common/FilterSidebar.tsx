import { motion } from 'framer-motion';
import { Bookmark, Zap, Star, MapPin, Search } from 'lucide-react';

const SidebarCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-secondary/50 backdrop-blur-xl border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5"
  >
    <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">{title}</h3>
    <div className="space-y-1.5 sm:space-y-2">
      {children}
    </div>
  </motion.div>
);

const FilterItem = ({ icon, label, count }: { icon: React.ReactNode, label: string, count: number }) => (
  <button className="w-full flex justify-between items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 sm:p-2 rounded-md transition-colors">
    <span className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
      <span className="flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
    <span className="bg-muted text-muted-foreground text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 ml-2">{count}</span>
  </button>
);

export const FilterSidebar = () => {
  return (
    <aside className="hidden lg:block space-y-4 sm:space-y-5 md:space-y-6">
      <SidebarCard title="Saved Searches">
        <FilterItem icon={<Bookmark className="h-3 w-3 sm:h-4 sm:w-4" />} label="Auditors • EU • FT" count={14} />
        <FilterItem icon={<Bookmark className="h-3 w-3 sm:h-4 sm:w-4" />} label="Move + React • PT" count={27} />
      </SidebarCard>

      <SidebarCard title="Quick Filters">
        <FilterItem icon={<Zap className="h-3 w-3 sm:h-4 sm:w-4" />} label="Available now" count={68} />
        <FilterItem icon={<Star className="h-3 w-3 sm:h-4 sm:w-4" />} label="Top rated" count={32} />
        <FilterItem icon={<MapPin className="h-3 w-3 sm:h-4 sm:w-4" />} label="Your timezone" count={44} />
      </SidebarCard>

      <SidebarCard title="Looking for">
        <FilterItem icon={<Search className="h-3 w-3 sm:h-4 sm:w-4" />} label="Smart Contract Engineer" count={112} />
        <FilterItem icon={<Search className="h-3 w-3 sm:h-4 sm:w-4" />} label="Full-Stack Engineer" count={201} />
        <FilterItem icon={<Search className="h-3 w-3 sm:h-4 sm:w-4" />} label="Security Auditor" count={47} />
      </SidebarCard>
    </aside>
  );
};