import { ArrowLeft, Coins, TrendingUp, History, Gift, Zap, UserPlus, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCoins } from '../contexts/CoinContext';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

export default function CoinsPage() {
  const navigate = useNavigate();
  const { coins, transactions, loading, checkIn, canCheckIn } = useCoins();

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <header className="sticky top-0 bg-white shadow-sm z-40 px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">OSL Coins</h1>
        <div className="w-8" />
      </header>

      <div className="p-4 space-y-6">
        {/* Balance Card */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-amber-200 relative overflow-hidden"
        >
          <div className="relative z-10">
            <p className="text-amber-100 text-xs font-black uppercase tracking-widest mb-2">Available Balance</p>
            <div className="flex items-center gap-3 mb-6">
              <Coins className="w-10 h-10 text-amber-200" />
              <span className="text-5xl font-black">{coins}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/sell')}
                className="bg-white text-amber-600 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-tight hover:bg-amber-50 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Boost Ad
              </button>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-amber-300/20 rounded-full blur-3xl" />
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => canCheckIn && checkIn()}
            disabled={!canCheckIn}
            className={cn(
              "p-5 rounded-3xl border shadow-sm space-y-3 text-left transition-all active:scale-95",
              canCheckIn 
                ? "bg-white border-blue-100 hover:border-blue-200" 
                : "bg-gray-100 border-transparent opacity-60 grayscale"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center",
              canCheckIn ? "bg-blue-50 text-blue-600" : "bg-gray-200 text-gray-400"
            )}>
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Daily Bonus</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {canCheckIn ? "Claim 2 coins" : "Already Claimed"}
              </p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/games/spin')}
            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3 text-left transition-all active:scale-95 hover:border-purple-200"
          >
            <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Lucky Spin</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Win up to 10</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/games/scratch')}
            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3 text-left transition-all active:scale-95 hover:border-orange-200"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
              <Gift className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Scratch Card</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reveal to win</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/games/watch-ad')}
            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3 text-left transition-all active:scale-95 hover:border-red-200"
          >
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Watch Ad</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Earn 1 coin</p>
            </div>
          </button>

          <button 
            onClick={() => {
              const referralCode = Math.random().toString(36).substring(7).toUpperCase();
              navigator.clipboard.writeText(`Join OSL and use my code ${referralCode} to get 50 coins!`);
              toast.success('Referral link copied!');
            }}
            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3 text-left transition-all active:scale-95 hover:border-green-200"
          >
            <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Invite</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Earn 50 coins</p>
            </div>
          </button>
        </div>

        {/* Coin Shop */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <ShoppingBag className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Coin Shop</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { amount: 100, price: '₹99', icon: '🪙' },
              { amount: 500, price: '₹399', icon: '💰', popular: true },
              { amount: 1200, price: '₹799', icon: '💎' },
            ].map((pack, i) => (
              <div 
                key={i}
                className={cn(
                  "bg-white p-4 rounded-2xl border text-center space-y-2 relative overflow-hidden",
                  pack.popular ? "border-blue-400 ring-1 ring-blue-100" : "border-gray-100"
                )}
              >
                {pack.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-600 text-[8px] text-white font-black uppercase py-0.5">Popular</div>
                )}
                <div className="text-2xl">{pack.icon}</div>
                <div>
                  <p className="text-xs font-black text-gray-900">{pack.amount}</p>
                  <p className="text-[10px] font-bold text-blue-600">{pack.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <History className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">History</h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-3xl" />
              ))
            ) : transactions.length > 0 ? (
              transactions.map((tx) => (
                <div 
                  key={tx.id}
                  className="bg-white p-4 rounded-3xl border border-gray-50 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      tx.type === 'earn' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    )}>
                      <Coins className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{tx.description}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {formatDistanceToNow(new Date(tx.createdAt))} ago
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "text-lg font-black",
                    tx.type === 'earn' ? "text-green-600" : "text-red-600"
                  )}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No transactions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* How to earn & spend */}
        <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white space-y-8">
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              How to earn?
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-black">1</div>
                <div>
                  <p className="text-sm font-bold">Daily Check-in</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Earn 2 coins every day</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-black">2</div>
                <div>
                  <p className="text-sm font-bold">Post an Ad</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Earn 20 coins for every new ad</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-black">3</div>
                <div>
                  <p className="text-sm font-bold">Invite Friends</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Earn 50 coins per referral</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              How to spend?
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-black">1</div>
                <div>
                  <p className="text-sm font-bold">Post Ads</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">1st Ad is FREE every month</p>
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Additional Ads: 50 Coins</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-black">2</div>
                <div>
                  <p className="text-sm font-bold">Boost Ads</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">50 coins for 7 days boost</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-black">3</div>
                <div>
                  <p className="text-sm font-bold">Premium Badge</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Get verified status for 100 coins</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
