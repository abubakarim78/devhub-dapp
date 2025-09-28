'use client';
import { motion } from 'framer-motion';

const CTA = () => {
  return (
    <section className="py-24 bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center bg-gray-900/50 p-12 rounded-2xl border border-gray-800"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Join DevHub?</h2>
          <p className="text-lg text-gray-400 mb-8">
            Create your developer profile today and connect with opportunities worldwide.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your Card Now
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;