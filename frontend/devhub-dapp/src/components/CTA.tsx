'use client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTA = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center bg-secondary/80 backdrop-blur-sm p-6 sm:p-8 md:p-10 lg:p-12 rounded-xl sm:rounded-2xl border border-border"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground px-2">
            Ready to Join DevHub?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto px-4">
            Create your decentralized developer profile today and connect with the future of work on Sui.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex justify-center"
          >
            <Link
              to="/create"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-primary/90 transition-all text-sm sm:text-base shadow-lg shadow-primary/30 w-full sm:w-auto max-w-xs"
            >
              Create Your Card Now <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;