'use client';
import { motion } from 'framer-motion';
import { Users, Award, Layers, FolderOpen, Handshake, FileText } from 'lucide-react';

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
    },
    {
      icon: <FolderOpen className="h-8 w-8 text-primary" />,
      title: "Project Management",
      description: "Create, manage, and showcase your projects with full transparency. Track progress, contributions, and milestones on-chain."
    },
    {
      icon: <Handshake className="h-8 w-8 text-primary" />,
      title: "Collaborations",
      description: "Connect with other developers, form teams, and collaborate on projects. Build lasting professional relationships in the decentralized ecosystem."
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "Proposals & Governance",
      description: "Submit project proposals, participate in governance decisions, and contribute to the platform's evolution through transparent voting mechanisms."
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-8 sm:mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-foreground px-2">
            The Next Generation of Professional Networks
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
            DevHub isn't just a portfolio platform; it's a new standard for professional identity in the decentralized world.
          </p>
        </motion.div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-secondary/50 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-border transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="mb-4 sm:mb-5 md:mb-6 inline-block p-3 sm:p-4 bg-primary/10 rounded-lg sm:rounded-xl border border-primary/20">
                <div className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary">{feature.icon}</div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-foreground">{feature.title}</h3>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;