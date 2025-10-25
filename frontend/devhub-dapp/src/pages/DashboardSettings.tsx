import React, { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Key, 
  Trash2, 
  Save, 
  Eye, 
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Info,
  Loader2
} from 'lucide-react';
import StarBackground from '@/components/common/StarBackground';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useTheme } from '@/contexts/ThemeContext';
import { useContract } from '@/hooks/useContract';
import { 
  updateConnectionPreferencesTransaction,
  updateConnectionStatusTransaction,
  getWorkPreferences
} from '@/lib/suiClient';

interface UserSettings {
  profile: {
    displayName: string;
    bio: string;
    location: string;
    website: string;
    github: string;
    twitter: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    projectUpdates: boolean;
    messageAlerts: boolean;
    weeklyDigest: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'connections';
    showEmail: boolean;
    showLocation: boolean;
    allowMessages: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    currency: string;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    loginAlerts: boolean;
  };
}

const DashboardSettings: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { theme, setTheme } = useTheme();
  const { useConnections, getUserCards } = useContract();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userCards, setUserCards] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);

  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      displayName: '',
      bio: '',
      location: '',
      website: '',
      github: '',
      twitter: ''
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      projectUpdates: true,
      messageAlerts: true,
      weeklyDigest: false
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showLocation: true,
      allowMessages: true
    },
    preferences: {
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      currency: 'USD'
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      loginAlerts: true
    }
  });

  useEffect(() => {
    if (currentAccount?.address) {
      loadUserData();
    }
  }, [currentAccount?.address]);

  const loadUserData = useCallback(async () => {
    if (!currentAccount?.address) return;
    
    setLoading(true);
    try {
      // Load user cards to get profile information
      const cards = await getUserCards(currentAccount.address);
      setUserCards(cards);
      
      // Load user's first card for profile data
      if (cards.length > 0) {
        const firstCard = cards[0];
        setSettings(prev => ({
          ...prev,
          profile: {
            displayName: firstCard.name || '',
            bio: firstCard.bio || '',
            location: firstCard.location || '',
            website: firstCard.website || '',
            github: firstCard.github || '',
            twitter: firstCard.twitter || ''
          }
        }));
      }
      
      // TODO: Load connection preferences from the contract
      // This would involve querying the connection store
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentAccount?.address, getUserCards]);

  const handleSaveSettings = useCallback(async () => {
    if (!currentAccount?.address) return;
    
    setSaving(true);
    try {
      // TODO: Implement real settings saving
      // This would involve updating user cards and connection preferences
      console.log('Saving settings:', settings);
      
      // For now, we'll simulate the save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      console.log('Settings saved successfully');
      
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  }, [currentAccount?.address, settings]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setSettings(prev => ({
      ...prev,
      preferences: { ...prev.preferences, theme: newTheme }
    }));
    setTheme(newTheme);
  };

  const handleUpdateConnectionPreferences = useCallback(async (
    connectedUser: string,
    notificationsEnabled: boolean,
    profileShared: boolean,
    messagesAllowed: boolean
  ) => {
    if (!currentAccount?.address) return;
    
    try {
      // TODO: Implement real connection preferences update
      // This would involve calling updateConnectionPreferencesTransaction
      console.log('Updating connection preferences:', {
        connectedUser,
        notificationsEnabled,
        profileShared,
        messagesAllowed
      });
      
    } catch (error) {
      console.error('Error updating connection preferences:', error);
    }
  }, [currentAccount?.address]);

  const handleUpdateConnectionStatus = useCallback(async (
    connectedUser: string,
    newStatus: string
  ) => {
    if (!currentAccount?.address) return;
    
    try {
      // TODO: Implement real connection status update
      // This would involve calling updateConnectionStatusTransaction
      console.log('Updating connection status:', {
        connectedUser,
        newStatus
      });
      
    } catch (error) {
      console.error('Error updating connection status:', error);
    }
  }, [currentAccount?.address]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, description: 'Manage your profile information' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure notification preferences' },
    { id: 'privacy', label: 'Privacy', icon: Shield, description: 'Control your privacy settings' },
    { id: 'preferences', label: 'Preferences', icon: Palette, description: 'Customize your experience' },
    { id: 'security', label: 'Security', icon: Key, description: 'Manage security settings' }
  ];

  // User not connected state
  if (!currentAccount) {
    return (
      <div className="bg-background min-h-screen pt-16 flex items-center justify-center relative">
        <StarBackground />
        <div className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30"
          >
            <Settings className="h-16 w-16 text-primary" />
          </motion.div>
          <h2 className="text-4xl font-bold text-foreground mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-8 text-lg">You need to connect your Sui wallet to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen text-foreground relative">
      <StarBackground />
      
      <div className="relative z-10 pt-32 pb-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <DashboardSidebar />
            
            <main className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key="settings-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  {/* Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Settings className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold text-foreground">Settings</h1>
                        <p className="text-muted-foreground mt-1">
                          Manage your account and preferences
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveSettings}
                      disabled={loading || saving}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Save size={20} />
                      )}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </motion.button>
                  </motion.div>

                  {/* Settings Tabs */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-card/70 backdrop-blur-xl border border-border rounded-xl p-6"
                  >
                    {/* Tab Navigation */}
                    <div className="flex flex-wrap gap-2 mb-8">
                      {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <motion.button
                            key={tab.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                              activeTab === tab.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary/50 text-muted-foreground hover:bg-accent'
                            }`}
                          >
                            <Icon size={20} />
                            <div className="text-left">
                              <div className="font-medium">{tab.label}</div>
                              <div className="text-xs opacity-80">{tab.description}</div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* Profile Settings */}
                        {activeTab === 'profile' && (
                          <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-foreground">Profile Information</h3>
                            {loading ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Display Name
                                </label>
                                <input
                                  type="text"
                                  value={settings.profile.displayName}
                                  onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    profile: { ...prev.profile, displayName: e.target.value }
                                  }))}
                                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Enter your display name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Location
                                </label>
                                <input
                                  type="text"
                                  value={settings.profile.location}
                                  onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    profile: { ...prev.profile, location: e.target.value }
                                  }))}
                                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="City, Country"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Bio
                                </label>
                                <textarea
                                  value={settings.profile.bio}
                                  onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    profile: { ...prev.profile, bio: e.target.value }
                                  }))}
                                  rows={4}
                                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Tell us about yourself..."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Website
                                </label>
                                <input
                                  type="url"
                                  value={settings.profile.website}
                                  onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    profile: { ...prev.profile, website: e.target.value }
                                  }))}
                                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="https://yourwebsite.com"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  GitHub
                                </label>
                                <input
                                  type="text"
                                  value={settings.profile.github}
                                  onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    profile: { ...prev.profile, github: e.target.value }
                                  }))}
                                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="username"
                                />
                              </div>
                            </div>
                            )}
                            
                            {/* User Cards Information */}
                            {userCards.length > 0 && (
                              <div className="mt-8 p-6 bg-secondary/30 rounded-lg">
                                <h4 className="text-lg font-semibold text-foreground mb-4">Your Developer Cards</h4>
                                <div className="space-y-3">
                                  {userCards.map((card, index) => (
                                    <div key={index} className="p-4 bg-background/50 rounded-lg border border-border">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <h5 className="font-medium text-foreground">{card.name || 'Untitled Card'}</h5>
                                          <p className="text-sm text-muted-foreground">
                                            {card.bio || 'No description available'}
                                          </p>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {card.isActive ? 'Active' : 'Inactive'}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Notification Settings */}
                        {activeTab === 'notifications' && (
                          <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-foreground">Notification Preferences</h3>
                            <div className="space-y-4">
                              {Object.entries(settings.notifications).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                                  <div>
                                    <div className="font-medium text-foreground capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {key === 'emailNotifications' && 'Receive notifications via email'}
                                      {key === 'pushNotifications' && 'Receive push notifications in browser'}
                                      {key === 'projectUpdates' && 'Get notified about project updates'}
                                      {key === 'messageAlerts' && 'Get notified about new messages'}
                                      {key === 'weeklyDigest' && 'Receive weekly summary emails'}
                                    </div>
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSettings(prev => ({
                                      ...prev,
                                      notifications: { ...prev.notifications, [key]: !value }
                                    }))}
                                    className={`w-12 h-6 rounded-full transition-colors ${
                                      value ? 'bg-primary' : 'bg-muted'
                                    }`}
                                  >
                                    <motion.div
                                      animate={{ x: value ? 24 : 2 }}
                                      className="w-5 h-5 bg-white rounded-full shadow-md"
                                    />
                                  </motion.button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Privacy Settings */}
                        {activeTab === 'privacy' && (
                          <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-foreground">Privacy Settings</h3>
                            <div className="space-y-6">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-3">
                                  Profile Visibility
                                </label>
                                <div className="space-y-2">
                                  {[
                                    { value: 'public', label: 'Public', desc: 'Anyone can see your profile' },
                                    { value: 'connections', label: 'Connections Only', desc: 'Only your connections can see your profile' },
                                    { value: 'private', label: 'Private', desc: 'Only you can see your profile' }
                                  ].map((option) => (
                                    <label key={option.value} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer">
                                      <input
                                        type="radio"
                                        name="profileVisibility"
                                        value={option.value}
                                        checked={settings.privacy.profileVisibility === option.value}
                                        onChange={(e) => setSettings(prev => ({
                                          ...prev,
                                          privacy: { ...prev.privacy, profileVisibility: e.target.value as any }
                                        }))}
                                        className="text-primary"
                                      />
                                      <div>
                                        <div className="font-medium text-foreground">{option.label}</div>
                                        <div className="text-sm text-muted-foreground">{option.desc}</div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                {Object.entries(settings.privacy).filter(([key]) => key !== 'profileVisibility').map(([key, value]) => (
                                  <div key={key} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                                    <div>
                                      <div className="font-medium text-foreground capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {key === 'showEmail' && 'Display your email on your profile'}
                                        {key === 'showLocation' && 'Display your location on your profile'}
                                        {key === 'allowMessages' && 'Allow others to send you messages'}
                                      </div>
                                    </div>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => setSettings(prev => ({
                                        ...prev,
                                        privacy: { ...prev.privacy, [key]: !value }
                                      }))}
                                      className={`w-12 h-6 rounded-full transition-colors ${
                                        value ? 'bg-primary' : 'bg-muted'
                                      }`}
                                    >
                                      <motion.div
                                        animate={{ x: value ? 24 : 2 }}
                                        className="w-5 h-5 bg-white rounded-full shadow-md"
                                      />
                                    </motion.button>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Connection Preferences */}
                            {connections.length > 0 && (
                              <div className="mt-8 p-6 bg-secondary/30 rounded-lg">
                                <h4 className="text-lg font-semibold text-foreground mb-4">Connection Preferences</h4>
                                <div className="space-y-4">
                                  {connections.map((connection, index) => (
                                    <div key={index} className="p-4 bg-background/50 rounded-lg border border-border">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <h5 className="font-medium text-foreground">
                                            {connection.user.slice(0, 8)}...
                                          </h5>
                                          <p className="text-sm text-muted-foreground">
                                            Status: {connection.status}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-muted-foreground">
                                            {connection.notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {connection.messagesAllowed ? 'Messages Allowed' : 'Messages Blocked'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Preferences Settings */}
                        {activeTab === 'preferences' && (
                          <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-foreground">Preferences</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-3">
                                  Theme
                                </label>
                                <div className="space-y-2">
                                  {[
                                    { value: 'light', label: 'Light' },
                                    { value: 'dark', label: 'Dark' },
                                    { value: 'system', label: 'System' }
                                  ].map((option) => (
                                    <label key={option.value} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer">
                                      <input
                                        type="radio"
                                        name="theme"
                                        value={option.value}
                                        checked={settings.preferences.theme === option.value}
                                        onChange={() => handleThemeChange(option.value as any)}
                                        className="text-primary"
                                      />
                                      <div className="font-medium text-foreground">{option.label}</div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Language
                                </label>
                                <select
                                  value={settings.preferences.language}
                                  onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    preferences: { ...prev.preferences, language: e.target.value }
                                  }))}
                                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  <option value="en">English</option>
                                  <option value="es">Spanish</option>
                                  <option value="fr">French</option>
                                  <option value="de">German</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Timezone
                                </label>
                                <select
                                  value={settings.preferences.timezone}
                                  onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    preferences: { ...prev.preferences, timezone: e.target.value }
                                  }))}
                                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  <option value="UTC">UTC</option>
                                  <option value="EST">Eastern Time</option>
                                  <option value="PST">Pacific Time</option>
                                  <option value="GMT">GMT</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Currency
                                </label>
                                <select
                                  value={settings.preferences.currency}
                                  onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    preferences: { ...prev.preferences, currency: e.target.value }
                                  }))}
                                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  <option value="USD">USD</option>
                                  <option value="EUR">EUR</option>
                                  <option value="GBP">GBP</option>
                                  <option value="JPY">JPY</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Security Settings */}
                        {activeTab === 'security' && (
                          <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-foreground">Security Settings</h3>
                            <div className="space-y-6">
                              <div className="p-6 bg-secondary/30 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Add an extra layer of security to your account
                                    </p>
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSettings(prev => ({
                                      ...prev,
                                      security: { ...prev.security, twoFactorAuth: !prev.security.twoFactorAuth }
                                    }))}
                                    className={`w-12 h-6 rounded-full transition-colors ${
                                      settings.security.twoFactorAuth ? 'bg-primary' : 'bg-muted'
                                    }`}
                                  >
                                    <motion.div
                                      animate={{ x: settings.security.twoFactorAuth ? 24 : 2 }}
                                      className="w-5 h-5 bg-white rounded-full shadow-md"
                                    />
                                  </motion.button>
                                </div>
                                {settings.security.twoFactorAuth && (
                                  <div className="text-sm text-green-600 bg-green-500/10 p-3 rounded-lg">
                                    ✓ Two-factor authentication is enabled
                                  </div>
                                )}
                              </div>

                              <div className="p-6 bg-secondary/30 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <h4 className="font-medium text-foreground">Login Alerts</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Get notified when someone logs into your account
                                    </p>
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSettings(prev => ({
                                      ...prev,
                                      security: { ...prev.security, loginAlerts: !prev.security.loginAlerts }
                                    }))}
                                    className={`w-12 h-6 rounded-full transition-colors ${
                                      settings.security.loginAlerts ? 'bg-primary' : 'bg-muted'
                                    }`}
                                  >
                                    <motion.div
                                      animate={{ x: settings.security.loginAlerts ? 24 : 2 }}
                                      className="w-5 h-5 bg-white rounded-full shadow-md"
                                    />
                                  </motion.button>
                                </div>
                              </div>

                              <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <div className="flex items-center gap-3 mb-4">
                                  <AlertTriangle className="h-5 w-5 text-destructive" />
                                  <h4 className="font-medium text-destructive">Danger Zone</h4>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                  These actions are irreversible. Please proceed with caution.
                                </p>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setShowDeleteModal(true)}
                                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                                >
                                  <Trash2 size={16} className="inline mr-2" />
                                  Delete Account
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card/90 backdrop-blur-xl border border-border rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <h2 className="text-xl font-bold text-foreground">Delete Account</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                This action cannot be undone. This will permanently delete your account and remove all your data.
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // TODO: Implement account deletion
                    setShowDeleteModal(false);
                  }}
                  className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                >
                  Delete Account
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardSettings;
