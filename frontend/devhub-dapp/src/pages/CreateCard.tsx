import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { User, Briefcase, Mail, Code, DollarSign, AlertCircle, Loader2, CheckCircle, X, FileText } from 'lucide-react';
import { createCardTransaction, PLATFORM_FEE } from '../lib/suiClient';

// Toast Component
const Toast: React.FC<{
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className={`flex items-center space-x-3 px-6 py-4 rounded-xl shadow-lg ${
        type === 'success' 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        {type === 'success' ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600" />
        )}
        <span className={`font-medium ${
          type === 'success' ? 'text-green-800' : 'text-red-800'
        }`}>
          {message}
        </span>
        <button
          onClick={onClose}
          className={`ml-2 ${
            type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const CreateCard: React.FC = () => {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '', // Added description field
    title: '',
    imageUrl: '',
    yearsOfExperience: 0,
    technologies: '',
    portfolio: '',
    contact: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const closeToast = () => {
    setToast(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required'; // Added validation
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.imageUrl.trim()) newErrors.imageUrl = 'Profile image URL is required';
    if (formData.yearsOfExperience < 0) newErrors.yearsOfExperience = 'Experience must be positive';
    if (!formData.technologies.trim()) newErrors.technologies = 'Technologies are required';
    if (!formData.portfolio.trim()) newErrors.portfolio = 'Portfolio URL is required';
    if (!formData.contact.trim()) newErrors.contact = 'Contact information is required';

    // Validate description length
    if (formData.description.trim() && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
   
    if (!currentAccount) {
      showToast('Please connect your wallet first', 'error');
      return;
    }
    if (!validateForm()) return;
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!currentAccount) return;
    setIsSubmitting(true);
   
    try {
      // Get user's coins to pay for the transaction
      const response = await fetch(`https://fullnode.testnet.sui.io:443`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getCoins',
          params: [currentAccount.address, '0x2::sui::SUI'],
        }),
      });

      const coins = await response.json();
      
      if (!coins.result?.data?.length) {
        throw new Error('No SUI coins found in wallet');
      }

      // Calculate total needed (platform fee + estimated gas)
      const ESTIMATED_GAS = 1000000; // 0.001 SUI estimated gas
      const TOTAL_NEEDED = PLATFORM_FEE + ESTIMATED_GAS;

      // Find coins with sufficient balance
      let totalBalance = 0;
      const selectedCoins = [];
      
      for (const coin of coins.result.data) {
        const balance = parseInt(coin.balance);
        selectedCoins.push(coin.coinObjectId);
        totalBalance += balance;
        
        if (totalBalance >= TOTAL_NEEDED) {
          break;
        }
      }

      if (totalBalance < TOTAL_NEEDED) {
        throw new Error(`Insufficient SUI balance. Need at least ${(TOTAL_NEEDED / 1000000000).toFixed(3)} SUI (${(PLATFORM_FEE / 1000000000).toFixed(1)} SUI platform fee + ~${(ESTIMATED_GAS / 1000000000).toFixed(3)} SUI gas)`);
      }

      // Create transaction with selected coins
      const tx = createCardTransaction(formData, selectedCoins[0]);

      // Execute transaction
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Card created successfully:', result);
            setIsSubmitting(false);
            setShowPaymentModal(false);
            showToast('Developer card created successfully! 🎉', 'success');
            // Navigate to dashboard after a short delay to allow user to see the success message
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          },
          onError: (error) => {
            console.error('Error creating card:', error);
            setIsSubmitting(false);
            setShowPaymentModal(false);
            showToast('Failed to create card. Please try again.', 'error');
          },
        }
      );
    } catch (error) {
      console.error('Error in payment process:', error);
      setIsSubmitting(false);
      setShowPaymentModal(false);
      showToast(error instanceof Error ? error.message : 'Unknown error occurred', 'error');
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
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Create Your Developer Card
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
                    className={`w-full px-4 py-3 border text-gray-700 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
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
                    className={`w-full px-4 py-3 border text-gray-700 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
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

            {/* Description Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>About You</span>
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={500}
                  className={`w-full px-4 py-3 border text-gray-700 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 resize-none ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white/80'
                  }`}
                  placeholder="Write a brief description about yourself, your expertise, and what makes you unique as a developer. This will help others understand your background and skills."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description ? (
                    <p className="text-red-600 text-sm flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.description}</span>
                    </p>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Tell potential employers or collaborators about your experience and passion for development.
                    </p>
                  )}
                  <span className={`text-sm ${
                    formData.description.length > 450 ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {formData.description.length}/500
                  </span>
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
                    className={`w-full px-4 py-3 border text-gray-700 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
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
                    className={`w-full px-4 py-3 border text-gray-700 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
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
                    className={`w-full px-4 py-3 border text-gray-700 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
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
                    className={`w-full px-4 py-3 text-gray-700 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
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
                    className={`w-full px-4 py-3 text-gray-700 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
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
                className="min-w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <Code className="h-5 w-5" />
                <span>Create Card</span>
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
                      <span className="font-medium">~0.001 SUI</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>~0.101 SUI</span>
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
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>Confirm & Pay</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateCard;