import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowLeft, CheckCircle2, Sparkles, Rocket, ShieldCheck, Zap, Coins, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { useCoins } from '../contexts/CoinContext';

export default function CreateDokaan() {
  const navigate = useNavigate();
  const { coins, spendCoins } = useCoins();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    location: ''
  });

  useEffect(() => {
    const checkExistingShop = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const shopDoc = await getDocFromServer(doc(db, 'shops', user.uid));
        if (shopDoc.exists()) {
          const shopData = shopDoc.data();
          const now = new Date();
          const expiresAt = shopData.expiresAt ? new Date(shopData.expiresAt) : null;

          if (expiresAt && now < expiresAt) {
            toast.error('You already have an active Dokaan!');
            navigate('/seller-panel');
          }
        }
      } catch (error) {
        console.error('Error checking shop:', error);
        handleFirestoreError(error, OperationType.GET, `shops/${user.uid}`);
      } finally {
        setLoading(false);
      }
    };

    checkExistingShop();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    if (coins < 1000) {
      toast.error('You need 1000 coins to launch a Dokaan!');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await spendCoins(1000, 'Launched Dokaan (15 Days Validity)');
      if (!success) {
        setIsSubmitting(false);
        return;
      }

      toast.loading('Launching your Dokaan...', { id: 'create-shop' });
      
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();

      const shopPath = `shops/${user.uid}`;
      try {
        await setDoc(doc(db, 'shops', user.uid), {
          ownerId: user.uid,
          name: formData.name,
          category: formData.category,
          createdAt: now.toISOString(),
          expiresAt: expiresAt,
          status: 'open'
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, shopPath);
      }

      // Update user profile to indicate they have a shop
      const userPath = `users/${user.uid}`;
      try {
        await setDoc(doc(db, 'users', user.uid), {
          hasShop: true,
          shopExpiresAt: expiresAt
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userPath);
      }

      toast.success('Your Dokaan is live for 15 days!', { id: 'create-shop' });
      setTimeout(() => navigate('/seller-panel'), 1500);
    } catch (error) {
      console.error('Error creating shop:', error);
      toast.error('Failed to create Dokaan', { id: 'create-shop' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const features = [
    { icon: Coins, title: 'Cost: 1000 Coins', desc: 'One-time payment for launch' },
    { icon: Calendar, title: '15 Days Validity', desc: 'Your shop stays live for 15 days' },
    { icon: Rocket, title: 'Boost Reach', desc: 'Get 2x more visibility' }
  ];

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-40 px-4 py-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Create Your Dokaan</h1>
      </header>

      <main className="px-6 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-200 rotate-6">
            <Store className="w-12 h-12 text-white -rotate-6" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tighter">Start Your Business</h2>
          <p className="text-gray-500 text-sm font-medium max-w-[250px] mx-auto">Launch your professional online store for 1000 coins.</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 mb-10">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <f.icon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{f.title}</h4>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block ml-1">Dokaan Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Ahmad's Tech Hub"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block ml-1">Category</label>
              <select
                required
                className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all appearance-none"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select Category</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="home">Home & Decor</option>
                <option value="services">Services</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all group",
              isSubmitting && "opacity-70 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-3">
              <span>{isSubmitting ? 'Launching...' : 'Launch My Dokaan'}</span>
              <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
            </div>
            <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Cost: 1000 Coins</span>
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center justify-center gap-2 text-gray-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Secure Payment via Coins</span>
          </div>
          <p className="text-[10px] font-bold text-gray-400">Your Balance: {coins} Coins</p>
        </div>
      </main>
    </div>
  );
}
