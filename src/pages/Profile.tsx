import React, { useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { LogOut, Settings, Heart, ShoppingBag, Bell, HelpCircle, ChevronRight, User as UserIcon, Camera, LogIn, UserPlus, ArrowLeft, Coins, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getCountFromServer, doc, setDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { useCoins } from '../contexts/CoinContext';
import Logo from '../components/Logo';

export default function Profile() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { coins, spendCoins } = useCoins();
  const [stats, setStats] = useState({ ads: 0, likes: 0, followers: 0, following: 0, rating: 0 });
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shopData, setShopData] = useState<any>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setIsPremium(data.isPremium || false);
        setIsAdmin(data.role === 'admin' || user.email === 'khanmohammadahmad591@gmail.com' || user.email === 'khanmohammadahmad123@gmail.com');
        setShopData(data);
      }
    });

    const fetchStats = async () => {
      // Ads count
      const adsQ = query(collection(db, 'items'), where('sellerId', '==', user.uid));
      const adsCount = await getCountFromServer(adsQ);
      
      // Likes count (items user liked)
      const likesQ = query(collection(db, 'likes'), where('userId', '==', user.uid));
      const likesCount = await getCountFromServer(likesQ);

      // Followers count
      const followersQ = query(collection(db, 'following'), where('followedId', '==', user.uid));
      const followersCount = await getCountFromServer(followersQ);

      // Following count
      const followingQ = query(collection(db, 'following'), where('followerId', '==', user.uid));
      const followingCount = await getCountFromServer(followingQ);

      // Rating
      const ratingsQ = query(collection(db, 'ratings'), where('targetUserId', '==', user.uid));
      const ratingsSnapshot = await getDocs(ratingsQ);
      const ratings = ratingsSnapshot.docs.map(doc => doc.data().rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      
      setStats({
        ads: adsCount.data().count,
        likes: likesCount.data().count,
        followers: followersCount.data().count,
        following: followingCount.data().count,
        rating: parseFloat(avgRating.toFixed(1))
      });
    };

    fetchStats();
  }, [auth.currentUser?.uid]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 1024 * 1024) {
      toast.error('Image size should be less than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        await setDoc(doc(db, 'users', user.uid), {
          photoURL: base64
        }, { merge: true });
        toast.success('Profile photo updated!');
      } catch (error) {
        console.error('Error updating photo:', error);
        toast.error('Failed to update photo');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Save user profile to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString()
      }, { merge: true });

      toast.success('Logged in successfully!');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show an error toast
        return;
      }
      console.error('Login error:', error);
      toast.error('Failed to login');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleBuyPremium = async () => {
    if (!user) return;
    if (isPremium) {
      toast.success('You are already a Premium member!');
      return;
    }

    const success = await spendCoins(500, 'Purchased Premium Badge');
    if (success) {
      await setDoc(doc(db, 'users', user.uid), {
        isPremium: true
      }, { merge: true });
      toast.success('Welcome to OSL Premium! 🛡️');
    }
  };

  const isShopExpired = shopData?.shopExpiresAt ? new Date() > new Date(shopData.shopExpiresAt) : false;

  const menuItems = [
    { icon: Coins, label: 'OSL Coins', color: 'text-amber-600', bg: 'bg-amber-50', path: '/coins', value: `${coins}` },
    { 
      icon: ShoppingBag, 
      label: 'Seller Panel', 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50', 
      path: '/seller-panel',
      status: shopData?.hasShop ? (isShopExpired ? 'Expired' : 'Active') : null
    },
    { icon: ShoppingBag, label: 'My Ads', color: 'text-blue-600', bg: 'bg-blue-50', path: '/my-ads' },
    { icon: Heart, label: 'Favorites', color: 'text-red-600', bg: 'bg-red-50', path: '/favorites' },
    { icon: Bell, label: 'Notifications', color: 'text-yellow-600', bg: 'bg-yellow-50', path: '/notifications' },
    { icon: Settings, label: 'Settings', color: 'text-gray-600', bg: 'bg-gray-100', path: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', color: 'text-green-600', bg: 'bg-green-50', path: '/help' },
  ];

  if (isAdmin) {
    menuItems.push({ icon: ShieldCheck, label: 'Admin Panel', color: 'text-purple-600', bg: 'bg-purple-50', path: '/admin' });
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-white pb-20">
        <header className="p-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="mb-10">
            <Logo size="xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to OSL</h1>
          <p className="text-gray-500 text-center mb-8">Login to buy, sell and manage your ads with ease.</p>
          
          <div className="w-full space-y-4">
            <button
              onClick={handleLogin}
              className="w-full bg-white text-gray-700 font-bold py-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-[1px] bg-gray-100" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">or</span>
              <div className="flex-1 h-[1px] bg-gray-100" />
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <LogIn className="w-5 h-5" />
              Login with Email
            </button>

            <button
              onClick={() => navigate('/signup')}
              className="w-full bg-blue-50 text-blue-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <UserPlus className="w-5 h-5" />
              Create New Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="bg-white px-6 pt-12 pb-8 rounded-b-[40px] shadow-sm border-b border-gray-100 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random`} 
              alt={user.displayName || ''} 
              className="w-20 h-20 rounded-full border-4 border-blue-50 shadow-md"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpdate} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">{user.displayName}</h2>
              {isPremium && (
                <div className="bg-blue-600 text-white p-1 rounded-full shadow-sm" title="Premium Member">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
            </div>
            <p className="text-gray-500 text-sm">{user.email}</p>
            {shopData?.location && (
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">📍 {shopData.location}</p>
            )}
            {shopData?.bio && (
              <p className="text-gray-600 text-xs mt-2 line-clamp-2 italic">"{shopData.bio}"</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <button 
                onClick={() => navigate(`/profile/${user.uid}`)}
                className="text-blue-600 text-xs font-bold uppercase tracking-wider hover:underline"
              >
                View Profile
              </button>
              {!isPremium && (
                <button 
                  onClick={handleBuyPremium}
                  className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  Get Premium 🛡️
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-blue-50/50 p-2 rounded-2xl text-center">
            <span className="block text-lg font-bold text-blue-700">{stats.ads}</span>
            <span className="text-[8px] font-bold text-blue-600 uppercase">Ads</span>
          </div>
          <div className="bg-red-50/50 p-2 rounded-2xl text-center">
            <span className="block text-lg font-bold text-red-700">{stats.likes}</span>
            <span className="text-[8px] font-bold text-red-600 uppercase">Likes</span>
          </div>
          <div className="bg-purple-50/50 p-2 rounded-2xl text-center">
            <span className="block text-lg font-bold text-purple-700">{stats.followers}</span>
            <span className="text-[8px] font-bold text-purple-600 uppercase">Followers</span>
          </div>
          <div className="bg-green-50/50 p-2 rounded-2xl text-center">
            <span className="block text-lg font-bold text-green-700">{stats.rating}</span>
            <span className="text-[8px] font-bold text-green-600 uppercase">Rating</span>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            className="w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className={cn("p-2.5 rounded-xl", item.bg)}>
                <item.icon className={cn("w-5 h-5", item.color)} />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-gray-700">{item.label}</span>
                {item.status && (
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                    item.status === 'Active' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    {item.status}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </button>
        ))}

        <button
          onClick={handleLogout}
          className="w-full mt-6 bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-red-100 text-red-600 hover:bg-red-50 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-red-50 rounded-xl">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-bold">Logout</span>
          </div>
        </button>
      </div>
    </div>
  );
}
