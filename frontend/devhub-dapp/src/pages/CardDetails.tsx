import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, ExternalLink, Star, Clock, Calendar, Code2, Briefcase } from 'lucide-react';
import { DevCard } from '../App';

const CardDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Mock card data - in real app, this would come from the blockchain
  const card: DevCard = {
    id: parseInt(id || '1'),
    owner: '0x1234567890abcdef1234567890abcdef12345678',
    name: 'Sarah Chen',
    title: 'Senior Frontend Developer',
    imageUrl: 'https://images.pexels.com/photos/3756681/pexels-photo-3756681.jpeg?auto=compress&cs=tinysrgb&w=600',
    description: 'Passionate frontend developer with expertise in React, Vue, and modern web technologies. I love creating beautiful, user-friendly interfaces that make a difference in people\'s lives. Currently working on building scalable applications and leading a team of talented developers.',
    yearsOfExperience: 5,
    technologies: 'React, Vue.js, TypeScript, Tailwind CSS, Node.js, GraphQL, Jest, Cypress',
    portfolio: 'https://sarahchen.dev',
    contact: 'sarah@example.com',
    openToWork: true
  };

  const technologies = card.technologies.split(', ');
  const portfolioProjects = [
    {
      name: 'E-commerce Platform',
      description: 'Modern e-commerce solution built with React and Node.js',
      tech: ['React', 'Node.js', 'MongoDB'],
      url: 'https://example.com/project1'
    },
    {
      name: 'Task Management App',
      description: 'Collaborative project management tool with real-time updates',
      tech: ['Vue.js', 'TypeScript', 'Socket.io'],
      url: 'https://example.com/project2'
    },
    {
      name: 'Design System',
      description: 'Comprehensive component library and design system',
      tech: ['React', 'Storybook', 'Tailwind CSS'],
      url: 'https://example.com/project3'
    }
  ];

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/browse"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Browse</span>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <div className="flex items-start space-x-6 mb-6">
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-32 h-32 rounded-2xl object-cover ring-4 ring-white/50 shadow-lg"
                />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{card.name}</h1>
                  <p className="text-xl text-blue-600 font-semibold mb-4">{card.title}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{card.yearsOfExperience} years experience</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Member since 2024</span>
                    </div>
                  </div>
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full font-medium ${
                    card.openToWork 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      card.openToWork ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <span>{card.openToWork ? 'Available for work' : 'Currently unavailable'}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {card.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                  <p className="text-gray-600 leading-relaxed">{card.description}</p>
                </div>
              )}
            </div>

            {/* Technologies */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Code2 className="h-5 w-5 text-blue-600" />
                <span>Technologies & Skills</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {technologies.map((tech, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-blue-800 font-medium">{tech}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Projects */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <span>Featured Projects</span>
              </h3>
              <div className="space-y-6">
                {portfolioProjects.map((project, index) => (
                  <div
                    key={index}
                    className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{project.name}</h4>
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-gray-600" />
                      </a>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2 py-1 bg-white text-gray-700 text-xs font-medium rounded-lg border"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Get in Touch</h3>
              <div className="space-y-3">
                <a
                  href={`mailto:${card.contact}`}
                  className="flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
                >
                  <div className="p-2 bg-blue-600 text-white rounded-lg group-hover:bg-blue-700 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Send Email</div>
                    <div className="text-sm text-gray-600">{card.contact}</div>
                  </div>
                </a>
                <a
                  href={card.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                >
                  <div className="p-2 bg-gray-600 text-white rounded-lg group-hover:bg-gray-700 transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">View Portfolio</div>
                    <div className="text-sm text-gray-600">External link</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Profile Views</span>
                  <span className="font-semibold text-gray-900">124</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Projects</span>
                  <span className="font-semibold text-gray-900">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-900">4.9</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Availability Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Availability Status</h3>
              <p className="text-blue-100 text-sm mb-4">
                {card.openToWork 
                  ? 'Currently available for new projects and opportunities.' 
                  : 'Not available for new projects at the moment.'}
              </p>
              {card.openToWork && (
                <button className="w-full py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors">
                  Contact Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetails;