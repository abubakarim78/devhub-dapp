'use client';
import { motion } from 'framer-motion';
import { Users, Zap, Shield, GitBranch, Award, Layers } from 'lucide-react';

const Features = () => {
   const features = [
    {
      icon: <Layers className="h-8 w-8 text-primary" />,
      title: "Decentralized Identity",
      description: "Own your professional identity. Your skills, experience, and contributions are verifiable on the Sui blockchain."
    },
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      title: "Showcase Your Skills",
      description: "Create a rich, dynamic profile that goes beyond a traditional resume. Link to projects, and display your tech stack."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Discover Top Talent",
      description: "Find the right developers for your project with powerful filtering and a transparent, verifiable talent pool."
    }
  ];

  return (
    <section className="py-24 bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">The Next Generation of Professional Networks</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            DevHub isn't just a portfolio platform; it's a new standard for professional identity in the decentralized world.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-secondary/50 p-8 rounded-2xl border border-border transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="mb-6 inline-block p-4 bg-primary/10 rounded-xl border border-primary/20">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;