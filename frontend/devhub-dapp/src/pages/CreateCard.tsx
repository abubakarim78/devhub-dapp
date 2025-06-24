import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { User, Briefcase, Mail, Code, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface DeveloperCard {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  yearsOfExperience: number;
  technologies: string;
  portfolio: string;
  contact: string;
  createdAt: string;
  walletAddress: string;
}

const CreateCard: React.FC = () => {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    imageUrl: '',
    yearsOfExperience: 0,
    technologies: '',
    portfolio: '',
    contact: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.imageUrl.trim()) newErrors.imageUrl = 'Profile image URL is required';
    if (formData.yearsOfExperience < 0) newErrors.yearsOfExperience = 'Experience must be positive';
    if (!formData.technologies.trim()) newErrors.technologies = 'Technologies are required';
    if (!formData.portfolio.trim()) newErrors.portfolio = 'Portfolio URL is required';
    if (!formData.contact.trim()) newErrors.contact = 'Contact information is required';

    // Validate URLs
    try {
      new URL(formData.imageUrl);
    } catch {
      newErrors.imageUrl = 'Please enter a valid image URL';
    }

    try {
      new URL(formData.portfolio);
    } catch {
      newErrors.portfolio = 'Please enter a valid portfolio URL';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contact)) {
      newErrors.contact = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addCardToDashboard = (newCard: DeveloperCard) => {
    // Get existing cards from localStorage (or initialize empty array)
    const existingCards = JSON.parse(localStorage.getItem('developerCards') || '[]');
    
    // Add new card to the beginning of the array
    const updatedCards = [newCard, ...existingCards];
    
    // Save back to localStorage
    localStorage.setItem('developerCards', JSON.stringify(updatedCards));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (!validateForm()) return;

    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create new card object
      const newCard: DeveloperCard = {
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name,
        title: formData.title,
        imageUrl: formData.imageUrl,
        yearsOfExperience: formData.yearsOfExperience,
        technologies: formData.technologies,
        portfolio: formData.portfolio,
        contact: formData.contact,
        createdAt: new Date().toISOString(),
        walletAddress: currentAccount?.address || ''
      };
      
      // Add card to dashboard storage
      addCardToDashboard(newCard);
      
      console.log('Card created successfully:', newCard);
      
      setIsSubmitting(false);
      setShowPaymentModal(false);
      
      // Show success message
      setShowSuccessMessage(true);
      
      // Auto-hide success message and redirect after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
        navigate('/dashboard');
      }, 3000);
      
    } catch (error) {
      console.error('Error creating card:', error);
      setIsSubmitting(false);
      alert('There was an error creating your card. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'yearsOfExperience' ? parseInt(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!currentAccount) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">You need to connect your Sui wallet to create a developer card.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Create Your Dev Card
          </h1>
          <p className="text-xl text-gray-600">
            Showcase your skills and connect with opportunities worldwide.
          </p>
        </div>

        {/* Platform Fee Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-start space-x-3">
          <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Platform Fee</h3>
            <p className="text-blue-700 text-sm">
              Creating a developer card requires a one-time platform fee of <strong>0.1 SUI</strong> 
              to cover blockchain transaction costs and platform maintenance.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Personal Information</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border text-gray-700 rounded-xl focus:ring-2 transition-all duration-200 ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white/80'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border text-gray-700 rounded-xl focus:ring-2 transition-all duration-200 ${
                      errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white/80'
                    }`}
                    placeholder="e.g., Senior Frontend Developer"
                  />
                  {errors.title && (
                    <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.title}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Image URL *
              </label>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border text-gray-700 rounded-xl focus:ring-2 transition-all duration-200 ${
                      errors.imageUrl ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white/80'
                    }`}
                    placeholder="https://example.com/your-photo.jpg"
                  />
                  {errors.imageUrl && (
                    <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.imageUrl}</span>
                    </p>
                  )}
                </div>
                {formData.imageUrl && (
                  <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Professional Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <span>Professional Details</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleInputChange}
                    min="0"
                    max="50"
                    className={`w-full px-4 py-3 border text-gray-700 rounded-xl focus:ring-2 transition-all duration-200 ${
                      errors.yearsOfExperience ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white/80'
                    }`}
                    placeholder="0"
                  />
                  {errors.yearsOfExperience && (
                    <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.yearsOfExperience}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Technologies & Skills *
                  </label>
                  <input
                    type="text"
                    name="technologies"
                    value={formData.technologies}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border text-gray-700 rounded-xl focus:ring-2 transition-all duration-200 ${
                      errors.technologies ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white/80'
                    }`}
                    placeholder="React, Node.js, Python, TypeScript"
                  />
                  {errors.technologies && (
                    <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.technologies}</span>
                    </p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">Separate technologies with commas</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <span>Contact Information</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portfolio URL *
                  </label>
                  <input
                    type="url"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 text-gray-700 border rounded-xl focus:ring-2 transition-all duration-200 ${
                      errors.portfolio ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white/80'
                    }`}
                    placeholder="https://yourportfolio.com"
                  />
                  {errors.portfolio && (
                    <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.portfolio}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 text-gray-700 border rounded-xl focus:ring-2 transition-all duration-200 ${
                      errors.contact ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white/80'
                    }`}
                    placeholder="your.email@example.com"
                  />
                  {errors.contact && (
                    <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.contact}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <Code className="h-5 w-5" />
                <span>Create Dev Card</span>
              </button>
            </div>
          </div>
        </form>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Payment</h3>
                <p className="text-gray-600 mb-6">
                  You're about to create your developer card with a platform fee of <strong>0.1 SUI</strong>.
                </p>
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">Transaction Details:</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Platform Fee:</span>
                      <span className="font-medium">0.1 SUI</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gas Fee (est.):</span>
                      <span className="font-medium">0.001 SUI</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>0.101 SUI</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 font-medium rounded-xl hover:bg-gray-300 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm & Pay'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message Modal */}
        {showSuccessMessage && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Card Created Successfully!</h3>
                <p className="text-gray-600 mb-6">
                  Your developer card has been created and added to your dashboard. You'll be redirected shortly.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-medium">Transaction completed successfully</span>
                  </div>
                  <p className="text-green-700 text-sm mt-2">
                    Your card is now live and visible to potential employers and collaborators.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSuccessMessage(false);
                    navigate('/dashboard');
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateCard;