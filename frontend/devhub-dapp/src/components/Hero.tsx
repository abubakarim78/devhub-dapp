'use client';
import { motion } from 'framer-motion';
import StarBackground from './common/StarBackground'; // 1. Import StarBackground

const Hero = () => {
   const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center justify-center pt-20 bg-black">
      <StarBackground />
      
      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          variants={itemVariants} 
          className="inline-block bg-gray-800/50 border border-gray-700 rounded-full px-4 py-1 text-sm text-gray-300 mb-6"
        >
          Built on Sui
        </motion.div>
        
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight"
        >
          Your Gateway to Web3<br/>Developer Talent
        </motion.h1>
        
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          Discover, connect, and collaborate with the world's most talented developers. Create your decentralized developer profile and showcase your skills to the world.
        </motion.p>
        
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Developers
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="border border-gray-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-800/50 transition-colors"
          >
            Create Your Profile
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;