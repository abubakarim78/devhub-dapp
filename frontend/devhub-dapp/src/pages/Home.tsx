import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Zap, Shield, Star, Code } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      icon: <Users className="h-8 w-8" />,
      title: "Connect with Developers",
      description: "Discover talented developers from around the world and connect with them directly."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast",
      description: "Built on Sui blockchain for ultra-fast transactions and seamless user experience."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure & Decentralized",
      description: "Your developer profile is secured by blockchain technology and owned by you."
    }
  ];

  const stats = [
    { number: "1,200+", label: "Developers" },
    { number: "450+", label: "Projects Completed" },
    { number: "98%", label: "Success Rate" },
    { number: "50+", label: "Countries" }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-16 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Your Gateway to
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Developer Talent
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Discover, connect, and collaborate with the world's most talented developers. 
              Create your decentralized developer profile and showcase your skills to the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/browse"
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center space-x-2"
              >
                <span>Browse Developers</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/create"
                className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Create Your Card
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose DevHub?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The first decentralized platform for developer profiles, built on cutting-edge blockchain technology.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/90 hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300"
              >
                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl w-fit mb-6 group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Developers Preview */}
      <section className="py-24 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Featured Developers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover talented developers who are making waves in the tech industry.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {String.fromCharCode(65 + i - 1)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Alex Developer</h3>
                    <p className="text-blue-600 font-medium">Full Stack Engineer</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">4.9</span>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Available</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Experienced in React, Node.js, Python, and blockchain technologies. 
                  Passionate about building scalable web applications.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['React', 'Node.js', 'TypeScript'].map((tech) => (
                    <span key={tech} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              to="/browse"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span>View All Developers</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-600/90"></div>
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Join DevHub?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Create your developer profile today and connect with opportunities worldwide.
              </p>
              <Link
                to="/create"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-xl"
              >
                <Code className="h-5 w-5" />
                <span>Create Your Card Now</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;