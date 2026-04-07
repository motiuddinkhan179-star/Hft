import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  User, 
  Palette, 
  Globe, 
  Check, 
  Moon, 
  Sun, 
  Smartphone,
  Trash2,
  Lock,
  Eye,
  Info
} from 'lucide-react';
import { auth, db } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

type SettingView = 'main' | 'account' | 'notifications' | 'appearance' | 'language' | 'privacy';

export default function Settings() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<SettingView>('main');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Form states
  const [accountForm, setAccountForm] = useState({
    displayName: '',
    bio: '',
    phone: '',
    location: ''
  });

  const [notifPrefs, setNotifPrefs] = useState({
    push: true,
    email: true,
    sms: false,
    offers: true
  });

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [language, setLanguage] = useState('English');

  useEffect(() => {
    const applyTheme = (t: typeof theme) => {
      const root = document.documentElement;
      if (t === 'dark') {
        root.classList.add('dark');
      } else if (t === 'light') {
        root.classList.remove('dark');
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setAccountForm({
            displayName: data.displayName || '',
            bio: data.bio || '',
            phone: data.phone || '',
            location: data.location || ''
          });
          if (data.notifPrefs) setNotifPrefs(data.notifPrefs);
          if (data.theme) setTheme(data.theme);
          if (data.language) setLanguage(data.language);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success('Logged out successfully');
      navigate('/profile');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const updateSettings = async (newData: any) => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), newData);
      toast.success('Settings updated!');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(accountForm);
  };

  const toggleNotif = (key: keyof typeof notifPrefs) => {
    const newPrefs = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(newPrefs);
    updateSettings({ notifPrefs: newPrefs });
  };

  const handleThemeChange = (newTheme: typeof theme) => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    updateSettings({ language: newLang });
    toast.success(`Language changed to ${newLang}`);
    // In a real app, we would use an i18n library to change the locale
  };

  const handlePasswordReset = async () => {
    if (!auth.currentUser?.email) return;
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error('Failed to send reset email');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action is permanent and all your ads, coins, and data will be lost.')) return;
    
    toast.loading('Deleting account...', { id: 'delete-acc' });
    try {
      const user = auth.currentUser;
      if (!user) return;

      // 1. Delete user doc from Firestore
      await deleteDoc(doc(db, 'users', user.uid));
      
      // 2. Delete auth user
      await user.delete();
      
      toast.success('Account deleted successfully', { id: 'delete-acc' });
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. You may need to re-authenticate.', { id: 'delete-acc' });
      // If re-auth is needed, we should probably just sign out
      await auth.signOut();
      navigate('/');
    }
  };

  const renderHeader = (title: string, onBack: () => void) => (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md z-40 px-4 py-4 flex items-center gap-3 border-b border-gray-100">
      <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
        <ArrowLeft className="w-6 h-6 text-gray-600" />
      </button>
      <h1 className="text-xl font-black text-gray-900 tracking-tight">{title}</h1>
    </header>
  );

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <AnimatePresence mode="wait">
        {currentView === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <header className="sticky top-0 bg-white shadow-sm z-40 px-6 py-5 flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Settings</h1>
            </header>

            <main className="p-6 space-y-6">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                {[
                  { icon: User, label: 'Account Settings', desc: 'Profile, bio, and phone', view: 'account' },
                  { icon: Bell, label: 'Notifications', desc: 'Alerts and sounds', view: 'notifications' },
                  { icon: Palette, label: 'Appearance', desc: 'Themes and layout', view: 'appearance' },
                  { icon: Globe, label: 'Language', desc: 'App language', view: 'language' },
                  { icon: Shield, label: 'Privacy & Security', desc: 'Data and account', view: 'privacy' },
                  { icon: HelpCircle, label: 'Help & Support', desc: 'FAQs and feedback', onClick: () => navigate('/help') },
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={item.onClick || (() => setCurrentView(item.view as SettingView))}
                    className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group"
                  >
                    <div className="bg-blue-50 p-3 rounded-2xl group-hover:bg-blue-100 transition-colors">
                      <item.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-black text-gray-900 text-sm">{item.label}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>

              <button
                onClick={handleLogout}
                className="w-full bg-red-50 text-red-600 font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 active:scale-95 transition-all border border-red-100 shadow-sm"
              >
                <LogOut className="w-6 h-6" />
                Logout from OSL
              </button>

              <div className="text-center py-6">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">OSL Version 2.4.0 (Stable)</p>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mt-1">Made with ❤️ for Mumbai</p>
              </div>
            </main>
          </motion.div>
        )}

        {currentView === 'account' && (
          <motion.div
            key="account"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {renderHeader('Account Settings', () => setCurrentView('main'))}
            <main className="p-6">
              <form onSubmit={handleAccountUpdate} className="space-y-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Display Name</label>
                    <input
                      type="text"
                      value={accountForm.displayName}
                      onChange={e => setAccountForm({ ...accountForm, displayName: e.target.value })}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Bio</label>
                    <textarea
                      value={accountForm.bio}
                      onChange={e => setAccountForm({ ...accountForm, bio: e.target.value })}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all resize-none"
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Phone Number</label>
                    <input
                      type="tel"
                      value={accountForm.phone}
                      onChange={e => setAccountForm({ ...accountForm, phone: e.target.value })}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all"
                      placeholder="+91 00000 00000"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Location</label>
                    <input
                      type="text"
                      value={accountForm.location}
                      onChange={e => setAccountForm({ ...accountForm, location: e.target.value })}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all"
                      placeholder="e.g. Bandra, Mumbai"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-700 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </main>
          </motion.div>
        )}

        {currentView === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {renderHeader('Notifications', () => setCurrentView('main'))}
            <main className="p-6 space-y-4">
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                {[
                  { key: 'push', label: 'Push Notifications', desc: 'Get alerts on your device' },
                  { key: 'email', label: 'Email Alerts', desc: 'Updates sent to your inbox' },
                  { key: 'sms', label: 'SMS Notifications', desc: 'Direct messages for urgent info' },
                  { key: 'offers', label: 'Special Offers', desc: 'Promotions and coin bonuses' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-6 border-b border-gray-50 last:border-0">
                    <div>
                      <h4 className="font-black text-gray-900 text-sm">{item.label}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleNotif(item.key as keyof typeof notifPrefs)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        notifPrefs[item.key as keyof typeof notifPrefs] ? "bg-blue-600" : "bg-gray-200"
                      )}
                    >
                      <motion.div
                        animate={{ x: notifPrefs[item.key as keyof typeof notifPrefs] ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                ))}
              </div>
            </main>
          </motion.div>
        )}

        {currentView === 'appearance' && (
          <motion.div
            key="appearance"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {renderHeader('Appearance', () => setCurrentView('main'))}
            <main className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'light', label: 'Light Mode', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { id: 'dark', label: 'Dark Mode', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { id: 'system', label: 'System Default', icon: Smartphone, color: 'text-gray-600', bg: 'bg-gray-100' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleThemeChange(opt.id as any)}
                    className={cn(
                      "flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all",
                      theme === opt.id ? "bg-white border-blue-600 shadow-lg shadow-blue-50" : "bg-white border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-2xl", opt.bg)}>
                        <opt.icon className={cn("w-6 h-6", opt.color)} />
                      </div>
                      <span className="font-black text-gray-900 text-sm">{opt.label}</span>
                    </div>
                    {theme === opt.id && <Check className="w-6 h-6 text-blue-600" />}
                  </button>
                ))}
              </div>
            </main>
          </motion.div>
        )}

        {currentView === 'language' && (
          <motion.div
            key="language"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {renderHeader('Language', () => setCurrentView('main'))}
            <main className="p-6">
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                {['English', 'Hindi (हिंदी)', 'Marathi (मराठी)', 'Gujarati (ગુજરાતી)', 'Bengali (বাংলা)'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className="w-full flex items-center justify-between p-6 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-black text-gray-900 text-sm">{lang}</span>
                    {language === lang && <Check className="w-6 h-6 text-blue-600" />}
                  </button>
                ))}
              </div>
            </main>
          </motion.div>
        )}

        {currentView === 'privacy' && (
          <motion.div
            key="privacy"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {renderHeader('Privacy & Security', () => setCurrentView('main'))}
            <main className="p-6 space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                  <div className="flex items-center gap-3 mb-2">
                    <Lock className="w-5 h-5 text-blue-600" />
                    <h4 className="font-black text-gray-900 text-sm">Account Security</h4>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Update your password and secure your account</p>
                  <button 
                    onClick={handlePasswordReset}
                    className="text-blue-600 text-xs font-black uppercase tracking-widest hover:underline"
                  >
                    Reset Password via Email
                  </button>
                </div>
                <div className="p-6 border-b border-gray-50">
                  <div className="flex items-center gap-3 mb-2">
                    <Eye className="w-5 h-5 text-purple-600" />
                    <h4 className="font-black text-gray-900 text-sm">Profile Visibility</h4>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Control who can see your profile and activity</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toast.success('Profile is now Public')}
                      className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100"
                    >
                      Public
                    </button>
                    <button 
                      onClick={() => toast.success('Profile is now Private')}
                      className="bg-gray-50 text-gray-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-100"
                    >
                      Private
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Info className="w-5 h-5 text-gray-600" />
                    <h4 className="font-black text-gray-900 text-sm">Data Usage</h4>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Learn how we use your data to improve OSL</p>
                  <button 
                    onClick={() => {
                      toast.success('Privacy Policy downloaded!');
                      window.open('https://example.com/privacy', '_blank');
                    }}
                    className="text-blue-600 text-xs font-black uppercase tracking-widest hover:underline"
                  >
                    Read Policy
                  </button>
                </div>
              </div>

              <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100">
                <h4 className="font-black text-red-600 text-sm mb-2 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> Danger Zone
                </h4>
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                <button
                  onClick={handleDeleteAccount}
                  className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-100 active:scale-95 transition-all"
                >
                  Delete My Account
                </button>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
