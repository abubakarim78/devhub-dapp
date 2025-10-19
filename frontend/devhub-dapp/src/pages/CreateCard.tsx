import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import {
  User, Briefcase, Mail, Code, DollarSign, AlertCircle, Loader2, CheckCircle,
  X, CloudUpload, ArrowRight, ArrowLeft
} from 'lucide-react';
import { createCardTransaction, PLATFORM_FEE } from '../lib/suiClient';
import { useContract } from '../hooks/useContract';
import StarBackground from '@/components/common/StarBackground';

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
    const { uploadToWalrus, uploadUrlToWalrus, walrusUploading, walrusProgress } = useContract();
  
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [currentStep, setCurrentStep] = useState(0);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        title: '',
        imageUrl: '',
        yearsOfExperience: 0,
        technologies: '',
        portfolio: '',
        contact: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [imageUploadMethod, setImageUploadMethod] = useState<'url' | 'file'>('url');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [walrusImageBlobId, setWalrusImageBlobId] = useState<string | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const closeToast = () => setToast(null);

    const validateStep = () => {
        const newErrors: Record<string, string> = {};
        if (currentStep === 0) {
            if (!formData.name.trim()) newErrors.name = 'Full Name is required.';
            if (!formData.title.trim()) newErrors.title = 'Professional Title is required.';
            if (!formData.description.trim()) newErrors.description = 'A professional description is required.';
            if (formData.description.length > 500) newErrors.description = 'Description cannot exceed 500 characters.';
            if (!formData.imageUrl.trim() && !imageFile && !walrusImageBlobId) {
                newErrors.imageUrl = 'A profile image is required.';
            }
        } else if (currentStep === 1) {
            if (formData.yearsOfExperience < 0) newErrors.yearsOfExperience = 'Years of experience must be a positive number.';
            if (!formData.technologies.trim()) newErrors.technologies = 'Please list your technologies/skills.';
        } else if (currentStep === 2) {
            try { new URL(formData.portfolio) } catch { newErrors.portfolio = 'A valid portfolio URL is required.' }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.contact)) newErrors.contact = 'A valid contact email is required.';
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
            const response = await fetch(`https://fullnode.testnet.sui.io:443`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            const ESTIMATED_GAS = 1000000;
            const TOTAL_NEEDED = PLATFORM_FEE + ESTIMATED_GAS;
            let totalBalance = 0;
            const selectedCoins = [];
            for (const coin of coins.result.data) {
                const balance = parseInt(coin.balance);
                selectedCoins.push(coin.coinObjectId);
                totalBalance += balance;
                if (totalBalance >= TOTAL_NEEDED) break;
            }
            if (totalBalance < TOTAL_NEEDED) {
                throw new Error(`Insufficient SUI balance. Need at least ${(TOTAL_NEEDED / 1000000000).toFixed(3)} SUI.`);
            }

            const cardDataWithWalrus = {
                ...formData,
                imageUrl: walrusImageBlobId ? imagePreviewUrl : formData.imageUrl,
                walrusImageBlobId,
            };
            const tx = createCardTransaction(cardDataWithWalrus, selectedCoins[0]);
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
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'yearsOfExperience' ? parseInt(value) || 0 : value,
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (name === 'imageUrl' && imageUploadMethod === 'url') {
            setImagePreviewUrl(value);
            setWalrusImageBlobId(null);
            setImageFile(null);
        }
    };

    const steps = [
        "Personal Info",
        "Professional Details",
        "Contact"
    ];

    if (!currentAccount) {
      return (
          <div className="bg-background min-h-screen flex items-center justify-center relative">
              <StarBackground />
              <div className="text-center relative z-10 p-8 bg-card/50 backdrop-blur-md rounded-2xl border border-border">
                  <div className="w-20 h-20 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <User className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
                  <p className="text-muted-foreground">Please connect your Sui wallet to proceed.</p>
              </div>
          </div>
      );
    }

    return (
        <div className="bg-background min-h-screen pt-32 pb-20 relative text-foreground">
            <StarBackground />
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
            </AnimatePresence>

            <div className="relative z-10 max-w-2xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Create Your Developer Card
                    </h1>
                    <p className="text-lg text-muted-foreground">Showcase your skills and connect with the ecosystem.</p>
                </motion.div>

                {/* Progress Bar */}
                <div className="mb-8 px-4">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <React.Fragment key={index}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep >= index ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                        {currentStep > index ? <CheckCircle size={20}/> : index + 1}
                                    </div>
                                    <p className={`mt-2 text-xs font-medium ${currentStep >= index ? 'text-foreground' : 'text-muted-foreground'}`}>{step}</p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-1 mx-2 rounded ${currentStep > index ? 'bg-primary' : 'bg-muted'}`}/>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-card/70 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-2xl">
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
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <InputField label="Full Name" name="name" value={formData.name} onChange={handleInputChange} error={errors.name} placeholder="e.g., Jane Doe" />
                                        <InputField label="Professional Title" name="title" value={formData.title} onChange={handleInputChange} error={errors.title} placeholder="e.g., Senior Frontend Developer" />
                                    </div>
                                    <InputField label="Professional Description" name="description" value={formData.description} onChange={handleInputChange} error={errors.description} placeholder="A brief professional bio..." isTextArea maxLength={500} />
                                    
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
                                    <InputField label="Technologies & Skills" name="technologies" value={formData.technologies} onChange={handleInputChange} error={errors.technologies} placeholder="e.g., React, Node.js, Sui" />
                                    <p className="text-muted-foreground text-xs -mt-4">Separate technologies with commas.</p>
                                </FormStep>
                            )}

                            {currentStep === 2 && (
                                <FormStep title="Contact Information" icon={<Mail size={20} className="text-primary" />}>
                                    <InputField label="Portfolio URL" name="portfolio" type="url" value={formData.portfolio} onChange={handleInputChange} error={errors.portfolio} placeholder="https://your-portfolio.com" />
                                    <InputField label="Contact Email" name="contact" type="email" value={formData.contact} onChange={handleInputChange} error={errors.contact} placeholder="your.email@example.com" />
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