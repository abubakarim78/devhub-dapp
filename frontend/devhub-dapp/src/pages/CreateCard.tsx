import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import {
  User, Briefcase, Mail, Code, DollarSign, AlertCircle, Loader2, CheckCircle,
  X, CloudUpload, ArrowRight, ArrowLeft, Plus, Trash2
} from 'lucide-react';
import { createCardTransaction, PLATFORM_FEE } from '../lib/suiClient';
import { useContract } from '../hooks/useContract';
import Layout from '@/components/common/Layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FeaturedProject {
  title: string;
  shortDescription: string;
  sourceLink: string;
  thumbnail?: string;
}

// --- Re-designed Components (Toast, FormStep, InputField) ---
// (These components remain the same as the previous response)

const Toast: React.FC<{
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}> = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    className="fixed top-5 right-5 z-[100]"
  >
    <div
      className={`flex items-center gap-3 pl-4 pr-2 py-3 rounded-lg shadow-2xl border ${
        type === 'success'
          ? 'bg-green-500/10 border-green-500/30 text-green-300'
          : 'bg-red-500/10 border-red-500/30 text-red-300'
      }`}
    >
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="p-1 rounded-full hover:bg-accent/20 transition-colors">
        <X size={16} />
      </button>
            dark: '#0066CC',
    </div>
  </motion.div>
);

const FormStep: React.FC<{ children: React.ReactNode; title: string; icon: React.ReactNode }> = ({ children, title, icon }) => (
    <div>
        <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">{icon}</div>
            {title}
        </h3>
        <div className="space-y-6">{children}</div>
    </div>
);

const InputField: React.FC<{
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  isTextArea?: boolean;
}> = ({ label, name, value, onChange, error, placeholder, type = 'text', maxLength, isTextArea = false }) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
    {isTextArea ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        maxLength={maxLength}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 resize-none bg-input text-foreground placeholder-muted-foreground ${
          error ? 'border-destructive focus:ring-destructive/50' : 'border-border focus:ring-ring'
        }`}
        placeholder={placeholder}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-input text-foreground placeholder-muted-foreground ${
          error ? 'border-destructive focus:ring-destructive/50' : 'border-border focus:ring-ring'
        }`}
        placeholder={placeholder}
      />
    )}
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-destructive text-xs mt-1.5 flex items-center gap-1.5"
        >
          <AlertCircle size={14} />
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);


const CreateCard: React.FC = () => {
    const navigate = useNavigate();
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const suiClient = useSuiClient();
    const { uploadToWalrus, uploadUrlToWalrus, walrusUploading, walrusProgress } = useContract();
  
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [currentStep, setCurrentStep] = useState(0);

    const [formData, setFormData] = useState({
        name: '',
        niche: 'Developer',
        customNiche: '',
        about: '',
        imageUrl: '',
        yearsOfExperience: 0,
        technologies: [] as string[],
        portfolio: '',
        contact: '',
        featuredProjects: [] as FeaturedProject[],
        languages: [] as string[],
        github: '',
        linkedin: '',
        twitter: '',
        personalWebsite: '',
        workTypes: 'Full-time',
        hourlyRate: 0,
        locationPreference: 'Remote',
        availability: 'Immediately',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Input states for adding new items
    const [newTechnology, setNewTechnology] = useState('');
    const [newLanguage, setNewLanguage] = useState('');
    const [newFeaturedProject, setNewFeaturedProject] = useState<FeaturedProject>({
        title: '',
        shortDescription: '',
        sourceLink: '',
        thumbnail: '',
    });

    const [imageUploadMethod, setImageUploadMethod] = useState<'url' | 'file'>('url');
    const [thumbnailUploadMethod, setThumbnailUploadMethod] = useState<'url' | 'file'>('url');

    // Available niches from the contract
    const availableNiches = [
        'Developer',
        'UI/UX Designer', 
        'Content Creator',
        'DevOps',
        'Project Manager',
        'Community Manager',
        'Development Director',
        'Product Manager',
        'Marketing Specialist',
        'Business Analyst',
        'Custom'
    ];
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [walrusImageBlobId, setWalrusImageBlobId] = useState<string | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string>('');
    const [thumbnailUploading, setThumbnailUploading] = useState(false);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const closeToast = () => setToast(null);

    const validateStep = () => {
        const newErrors: Record<string, string> = {};
        if (currentStep === 0) { // Personal Info
            if (!formData.name.trim()) newErrors.name = 'Full Name is required.';
            if (!formData.niche.trim()) newErrors.niche = 'Please select a professional niche.';
            if (formData.niche === 'Custom' && !formData.customNiche.trim()) {
                newErrors.customNiche = 'Please specify your custom niche.';
            }
            if (!formData.about.trim()) newErrors.about = 'An "about" section is required.';
            if (!formData.imageUrl.trim() && !imageFile && !walrusImageBlobId) {
                newErrors.imageUrl = 'A profile image is required.';
            }
        } else if (currentStep === 1) { // Professional Details
            if (formData.yearsOfExperience < 0) newErrors.yearsOfExperience = 'Years of experience must be a positive number.';
            if (formData.technologies.length === 0) newErrors.technologies = 'Please add at least one technology/skill.';
            if (formData.languages.length === 0) newErrors.languages = 'Please add at least one language.';
        } else if (currentStep === 2) { // Work Preferences
            if (!formData.workTypes) newErrors.workTypes = 'Please select a work type.';
            if (formData.hourlyRate < 0) newErrors.hourlyRate = 'Hourly rate cannot be negative.';
            if (!formData.locationPreference) newErrors.locationPreference = 'Please select a location preference.';
            if (!formData.availability) newErrors.availability = 'Please select your availability.';
        } else if (currentStep === 3) { // Contact & Social
            if (formData.portfolio && !formData.portfolio.startsWith('https://')) newErrors.portfolio = 'Portfolio URL must be valid and start with https://';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.contact)) newErrors.contact = 'A valid contact email is required.';
            if (formData.github && !formData.github.startsWith('https://')) newErrors.github = 'GitHub URL must be valid and start with https://';
            if (formData.linkedin && !formData.linkedin.startsWith('https://')) newErrors.linkedin = 'LinkedIn URL must be valid and start with https://';
            if (formData.twitter && !formData.twitter.startsWith('https://')) newErrors.twitter = 'Twitter URL must be valid and start with https://';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep()) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image file', 'error');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image file must be less than 5MB', 'error');
                return;
            }
            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
            setFormData(prev => ({ ...prev, imageUrl: '' }));
            setWalrusImageBlobId(null);
        }
    };

    const handleUploadToWalrus = async () => {
        if (!currentAccount) {
            showToast('Please connect your wallet first', 'error');
            return;
        }

        try {
            let result;
            if (imageUploadMethod === 'file' && imageFile) {
                result = await uploadToWalrus(imageFile);
            } else if (imageUploadMethod === 'url' && formData.imageUrl.trim()) {
                result = await uploadUrlToWalrus(formData.imageUrl);
            } else {
                showToast('Please provide an image file or URL first', 'error');
                return;
            }
            setWalrusImageBlobId(result.blob.blobId);
            setImagePreviewUrl(result.blob.walrusUrl);
            setImageFile(null);
            setFormData(prev => ({ ...prev, imageUrl: '' }));
            showToast('Image uploaded to Walrus successfully!', 'success');
        } catch (error) {
            console.error('Walrus upload error:', error);
            showToast('Failed to upload to Walrus. Please try again.', 'error');
        }
    };

    const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image file', 'error');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image file must be less than 5MB', 'error');
                return;
            }
            setThumbnailFile(file);
            setThumbnailPreviewUrl(URL.createObjectURL(file));
            updateFeaturedProjectField('thumbnail', '');
        }
    };

    const handleThumbnailUploadToWalrus = async () => {
        if (!currentAccount) {
            showToast('Please connect your wallet first', 'error');
            return;
        }

        if (!thumbnailFile && !(newFeaturedProject.thumbnail?.trim() || '')) {
            showToast('Please provide a thumbnail file or URL first', 'error');
            return;
        }

        setThumbnailUploading(true);
        try {
            let result;
            if (thumbnailUploadMethod === 'file' && thumbnailFile) {
                result = await uploadToWalrus(thumbnailFile);
            } else if (thumbnailUploadMethod === 'url' && newFeaturedProject.thumbnail?.trim()) {
                result = await uploadUrlToWalrus(newFeaturedProject.thumbnail);
            } else {
                showToast('Please provide a thumbnail file or URL first', 'error');
                setThumbnailUploading(false);
                return;
            }
            updateFeaturedProjectField('thumbnail', result.blob.walrusUrl);
            setThumbnailPreviewUrl(result.blob.walrusUrl);
            setThumbnailFile(null);
            showToast('Thumbnail uploaded to Walrus successfully!', 'success');
        } catch (error) {
            console.error('Thumbnail upload error:', error);
            showToast('Failed to upload thumbnail to Walrus. Please try again.', 'error');
        } finally {
            setThumbnailUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentAccount) {
            showToast('Please connect your wallet first', 'error');
            return;
        }
        if (!validateStep()) return;
        setShowPaymentModal(true);
    };

    const handlePayment = async () => {
        if (!currentAccount) return;
        setIsSubmitting(true);

        try {
            // Use SuiClient to get coins from the correct network (devnet)
            const coins = await suiClient.getCoins({
                owner: currentAccount.address,
                coinType: '0x2::sui::SUI',
                limit: 50,
            });
            
            if (!coins.data || coins.data.length === 0) {
                throw new Error('No SUI coins found in wallet');
            }
            
            const ESTIMATED_GAS = 1000000;
            const TOTAL_NEEDED = PLATFORM_FEE + ESTIMATED_GAS;
            let totalBalance = BigInt(0);
            
            // Check if user has enough balance
            for (const coin of coins.data) {
                const balance = BigInt(coin.balance);
                totalBalance += balance;
                if (totalBalance >= BigInt(TOTAL_NEEDED)) break;
            }
            
            if (totalBalance < BigInt(TOTAL_NEEDED)) {
                throw new Error(`Insufficient SUI balance. Need at least ${(TOTAL_NEEDED / 1000000000).toFixed(3)} SUI.`);
            }

            const cardDataForTransaction = {
                name: formData.name,
                niche: formData.niche,
                customNiche: formData.niche === 'Custom' ? formData.customNiche : undefined,
                imageUrl: walrusImageBlobId ? imagePreviewUrl : formData.imageUrl,
                yearsOfExperience: formData.yearsOfExperience,
                technologies: formData.technologies.join(', '),
                portfolio: formData.portfolio,
                about: formData.about,
                featuredProjects: formData.featuredProjects.map(fp => 
                    JSON.stringify({
                        title: fp.title,
                        description: fp.shortDescription,
                        source: fp.sourceLink,
                        thumbnail: fp.thumbnail || '',
                    })
                ),
                contact: formData.contact,
                github: formData.github,
                linkedin: formData.linkedin,
                twitter: formData.twitter,
                personalWebsite: formData.personalWebsite,
                workTypes: [formData.workTypes],
                hourlyRate: formData.hourlyRate > 0 ? formData.hourlyRate : null,
                locationPreference: formData.locationPreference,
                availability: formData.availability,
                languages: formData.languages,
                avatarWalrusBlobId: walrusImageBlobId,
            };
            
            // Fetch coins again right before creating transaction to ensure they're fresh
            const freshCoins = await suiClient.getCoins({
                owner: currentAccount.address,
                coinType: '0x2::sui::SUI',
                limit: 50,
            });
            
            if (!freshCoins.data || freshCoins.data.length === 0) {
                throw new Error('No SUI coins found in wallet');
            }
            
            // Use the first coin that has enough balance
            let paymentCoinId = null;
            for (const coin of freshCoins.data) {
                const balance = BigInt(coin.balance);
                if (balance >= BigInt(PLATFORM_FEE)) {
                    paymentCoinId = coin.coinObjectId;
                    break;
                }
            }
            
            if (!paymentCoinId) {
                throw new Error('No coin with sufficient balance found');
            }
            
            const tx = createCardTransaction(cardDataForTransaction, paymentCoinId);
            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result) => {
                        console.log('Card created successfully:', result);
                        setShowPaymentModal(false);
                        showToast('Developer card created successfully! 🎉', 'success');
                        setTimeout(() => navigate('/dashboard'), 2000);
                    },
                    onError: (error) => {
                        console.error('Error creating card:', error);
                        showToast('Failed to create card. Please try again.', 'error');
                    },
                    onSettled: () => setIsSubmitting(false),
                }
            );
        } catch (error) {
            console.error('Error in payment process:', error);
            showToast(error instanceof Error ? error.message : 'An unknown error occurred', 'error');
            setIsSubmitting(false);
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'yearsOfExperience' || name === 'hourlyRate') ? parseInt(value) || 0 : value,
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (name === 'imageUrl' && imageUploadMethod === 'url') {
            setImagePreviewUrl(value);
            setWalrusImageBlobId(null);
            setImageFile(null);
        }
        if (name === 'thumbnail' && thumbnailUploadMethod === 'url') {
            setThumbnailPreviewUrl(value);
            setThumbnailFile(null);
        }
        // Clear custom niche when switching away from Custom
        if (name === 'niche' && value !== 'Custom') {
            setFormData(prev => ({ ...prev, customNiche: '' }));
        }
    };

    // Technology/Skills handlers
    const addTechnology = () => {
        if (newTechnology.trim() && !formData.technologies.includes(newTechnology.trim())) {
            setFormData(prev => ({
                ...prev,
                technologies: [...prev.technologies, newTechnology.trim()],
            }));
            setNewTechnology('');
            if (errors.technologies) {
                setErrors(prev => ({ ...prev, technologies: '' }));
            }
        }
    };

    const removeTechnology = (index: number) => {
        setFormData(prev => ({
            ...prev,
            technologies: prev.technologies.filter((_, i) => i !== index),
        }));
    };

    // Language handlers
    const addLanguage = () => {
        if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
            setFormData(prev => ({
                ...prev,
                languages: [...prev.languages, newLanguage.trim()],
            }));
            setNewLanguage('');
            if (errors.languages) {
                setErrors(prev => ({ ...prev, languages: '' }));
            }
        }
    };

    const removeLanguage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            languages: prev.languages.filter((_, i) => i !== index),
        }));
    };

    // Featured Project handlers
    const addFeaturedProject = () => {
        if (newFeaturedProject.title.trim() && newFeaturedProject.shortDescription.trim() && newFeaturedProject.sourceLink.trim()) {
            setFormData(prev => ({
                ...prev,
                featuredProjects: [...prev.featuredProjects, { ...newFeaturedProject }],
            }));
            setNewFeaturedProject({
                title: '',
                shortDescription: '',
                sourceLink: '',
                thumbnail: '',
            });
            setThumbnailFile(null);
            setThumbnailPreviewUrl('');
            if (errors.featuredProjects) {
                setErrors(prev => ({ ...prev, featuredProjects: '' }));
            }
        }
    };

    const removeFeaturedProject = (index: number) => {
        setFormData(prev => ({
            ...prev,
            featuredProjects: prev.featuredProjects.filter((_, i) => i !== index),
        }));
    };

    const updateFeaturedProjectField = (field: keyof FeaturedProject, value: string) => {
        setNewFeaturedProject(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const steps = [
        "Personal Info",
        "Professional Details",
        "Work Preferences",
        "Contact & Socials"
    ];

    if (!currentAccount) {
      return (
          <Layout>
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center p-8 bg-card/50 backdrop-blur-md rounded-2xl border border-border">
                  <div className="w-20 h-20 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <User className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
                  <p className="text-muted-foreground">Please connect your Sui wallet to proceed.</p>
              </div>
            </div>
          </Layout>
      );
    }

    return (
        <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
            </AnimatePresence>

            <div className="max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6 sm:mb-8 md:mb-10"
                >
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent px-2">
                        Create Your Developer Card
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-4">Showcase your skills and connect with the ecosystem.</p>
                </motion.div>

                {/* Progress Bar */}
                <div className="mb-6 sm:mb-8 px-2 sm:px-4">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <React.Fragment key={index}>
                                <div className="flex flex-col items-center min-w-0 flex-1">
                                    <div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all duration-300 text-xs sm:text-sm md:text-base ${currentStep >= index ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                        {currentStep > index ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5"/> : index + 1}
                                    </div>
                                    <p className={`mt-1 sm:mt-2 text-[10px] sm:text-xs font-medium text-center ${currentStep >= index ? 'text-foreground' : 'text-muted-foreground'}`}>{step}</p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2 rounded ${currentStep > index ? 'bg-primary' : 'bg-muted'}`}/>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-card/70 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-border shadow-2xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            {currentStep === 0 && (
                                <FormStep title="Personal Information" icon={<User size={20} className="text-blue-400" />}>
                                    <InputField label="Full Name" name="name" value={formData.name} onChange={handleInputChange} error={errors.name} placeholder="e.g., Jane Doe" />
                                    
                                    {/* Niche Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Professional Niche</label>
                                        <Select 
                                            value={formData.niche} 
                                            onValueChange={(value) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    niche: value,
                                                    ...(value !== 'Custom' ? { customNiche: '' } : {})
                                                }));
                                                if (errors.niche) {
                                                    setErrors(prev => ({ ...prev, niche: '' }));
                                                }
                                            }}
                                        >
                                            <SelectTrigger 
                                                className={`w-full h-12 px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-input text-foreground ${
                                                errors.niche ? 'border-destructive focus:ring-destructive/50' : 'border-border focus:ring-ring'
                                            }`}
                                        >
                                                <SelectValue placeholder="Select a professional niche" />
                                            </SelectTrigger>
                                            <SelectContent>
                                            {availableNiches.map((niche) => (
                                                    <SelectItem key={niche} value={niche}>
                                                        {niche}
                                                    </SelectItem>
                                            ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.niche && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-destructive text-xs mt-1.5 flex items-center gap-1.5"
                                            >
                                                <AlertCircle size={14} />
                                                {errors.niche}
                                            </motion.p>
                                        )}
                                    </div>

                                    {/* Custom Niche Input */}
                                    {formData.niche === 'Custom' && (
                                        <InputField 
                                            label="Custom Niche" 
                                            name="customNiche" 
                                            value={formData.customNiche} 
                                            onChange={handleInputChange} 
                                            error={errors.customNiche} 
                                            placeholder="e.g., Blockchain Developer, AI Engineer" 
                                        />
                                    )}

                                    <InputField label="About You" name="about" value={formData.about} onChange={handleInputChange} error={errors.about} placeholder="Tell us a bit about yourself..." isTextArea />
                                    
                                    {/* --- [START] RE-INTEGRATED IMAGE UPLOAD SECTION --- */}
                                    <div>
                                      <label className="block text-sm font-medium text-foreground mb-2">Profile Image</label>
                                      <div className="flex space-x-2 mb-4 p-1 bg-secondary rounded-lg">
                                        <button type="button" onClick={() => setImageUploadMethod('url')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${imageUploadMethod === 'url' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-secondary-foreground'}`}>Image URL</button>
                                        <button type="button" onClick={() => setImageUploadMethod('file')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${imageUploadMethod === 'file' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-secondary-foreground'}`}>Upload File</button>
                                      </div>
                                      
                                      <div className="space-y-4">
                                        {imageUploadMethod === 'url' ? (
                                          <InputField label="" name="imageUrl" type="url" value={formData.imageUrl} onChange={handleInputChange} error={errors.imageUrl} placeholder="https://..." />
                                        ) : (
                                          <input type="file" accept="image/*" onChange={handleImageFileChange} className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"/>
                                        )}
                                        
                                        {(imagePreviewUrl || formData.imageUrl) && (
                                          <div className="flex items-center gap-4">
                                            <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden border border-border">
                                                <img src={imagePreviewUrl || formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                            {!walrusImageBlobId && (formData.imageUrl || imageFile) && (
                                                <button type="button" onClick={handleUploadToWalrus} disabled={walrusUploading} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">
                                                    {walrusUploading ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}
                                                    {walrusUploading ? 'Uploading...' : 'Upload to Walrus'}
                                                </button>
                                            )}
                                          </div>
                                        )}

                                        {walrusUploading && walrusProgress && (
                                            <p className="text-yellow-400 text-sm">{walrusProgress}</p>
                                        )}

                                        {walrusImageBlobId && (
                                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-3 text-sm">
                                                <CheckCircle className="h-5 w-5 text-green-400" />
                                                <p className="text-green-300">Image successfully uploaded to Walrus.</p>
                                            </div>
                                        )}
                                      </div>
                                    </div>
                                    {/* --- [END] RE-INTEGRATED IMAGE UPLOAD SECTION --- */}

                                </FormStep>
                            )}

                            {currentStep === 1 && (
                                <FormStep title="Professional Details" icon={<Briefcase size={20} className="text-primary" />}>
                                    <InputField label="Years of Experience" name="yearsOfExperience" type="number" value={formData.yearsOfExperience} onChange={handleInputChange} error={errors.yearsOfExperience} placeholder="e.g., 5" />
                                    
                                    {/* Technologies & Skills */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Technologies & Skills</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={newTechnology}
                                                onChange={(e) => setNewTechnology(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                                                placeholder="e.g., React, Node.js, Sui"
                                                className="flex-1 px-4 py-2 border rounded-lg bg-input text-foreground placeholder-muted-foreground border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                                            />
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={addTechnology}
                                                disabled={!newTechnology.trim()}
                                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                <Plus size={18} />
                                                Add
                                            </motion.button>
                                        </div>
                                        {errors.technologies && (
                                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                                                <AlertCircle size={14} />
                                                {errors.technologies}
                                            </motion.p>
                                        )}
                                        {formData.technologies.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {formData.technologies.map((tech, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm"
                                                    >
                                                        <span>{tech}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTechnology(index)}
                                                            className="hover:text-destructive transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Languages */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Languages</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={newLanguage}
                                                onChange={(e) => setNewLanguage(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                                                placeholder="e.g., English, Spanish, French"
                                                className="flex-1 px-4 py-2 border rounded-lg bg-input text-foreground placeholder-muted-foreground border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                                            />
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={addLanguage}
                                                disabled={!newLanguage.trim()}
                                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                <Plus size={18} />
                                                Add
                                            </motion.button>
                                        </div>
                                        {errors.languages && (
                                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                                                <AlertCircle size={14} />
                                                {errors.languages}
                                            </motion.p>
                                        )}
                                        {formData.languages.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {formData.languages.map((lang, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm"
                                                    >
                                                        <span>{lang}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeLanguage(index)}
                                                            className="hover:text-destructive transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Featured Projects */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Featured Projects</label>
                                        <div className="space-y-4 mb-4 p-4 border border-border rounded-lg bg-card/50">
                                            <div className="grid grid-cols-1 gap-3">
                                                <input
                                                    type="text"
                                                    value={newFeaturedProject.title}
                                                    onChange={(e) => updateFeaturedProjectField('title', e.target.value)}
                                                    placeholder="Project Title"
                                                    className="px-4 py-2 border rounded-lg bg-input text-foreground placeholder-muted-foreground border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                                                />
                                                <textarea
                                                    value={newFeaturedProject.shortDescription}
                                                    onChange={(e) => updateFeaturedProjectField('shortDescription', e.target.value)}
                                                    placeholder="Short Description"
                                                    rows={2}
                                                    className="px-4 py-2 border rounded-lg bg-input text-foreground placeholder-muted-foreground border-border focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                                                />
                                                <input
                                                    type="url"
                                                    value={newFeaturedProject.sourceLink}
                                                    onChange={(e) => updateFeaturedProjectField('sourceLink', e.target.value)}
                                                    placeholder="Source/Link (GitHub, Website, etc.)"
                                                    className="px-4 py-2 border rounded-lg bg-input text-foreground placeholder-muted-foreground border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                                                />
                                                
                                                {/* Thumbnail Upload Section */}
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-2">Thumbnail (Optional)</label>
                                                    <div className="flex space-x-2 mb-3 p-1 bg-secondary rounded-lg">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setThumbnailUploadMethod('url')} 
                                                            className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${thumbnailUploadMethod === 'url' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-secondary-foreground'}`}
                                                        >
                                                            Image URL
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setThumbnailUploadMethod('file')} 
                                                            className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${thumbnailUploadMethod === 'file' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-secondary-foreground'}`}
                                                        >
                                                            Upload File
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="space-y-3">
                                                        {thumbnailUploadMethod === 'url' ? (
                                                            <input
                                                                type="url"
                                                                value={newFeaturedProject.thumbnail || ''}
                                                                onChange={(e) => updateFeaturedProjectField('thumbnail', e.target.value)}
                                                                placeholder="Thumbnail URL (Optional)"
                                                                className="w-full px-4 py-2 border rounded-lg bg-input text-foreground placeholder-muted-foreground border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                                                            />
                                                        ) : (
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleThumbnailFileChange}
                                                                className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                                            />
                                                        )}
                                                        
                                                        {(thumbnailPreviewUrl || newFeaturedProject.thumbnail) && (
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden border border-border">
                                                                    <img 
                                                                        src={thumbnailPreviewUrl || newFeaturedProject.thumbnail} 
                                                                        alt="Thumbnail preview" 
                                                                        className="w-full h-full object-cover" 
                                                                    />
                                                                </div>
                                                                {(thumbnailUploadMethod === 'file' && thumbnailFile && !(newFeaturedProject.thumbnail || '').includes('walrus')) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleThumbnailUploadToWalrus}
                                                                        disabled={thumbnailUploading}
                                                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
                                                                    >
                                                                        {thumbnailUploading ? (
                                                                            <>
                                                                                <Loader2 size={16} className="animate-spin" />
                                                                                Uploading...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <CloudUpload size={16} />
                                                                                Upload to Walrus
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}
                                                                {(thumbnailUploadMethod === 'url' && newFeaturedProject.thumbnail?.trim() && !newFeaturedProject.thumbnail.includes('walrus')) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleThumbnailUploadToWalrus}
                                                                        disabled={thumbnailUploading}
                                                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
                                                                    >
                                                                        {thumbnailUploading ? (
                                                                            <>
                                                                                <Loader2 size={16} className="animate-spin" />
                                                                                Uploading...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <CloudUpload size={16} />
                                                                                Upload to Walrus
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}
                                                                {((newFeaturedProject.thumbnail || '').includes('walrus') || (thumbnailPreviewUrl || '').includes('walrus')) && (
                                                                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 flex items-center gap-2 text-xs">
                                                                        <CheckCircle className="h-4 w-4 text-green-400" />
                                                                        <p className="text-green-300">Uploaded to Walrus</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={addFeaturedProject}
                                                disabled={!newFeaturedProject.title.trim() || !newFeaturedProject.shortDescription.trim() || !newFeaturedProject.sourceLink.trim()}
                                                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <Plus size={18} />
                                                Add Project
                                            </motion.button>
                                        </div>
                                        {errors.featuredProjects && (
                                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                                                <AlertCircle size={14} />
                                                {errors.featuredProjects}
                                            </motion.p>
                                        )}
                                        {formData.featuredProjects.length > 0 && (
                                            <div className="space-y-3 mt-4">
                                                {formData.featuredProjects.map((project, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="p-4 border border-border rounded-lg bg-card/50 relative"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFeaturedProject(index)}
                                                            className="absolute top-2 right-2 p-1.5 hover:bg-destructive/20 rounded-full transition-colors text-destructive"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        <div className="pr-8">
                                                            <h4 className="font-semibold text-foreground mb-1">{project.title}</h4>
                                                            <p className="text-sm text-muted-foreground mb-2">{project.shortDescription}</p>
                                                            <a href={project.sourceLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                                                <Code size={14} />
                                                                View Source
                                                            </a>
                                                            {project.thumbnail && (
                                                                <div className="mt-2">
                                                                    <img src={project.thumbnail} alt={project.title} className="w-full h-32 object-cover rounded-md" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </FormStep>
                            )}

                            {currentStep === 2 && (
                                <FormStep title="Work Preferences" icon={<DollarSign size={20} className="text-green-400" />}>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Work Types</label>
                                        <Select value={formData.workTypes} onValueChange={(value) => {
                                            setFormData(prev => ({ ...prev, workTypes: value }));
                                            if (errors.workTypes) {
                                                setErrors(prev => ({ ...prev, workTypes: '' }));
                                            }
                                        }}>
                                            <SelectTrigger className="w-full h-12 px-4 py-3 border rounded-lg bg-input text-foreground border-border focus:ring-2 focus:ring-ring">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Full-time">Full-time</SelectItem>
                                                <SelectItem value="Contract">Contract</SelectItem>
                                                <SelectItem value="Freelance">Freelance</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <InputField label="Hourly Rate (USD, optional)" name="hourlyRate" type="number" value={formData.hourlyRate} onChange={handleInputChange} error={errors.hourlyRate} placeholder="e.g., 75" />
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Location Preference</label>
                                        <Select value={formData.locationPreference} onValueChange={(value) => {
                                            setFormData(prev => ({ ...prev, locationPreference: value }));
                                            if (errors.locationPreference) {
                                                setErrors(prev => ({ ...prev, locationPreference: '' }));
                                            }
                                        }}>
                                            <SelectTrigger className="w-full h-12 px-4 py-3 border rounded-lg bg-input text-foreground border-border focus:ring-2 focus:ring-ring">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Remote">Remote</SelectItem>
                                                <SelectItem value="On-site">On-site</SelectItem>
                                                <SelectItem value="Hybrid">Hybrid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Availability</label>
                                        <Select value={formData.availability} onValueChange={(value) => {
                                            setFormData(prev => ({ ...prev, availability: value }));
                                            if (errors.availability) {
                                                setErrors(prev => ({ ...prev, availability: '' }));
                                            }
                                        }}>
                                            <SelectTrigger className="w-full h-12 px-4 py-3 border rounded-lg bg-input text-foreground border-border focus:ring-2 focus:ring-ring">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Immediately">Immediately</SelectItem>
                                                <SelectItem value="2 weeks">2 weeks</SelectItem>
                                                <SelectItem value="1 month">1 month</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </FormStep>
                            )}

                            {currentStep === 3 && (
                                <FormStep title="Contact & Socials" icon={<Mail size={20} className="text-primary" />}>
                                    <InputField label="Portfolio URL" name="portfolio" type="url" value={formData.portfolio} onChange={handleInputChange} error={errors.portfolio} placeholder="https://your-portfolio.com" />
                                    <InputField label="Contact Email" name="contact" type="email" value={formData.contact} onChange={handleInputChange} error={errors.contact} placeholder="your.email@example.com" />
                                    <InputField label="GitHub URL (optional)" name="github" type="url" value={formData.github} onChange={handleInputChange} error={errors.github} placeholder="https://github.com/..." />
                                    <InputField label="LinkedIn URL (optional)" name="linkedin" type="url" value={formData.linkedin} onChange={handleInputChange} error={errors.linkedin} placeholder="https://linkedin.com/in/..." />
                                    <InputField label="Twitter URL (optional)" name="twitter" type="url" value={formData.twitter} onChange={handleInputChange} error={errors.twitter} placeholder="https://twitter.com/..." />
                                    <InputField label="Personal Website (optional)" name="personalWebsite" type="url" value={formData.personalWebsite} onChange={handleInputChange} error={errors.personalWebsite} placeholder="https://your-site.com" />
                                </FormStep>
                            )}
                        </motion.div>
                    </AnimatePresence>
                    
                    {/* Navigation */}
                    <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
                        <div>
                            {currentStep > 0 && (
                                <button type="button" onClick={prevStep} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-accent transition-colors">
                                    <ArrowLeft size={16} />
                                    Back
                                </button>
                            )}
                        </div>
                        <div>
                            {currentStep < steps.length - 1 && (
                                <button type="button" onClick={nextStep} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                                    Next
                                    <ArrowRight size={16} />
                                </button>
                            )}
                            {currentStep === steps.length - 1 && (
                                <button type="submit" disabled={walrusUploading} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-primary/25 disabled:opacity-50">
                                    <Code size={18} />
                                    {walrusUploading ? 'Uploading...' : 'Create Card'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            <AnimatePresence>
                {showPaymentModal && (
                    <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-foreground shadow-2xl"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-primary/30">
                                    <DollarSign className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-2">Confirm Payment</h3>
                                <p className="text-muted-foreground mb-6">A one-time platform fee is required to create your developer card.</p>
                            </div>
                            
                            <div className="bg-secondary/60 rounded-xl p-4 mb-6 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee:</span> <span className="font-mono text-foreground">0.1 SUI</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Est. Gas Fee:</span> <span className="font-mono text-foreground">~0.001 SUI</span></div>
                                {walrusImageBlobId && <div className="flex justify-between"><span className="text-muted-foreground">Walrus Storage:</span> <span className="font-medium text-green-400">Free</span></div>}
                                <div className="pt-2 border-t border-border flex justify-between font-bold text-base"><span className="text-foreground">Total:</span> <span className="font-mono text-foreground">~0.101 SUI</span></div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 px-4 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-accent transition-colors" disabled={isSubmitting}>Cancel</button>
                                <button onClick={handlePayment} disabled={isSubmitting} className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isSubmitting ? (
                                        <><Loader2 size={16} className="animate-spin" /> <span>Processing...</span></>
                                    ) : (
                                        <span>Confirm & Pay</span>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CreateCard;
