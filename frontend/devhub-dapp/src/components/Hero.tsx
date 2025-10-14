'use client';
import { motion, Variants } from 'framer-motion'; // 1. Import the 'Variants' type
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  // 2. Explicitly type the constant with ': Variants'
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.2, delayChildren: 0.3 } 
    },
  };

  // 3. Explicitly type this constant as well
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: "easeOut" } 
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 text-center overflow-hidden bg-background">
      {/* Aurora Background - self-contained visual */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute -translate-x-[40%] -translate-y-1/2 w-[1000px] h-[1000px] bg-primary rounded-full opacity-15 blur-3xl animate-blob"></div>
        <div className="absolute translate-x-[40%] translate-y-[10%] w-[1000px] h-[1000px] bg-blue-500 rounded-full opacity-15 blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      
      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          variants={itemVariants} 
          className="inline-block bg-secondary/80 backdrop-blur-sm border border-border rounded-full px-4 py-2 text-sm text-muted-foreground mb-6"
        >
          <span className="font-semibold text-primary">On-Chain Identity</span> for Web3 Builders
        </motion.div>
        
        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-7xl font-extrabold mb-6 text-foreground leading-tight tracking-tighter"
        >
          Where Elite Web3 Talent is{' '}
          <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Verifiable
          </span>
        </motion.h1>
        
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Create your decentralized developer card, showcase your skills with on-chain proof, and connect with the future of work.
        </motion.p>
        
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-lg hover:bg-primary/90 transition-all text-base shadow-lg shadow-primary/20"
            >
              Create Your Card <ArrowRight size={20} />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/browse"
              className="bg-secondary/80 backdrop-blur-sm border border-border text-foreground font-semibold px-8 py-4 rounded-lg hover:bg-accent transition-colors inline-block text-base"
            >
              Browse Developers
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;