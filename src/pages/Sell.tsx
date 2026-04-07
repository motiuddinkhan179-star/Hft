import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CATEGORIES, Category } from '../types';
import { Camera, X, MapPin, IndianRupee, Tag, FileText, ArrowLeft, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

import { useCoins } from '../contexts/CoinContext';

export default function Sell() {
  const navigate = useNavigate();
  const { earnCoins, spendCoins, coins } = useCoins();
  const [loading, setLoading] = useState(false);
  const [boostType, setBoostType] = useState<'none' | '7' | '14' | '28'>('none');
  const [isFreeAd, setIsFreeAd] = useState(true);
  const [checkingFreeAd, setCheckingFreeAd] = useState(true);
  const [canPostToday, setCanPostToday] = useState(true);

  const BOOST_OPTIONS = [
    { id: '7', days: 7, cost: 50, label: '7 Days Boost' },
    { id: '14', days: 14, cost: 90, label: '14 Days Boost' },
    { id: '28', days: 28, cost: 150, label: '28 Days Boost' },
  ];

  React.useEffect(() => {
    const checkUserStatus = async () => {
      if (!auth.currentUser) return;
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          
          // Check free monthly ad
          const lastFreeAdDate = data.lastFreeAdDate;
          if (!lastFreeAdDate) {
            setIsFreeAd(true);
          } else {
            const lastDate = new Date(lastFreeAdDate);
            const now = new Date();
            const isSameMonth = lastDate.getMonth() === now.getMonth() && lastDate.getFullYear() === now.getFullYear();
            setIsFreeAd(!isSameMonth);
          }

          // Check daily ad limit (1 per day)
          const lastAdDate = data.lastAdDate;
          if (lastAdDate) {
            const lastDate = new Date(lastAdDate).toDateString();
            const today = new Date().toDateString();
            setCanPostToday(lastDate !== today);
          }
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      } finally {
        setCheckingFreeAd(false);
      }
    };
    checkUserStatus();
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '' as Category | '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    images: [] as string[],
  });

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        let name = 'Current Location';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          const data = await res.json();
          const addr = data.address;
          const specific = addr.suburb || addr.neighbourhood || addr.city_district || addr.village || addr.town;
          const city = addr.city || addr.state;
          
          if (specific && city && specific !== city) {
            name = `${specific}, ${city}`;
          } else {
            name = specific || city || 'Current Location';
          }
        } catch (e) {
          console.error('Reverse geocoding failed', e);
        }

        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          location: name
        }));
        toast.success(`Location detected: ${name}`);
      },
      (error) => {
        console.error('Error detecting location:', error);
        let msg = 'Failed to detect location';
        if (error.code === 1) msg = 'Location permission denied';
        if (error.code === 2) msg = 'Location unavailable';
        if (error.code === 3) msg = 'Location request timed out';
        toast.error(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 1024 * 1024) { // 1MB limit for base64 storage
        toast.error('Image size should be less than 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast.error('Please login to sell items');
      return;
    }

    if (!formData.category || !formData.title || !formData.price) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!canPostToday) {
      toast.error('You can only post 1 ad per day');
      return;
    }

    setLoading(true);
    try {
      // Ensure user profile exists in Firestore
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.displayName,
        email: auth.currentUser.email,
        photoURL: auth.currentUser.photoURL,
        createdAt: new Date().toISOString()
      }, { merge: true });

      const boostOption = BOOST_OPTIONS.find(opt => opt.id === boostType);
      if (boostOption) {
        const success = await spendCoins(boostOption.cost, `Boosted ad (${boostOption.days} days): ${formData.title}`);
        if (!success) {
          setLoading(false);
          return;
        }
      }

      if (!isFreeAd) {
        const success = await spendCoins(50, `Additional monthly ad: ${formData.title}`);
        if (!success) {
          setLoading(false);
          return;
        }
      }

      const now = Date.now();
      const isBoosted = boostType !== 'none';
      const boostDays = isBoosted ? parseInt(boostType) : 0;
      
      // Free ads expire in 2 days, boosted ads expire in X days
      const visibilityDays = isBoosted ? boostDays : 2;
      const expiresAt = new Date(now + visibilityDays * 24 * 60 * 60 * 1000).toISOString();
      // Deletes 4 hours after expiry
      const deleteAt = new Date(new Date(expiresAt).getTime() + 4 * 60 * 60 * 1000).toISOString();

      const docRef = await addDoc(collection(db, 'items'), {
        ...formData,
        price: parseFloat(formData.price),
        sellerId: auth.currentUser.uid,
        sellerName: auth.currentUser.displayName || 'Anonymous',
        createdAt: new Date().toISOString(),
        status: 'active',
        isBoosted,
        boostDays,
        expiresAt,
        deleteAt,
        boostExpiresAt: isBoosted ? expiresAt : null
      });

      // Update lastFreeAdDate if it was a free ad, and always update lastAdDate
      const userUpdate: any = { lastAdDate: new Date().toISOString() };
      if (isFreeAd) {
        userUpdate.lastFreeAdDate = new Date().toISOString();
      }
      await setDoc(doc(db, 'users', auth.currentUser.uid), userUpdate, { merge: true });

      // Reward for posting
      await earnCoins(20, `Posted new ad: ${formData.title}`);

      // Send confirmation notification
      await addDoc(collection(db, 'notifications'), {
        userId: auth.currentUser.uid,
        title: 'Ad Posted Successfully!',
        message: `Your ad "${formData.title}" is now live on OSL.`,
        type: 'system',
        read: false,
        link: `/item/${docRef.id}`,
        createdAt: new Date().toISOString(),
      });

      toast.success('Item listed successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error listing item:', error);
      toast.error('Failed to list item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <header className="sticky top-0 bg-white shadow-sm z-40 px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Post your Ad</h1>
        <div className="w-8" />
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Image Upload */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 block uppercase tracking-wider">Upload Photos</label>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageAdd}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 min-w-[96px] border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Camera className="w-8 h-8 mb-1" />
              <span className="text-[10px] font-bold">Add Photo</span>
            </button>
            {formData.images.map((url, index) => (
              <div key={index} className="relative w-24 h-24 min-w-[96px]">
                <img src={url} alt="" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Tag className="w-3 h-3" /> Category
            </label>
            <select
              value={formData.category}
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              required
            >
              <option value="">Select Category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3 h-3" /> Ad Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. iPhone 13 Pro Max"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3 h-3" /> Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Include condition, features, reason for selling..."
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <IndianRupee className="w-3 h-3" /> Price
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="Set a price"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><MapPin className="w-3 h-3" /> Location</span>
              <button 
                type="button" 
                onClick={detectLocation}
                className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline"
              >
                Detect Location
              </button>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Bandra, Mumbai"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            {formData.latitude && (
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">
                Coordinates captured: {formData.latitude.toFixed(4)}, {formData.longitude?.toFixed(4)}
              </p>
            )}
          </div>

          {/* Boost Options */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-3 h-3" /> Boost your Ad (Optional)
            </label>
            <div className="grid grid-cols-1 gap-3">
              <div 
                onClick={() => setBoostType('none')}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                  boostType === 'none' ? "bg-blue-50 border-blue-400 shadow-md" : "bg-gray-50 border-gray-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    boostType === 'none' ? "bg-blue-400 text-white" : "bg-gray-200 text-gray-400"
                  )}>
                    <X className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">No Boost</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expires in 2 days</p>
                  </div>
                </div>
                <span className="text-xs font-black text-gray-400">FREE</span>
              </div>

              {BOOST_OPTIONS.map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => setBoostType(opt.id as any)}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                    boostType === opt.id ? "bg-amber-50 border-amber-400 shadow-md" : "bg-gray-50 border-gray-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      boostType === opt.id ? "bg-amber-400 text-white" : "bg-gray-200 text-gray-400"
                    )}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{opt.label}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Top visibility for {opt.days} days</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-amber-600">{opt.cost} Coins</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Balance: {coins}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || checkingFreeAd || !canPostToday}
          className={cn(
            "w-full bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all",
            (loading || checkingFreeAd || !canPostToday) ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-800 hover:shadow-blue-300"
          )}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Posting Ad...</span>
            </div>
          ) : !canPostToday ? (
            'Limit Reached (1 Ad/Day)'
          ) : (
            <div className="flex flex-col items-center">
              <span>Post Now</span>
              <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">
                {isFreeAd ? 'FREE (Monthly Ad)' : 'Cost: 50 Coins'}
              </span>
            </div>
          )}
        </motion.button>
      </form>
    </div>
  );
}
