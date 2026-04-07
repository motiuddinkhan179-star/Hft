import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Settings, 
  TrendingUp, 
  Users, 
  Plus, 
  ArrowLeft,
  MoreVertical,
  ChevronRight,
  Star,
  DollarSign,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  getDocs,
  orderBy
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Item } from '../types';
import { useCoins } from '../contexts/CoinContext';

export default function SellerPanel() {
  const navigate = useNavigate();
  const { coins, spendCoins } = useCoins();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [shop, setShop] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRenewing, setIsRenewing] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    activeItems: 0,
    soldItems: 0,
    avgRating: 0
  });

  const isExpired = shop?.expiresAt ? new Date() > new Date(shop.expiresAt) : false;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    // Listen to Shop Data
    const unsubscribeShop = onSnapshot(
      doc(db, 'shops', user.uid),
      (doc) => {
        if (doc.exists()) {
          setShop(doc.data());
        } else {
          navigate('/create-dokaan');
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `shops/${user.uid}`);
      }
    );

    // Listen to Seller's Items
    const q = query(
      collection(db, 'items'),
      where('sellerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeItems = onSnapshot(
      q,
      (snapshot) => {
        const itemsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
        setItems(itemsList);
        
        // Calculate Stats
        const sold = itemsList.filter(item => item.status === 'sold');
        const active = itemsList.filter(item => item.status === 'active');
        const totalSales = sold.reduce((acc, item) => acc + (item.price || 0), 0);
        
        setStats(prev => ({
          ...prev,
          totalSales,
          activeItems: active.length,
          soldItems: sold.length
        }));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'items');
      }
    );

    // Fetch Ratings for Stats
    const fetchRatings = async () => {
      try {
        const ratingsQ = query(collection(db, 'ratings'), where('sellerId', '==', user.uid));
        const ratingsSnap = await getDocs(ratingsQ);
        if (!ratingsSnap.empty) {
          const total = ratingsSnap.docs.reduce((acc, doc) => acc + (doc.data().score || 0), 0);
          setStats(prev => ({ ...prev, avgRating: total / ratingsSnap.size }));
        }
      } catch (error) {
        console.error('Error fetching ratings:', error);
      }
    };
    fetchRatings();

    return () => {
      unsubscribeShop();
      unsubscribeItems();
    };
  }, [navigate]);

  const handleRenew = async () => {
    if (!auth.currentUser) return;
    if (coins < 1000) {
      toast.error('You need 1000 coins to renew your Dokaan!');
      return;
    }

    setIsRenewing(true);
    try {
      const success = await spendCoins(1000, 'Renewed Dokaan (15 Days Validity)');
      if (!success) {
        setIsRenewing(false);
        return;
      }

      const now = new Date();
      const newExpiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();

      await updateDoc(doc(db, 'shops', auth.currentUser.uid), {
        expiresAt: newExpiresAt,
        status: 'open'
      });

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        shopExpiresAt: newExpiresAt
      });

      toast.success('Dokaan renewed for 15 days!');
    } catch (error) {
      console.error('Error renewing shop:', error);
      toast.error('Failed to renew Dokaan');
    } finally {
      setIsRenewing(false);
    }
  };

  const toggleShopStatus = async () => {
    if (!shop || !auth.currentUser) return;
    if (isExpired) {
      toast.error('Your Dokaan has expired. Please renew to open.');
      return;
    }
    const newStatus = shop.status === 'open' ? 'closed' : 'open';
    try {
      await updateDoc(doc(db, 'shops', auth.currentUser.uid), {
        status: newStatus
      });
      toast.success(`Shop is now ${newStatus.toUpperCase()}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shops/${auth.currentUser.uid}`);
    }
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, 'items', id));
      toast.success('Item deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `items/${id}`);
    }
  };

  const markAsSold = async (id: string) => {
    try {
      await updateDoc(doc(db, 'items', id), { status: 'sold' });
      toast.success('Item marked as sold!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `items/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const dashboardStats = [
    { label: 'Total Sales', value: `₹${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Items', value: stats.activeItems.toString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sold Items', value: stats.soldItems.toString(), icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Rating', value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  const getChartData = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const counts = new Array(7).fill(0);
    const today = new Date();
    
    items.forEach(item => {
      const itemDate = new Date(item.createdAt);
      const diffTime = Math.abs(today.getTime() - itemDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        const dayIndex = itemDate.getDay();
        counts[dayIndex]++;
      }
    });

    const max = Math.max(...counts, 1);
    return counts.map((count, i) => ({
      day: days[i],
      height: (count / max) * 100,
      count
    }));
  };

  const chartData = getChartData();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Premium Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl z-40 px-6 py-5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/profile')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Seller Hub</h1>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{shop?.name || 'My Shop'}</p>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse", 
                isExpired ? "bg-gray-400" : (shop?.status === 'open' ? "bg-green-500" : "bg-red-500")
              )} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleShopStatus}
            disabled={isExpired}
            className={cn(
              "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
              isExpired ? "bg-gray-100 text-gray-400 border border-gray-200" :
              (shop?.status === 'open' ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100")
            )}
          >
            {isExpired ? 'Expired' : (shop?.status === 'open' ? 'Open' : 'Closed')}
          </button>
          <button 
            onClick={() => navigate('/sell')}
            disabled={isExpired}
            className={cn(
              "w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform",
              isExpired && "opacity-50 cursor-not-allowed"
            )}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="px-6 py-8">
        {/* Expiry Banner */}
        {isExpired && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-red-100 mb-8 flex flex-col items-center text-center gap-4"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Dokaan Expired</h3>
              <p className="text-xs font-medium opacity-80">Your 15-day validity has ended. Renew now to continue selling.</p>
            </div>
            <button 
              onClick={handleRenew}
              disabled={isRenewing}
              className="w-full bg-white text-red-600 font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex flex-col items-center"
            >
              <span>{isRenewing ? 'Renewing...' : 'Renew for 15 Days'}</span>
              <span className="text-[10px] uppercase tracking-widest opacity-70">Cost: 1000 Coins</span>
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {dashboardStats.map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm"
                  >
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-3", stat.bg)}>
                      <stat.icon className={cn("w-5 h-5", stat.color)} />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <h3 className="text-xl font-black text-gray-900">{stat.value}</h3>
                  </div>
                ))}
              </div>

              {/* Sales Chart */}
              <section>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Sales Performance</h2>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last 7 Days</span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <div className="flex items-end justify-between h-32 gap-2">
                    {chartData.map((data, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="relative w-full flex-1 flex items-end">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(data.height, 5)}%` }}
                            transition={{ delay: i * 0.1, duration: 1, ease: "easeOut" }}
                            className={cn(
                              "w-full rounded-t-xl transition-all duration-500",
                              data.count > 0 ? "bg-blue-600 shadow-lg shadow-blue-100" : "bg-gray-100"
                            )}
                          />
                        </div>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                          {data.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Quick Actions */}
              <section>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] mb-4 ml-1">Quick Actions</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {[
                    { label: 'Add Product', icon: Package, color: 'bg-blue-600', action: () => navigate('/sell') },
                    { label: 'My Items', icon: Package, color: 'bg-indigo-600', action: () => setActiveTab('products') },
                    { label: 'Analytics', icon: TrendingUp, color: 'bg-purple-600', action: () => {} },
                    { label: 'Settings', icon: Settings, color: 'bg-gray-900', action: () => setActiveTab('settings') },
                  ].map((action, i) => (
                    <button 
                      key={i} 
                      onClick={action.action}
                      className="flex-shrink-0 flex flex-col items-center gap-2"
                    >
                      <div className={cn("w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-white shadow-lg shadow-blue-100", action.color)}>
                        <action.icon className="w-7 h-7" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600">{action.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Shop Health */}
              <section>
                <div className="bg-gray-900 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-gray-200 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black uppercase tracking-widest">Shop Health</h3>
                      <span className="text-[10px] font-black bg-blue-600 px-2 py-1 rounded-full">EXCELLENT</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '92%' }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-blue-500" 
                          />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400">92% Positive Feedback</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black">A+</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl" />
                  <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl" />
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Your Inventory</h2>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{items.length} Items</span>
              </div>
              
              {items.length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm font-bold text-gray-500">No items listed yet</p>
                  <button 
                    onClick={() => navigate('/sell')}
                    className="mt-4 text-blue-600 text-xs font-black uppercase tracking-widest"
                  >
                    Post your first ad
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-[2rem] border border-gray-100 flex gap-4">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Package className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-black text-gray-900 text-sm truncate pr-2">{item.title}</h4>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                            item.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                          )}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-blue-600 font-black text-sm mb-3">₹{item.price?.toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                          {item.status === 'active' && (
                            <button 
                              onClick={() => markAsSold(item.id)}
                              className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg"
                            >
                              Mark Sold
                            </button>
                          )}
                          <button 
                            onClick={() => deleteItem(item.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] mb-4">Sales History</h2>
              {items.filter(i => i.status === 'sold').length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm font-bold text-gray-500">No sales yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.filter(i => i.status === 'sold').map((item, i) => (
                    <div key={i} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 text-sm">{item.title}</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Sold on {new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-900 text-sm">₹{item.price?.toLocaleString()}</p>
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-green-50 text-green-600">
                          Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] mb-4">Shop Settings</h2>
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Shop Name</label>
                  <div className="bg-gray-50 p-4 rounded-2xl font-bold text-gray-900 border border-gray-100">
                    {shop?.name}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
                  <div className="bg-gray-50 p-4 rounded-2xl font-bold text-gray-900 border border-gray-100">
                    {shop?.category}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-50">
                  <button 
                    onClick={() => auth.signOut()}
                    className="w-full py-4 rounded-2xl border-2 border-red-100 text-red-500 font-black uppercase tracking-widest text-xs hover:bg-red-50 transition-colors"
                  >
                    Logout from Hub
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Seller Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-around items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
          { id: 'products', icon: Package, label: 'Items' },
          { id: 'orders', icon: ShoppingBag, label: 'Sales' },
          { id: 'settings', icon: Settings, label: 'Setup' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              activeTab === item.id ? "text-blue-600 scale-110" : "text-gray-400"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
            {activeTab === item.id && (
              <motion.div layoutId="seller-tab" className="w-1 h-1 bg-blue-600 rounded-full mt-0.5" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
