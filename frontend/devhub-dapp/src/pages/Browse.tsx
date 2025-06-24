import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, ExternalLink, Mail } from 'lucide-react';
import { DevCard } from '../App';

const Browse: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // Mock data - in real app, this would come from the blockchain
  const mockCards: DevCard[] = [
    {
      id: 1,
      owner: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'Sarah Chen',
      title: 'Senior Frontend Developer',
      imageUrl: 'https://images.pexels.com/photos/3756681/pexels-photo-3756681.jpeg?auto=compress&cs=tinysrgb&w=300',
      description: 'Passionate frontend developer with expertise in React, Vue, and modern web technologies. Love creating beautiful, user-friendly interfaces that make a difference.',
      yearsOfExperience: 5,
      technologies: 'React, Vue.js, TypeScript, Tailwind CSS, Node.js',
      portfolio: 'https://sarahchen.dev',
      contact: 'sarah@example.com',
      openToWork: true
    },
    {
      id: 2,
      owner: '0x2345678901bcdef1234567890abcdef123456789',
      name: 'Marcus Johnson',
      title: 'Full Stack Engineer',
      imageUrl: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=300',
      description: 'Full-stack developer specializing in scalable web applications and cloud architecture. Experience with both startups and enterprise solutions.',
      yearsOfExperience: 7,
      technologies: 'Python, Django, React, AWS, Docker, PostgreSQL',
      portfolio: 'https://marcusjohnson.io',
      contact: 'marcus@example.com',
      openToWork: false
    },
    {
      id: 3,
      owner: '0x3456789012cdef1234567890abcdef1234567890',
      name: 'Elena Rodriguez',
      title: 'Blockchain Developer',
      imageUrl: 'https://images.pexels.com/photos/3748221/pexels-photo-3748221.jpeg?auto=compress&cs=tinysrgb&w=300',
      description: 'Blockchain enthusiast building the future of decentralized applications. Specialized in Sui, Solidity, and DeFi protocols.',
      yearsOfExperience: 3,
      technologies: 'Sui Move, Solidity, Rust, Web3.js, DeFi',
      portfolio: 'https://elenarodriguez.xyz',
      contact: 'elena@example.com',
      openToWork: true
    },
    {
      id: 4,
      owner: '0x4567890123def1234567890abcdef12345678901',
      name: 'David Kim',
      title: 'DevOps Engineer',
      imageUrl: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=300',
      description: 'DevOps engineer passionate about automation, infrastructure as code, and building reliable, scalable systems.',
      yearsOfExperience: 6,
      technologies: 'Kubernetes, Terraform, AWS, CI/CD, Monitoring',
      portfolio: 'https://davidkim.tech',
      contact: 'david@example.com',
      openToWork: true
    }
  ];

  const allTechnologies = Array.from(
    new Set(mockCards.flatMap(card => card.technologies.split(', ')))
  ).sort();

  const filteredCards = mockCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.technologies.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTech = !selectedTech || card.technologies.includes(selectedTech);
    const matchesAvailability = !showAvailableOnly || card.openToWork;
    
    return matchesSearch && matchesTech && matchesAvailability;
  });

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Discover Amazing Developers
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse through our community of talented developers and find the perfect match for your project.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20 shadow-lg">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by name, title, or technology..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-gray-900 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="w-full px-4 py-3 text-gray-900 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Technologies</option>
                {allTechnologies.map(tech => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer bg-white/80">
                <input
                  type="checkbox"
                  checked={showAvailableOnly}
                  onChange={(e) => setShowAvailableOnly(e.target.checked)}
                  className="w-5 h-5 bg-white/80 text-blue-600 border-gray-100 rounded"
                />
                <span className="text-gray-700 font-medium">Available only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-8">
          <p className="text-gray-700">
            Showing <span className="font-semibold text-gray-900">{filteredCards.length}</span> developers
          </p>
        </div>

        {/* Developer Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
            >
              {/* Card Header */}
              <div className="flex items-start space-x-4 mb-6">
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-16 h-16 rounded-xl object-cover ring-4 ring-white/50 group-hover:ring-blue-200 transition-all duration-300"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                    {card.name}
                  </h3>
                  <p className="text-blue-600 font-medium">{card.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{card.yearsOfExperience} years exp</span>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  card.openToWork 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {card.openToWork ? 'Available' : 'Busy'}
                </div>
              </div>

              {/* Description */}
              {card.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {card.description}
                </p>
              )}

              {/* Technologies */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-1">
                  {card.technologies.split(', ').slice(0, 4).map((tech, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg"
                    >
                      {tech}
                    </span>
                  ))}
                  {card.technologies.split(', ').length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                      +{card.technologies.split(', ').length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <a
                    href={`mailto:${card.contact}`}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Send Email"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                  <a
                    href={card.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    title="View Portfolio"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <Link
                  to={`/card/${card.id}`}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCards.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No developers found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or browse all developers.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTech('');
                setShowAvailableOnly(false);
              }}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;