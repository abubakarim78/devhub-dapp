'use client';
import { motion } from 'framer-motion';
import { Users, Zap, Shield } from 'lucide-react';


const Features = () => {
   const features = [
    {
      icon: <Users className="h-8 w-8 text-blue-500" />,
      title: "Connect with Developers",
      description: "Tap into a global network of Web3 talent. Discover profiles, review portfolios, and collaborate on-chain."
    },
    {
      icon: <Zap className="h-8 w-8 text-blue-500" />,
      title: "Lightning Fast",
      description: "Experience near-instant discovery and verifiable credentials powered by the Sui blockchain."
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      title: "Secure & Decentralized",
      description: "Your identity, skills, and reputation are secured on-chain with a privacy-first design."
    }
  ];

  return (
    <section className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Why Choose DevHub?</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            A decentralized platform empowering developers and teams to build with confidence.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-gray-900/50 p-8 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;