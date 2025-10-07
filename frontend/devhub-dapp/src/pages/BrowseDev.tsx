import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Zap, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
// Note: You need to create the two components above
import { DeveloperCard, Developer } from '../components/common/DeveloperCard';
import { FilterSidebar } from '../components/common/FilterSidebar';

// MOCK DATA: Replace this with your actual data fetching.
// I've added the new fields required by the DeveloperCard component.
const MOCK_DEVELOPERS: Developer[] = [
    { id: '1', name: 'Ari Nakamura', imageUrl: '', title: 'Move', specialties: 'Rust • TypeScript', location: 'Asia-Pacific', status: 'Available', skills: ['Move', 'Sui SDK', 'Auditing', 'React'], repos: 42, experience: 5, workload: '20h/week', rating: 4.9 },
    { id: '2', name: 'Maya Singh', imageUrl: '', title: 'Full-Stack', specialties: 'Next.js • GraphQL', location: 'North America', status: 'Open to offers', skills: ['TypeScript', 'Next.js', 'Move', 'Prisma'], repos: 28, experience: 6, workload: 'Remote', rating: 4.8 },
    { id: '3', name: 'Leo Martins', imageUrl: '', title: 'Auditor', specialties: 'Move • Formal Verification', location: 'EU', status: 'Available', skills: ['Move Prover', 'Security', 'Rust'], repos: 12, experience: 4, workload: 'Full-time', rating: 4.9 },
    { id: '4', name: 'Wei Chen', imageUrl: '', title: 'Backend', specialties: 'Rust • Sui Indexers', location: 'Asia', status: 'Busy', skills: ['Rust', 'gRPC', 'Postgres', 'Sui Indexer'], repos: 65, experience: 9, workload: '5h/week', rating: 5.0 },
    { id: '5', name: 'Ava Martinez', imageUrl: '', title: 'Frontend', specialties: 'React • Design Systems', location: 'Americas', status: 'Open to offers', skills: ['React', 'Design Systems', 'Tailwind', 'Storybook'], repos: 10, experience: 7, workload: 'Hybrid', rating: 4.9 },
    { id: '6', name: 'Jordan Lee', imageUrl: '', title: 'Protocol', specialties: 'Cryptography • Research', location: 'EU', status: 'Available', skills: ['Zero-Knowledge', 'Rust', 'Move'], repos: 8, experience: 4, workload: '10h/week', rating: 4.8 },
];


const Browse: React.FC = () => {
    const [loading, setLoading] = useState(true);
    // This state would hold your developers fetched from the contract
    const [developers, setDevelopers] = useState<Developer[]>([]);

    useEffect(() => {
        // Simulate fetching data
        setTimeout(() => {
            setDevelopers(MOCK_DEVELOPERS);
            setLoading(false);
        }, 1500);
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center text-white">
                    <Loader2 className="h-12 w-12 text-brand-purple animate-spin mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Loading Developers</h2>
                    <p className="text-gray-400">Finding the best talent on the blockchain...</p>
                </div>
            </div>
        );
    }
    
  return (
    <div className="bg-black text-white min-h-screen pt-24">
        {/* The Navbar component would be in your main App layout */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
            >
                <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Browse Developers</h1>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                    Discover Web3 talent on Sui. Filter by skills, stack, availability, and more.
                </p>
            </motion.div>

            {/* Category Pills */}
            <div className="flex justify-center flex-wrap gap-3 mb-8">
                {['All', 'Smart Contracts', 'Full-Stack', 'Frontend', 'Backend', 'Auditors'].map((cat, i) => (
                    <motion.button 
                        key={cat}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                            cat === 'All' ? 'bg-brand-purple text-white' : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                    >
                        {cat}
                    </motion.button>
                ))}
            </div>

            {/* Main Layout: Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Main Content */}
                <main className="lg:col-span-3">
                    {/* Filter Bar */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
                        <div className="relative flex-grow">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
                             <input type="text" placeholder="Search developers, skills, orgs" className="w-full bg-gray-800 rounded-md pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-brand-purple outline-none"/>
                        </div>
                        <button className="flex items-center gap-2 bg-gray-800 px-4 py-2.5 rounded-md hover:bg-gray-700 text-sm">More Filters <Filter size={16}/></button>
                        <button className="flex items-center gap-2 bg-brand-purple text-white px-4 py-2.5 rounded-md hover:bg-brand-purple-dark text-sm"><Zap size={16}/> Match Me</button>
                    </div>

                    {/* Developer List */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    >
                        {developers.map(dev => <DeveloperCard key={dev.id} developer={dev} />)}
                    </motion.div>

                    {/* Pagination */}
                    <div className="flex justify-center items-center gap-2 mt-12">
                        <button className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-800 disabled:opacity-50"><ArrowLeft size={16}/> Prev</button>
                        {[1, 2, 3, 4].map(num => (
                            <button key={num} className={`w-9 h-9 rounded-md text-sm font-medium ${num === 1 ? 'bg-brand-purple' : 'hover:bg-gray-800'}`}>{num}</button>
                        ))}
                        <button className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-800"><ArrowRight size={16}/> Next</button>
                    </div>
                </main>

                {/* Sidebar */}
                <FilterSidebar />
            </div>
        </div>
    </div>
  );
};

export default Browse;