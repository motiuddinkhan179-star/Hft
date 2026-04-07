import { MapPin, Bell, Search, ChevronDown, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { useLocation } from '../contexts/LocationContext';
import { useCoins } from '../contexts/CoinContext';
import Logo from './Logo';

export default function Header() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { userLocation, detectLocation } = useLocation();
  const { coins } = useCoins();

  return (
    <header className="sticky top-0 bg-white shadow-sm z-40 px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <Logo size="md" onClick={() => navigate('/')} />
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/coins')}
            className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-100 hover:bg-amber-100 transition-all active:scale-95"
          >
            <Coins className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-black text-amber-700">{coins}</span>
          </button>

          <button 
            onClick={() => detectLocation()}
            className="flex items-center gap-1.5 text-gray-700 text-[10px] font-black uppercase tracking-widest bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all active:scale-95 max-w-[120px]"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span className="truncate">{userLocation?.name || 'Location'}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/notifications')}
            className="relative p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell className="w-6 h-6 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
      <div 
        onClick={() => navigate('/search')}
        className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-2.5 text-gray-500 cursor-pointer"
      >
        <Search className="w-5 h-5" />
        <span className="text-sm">Find Cars, Mobile Phones and more...</span>
      </div>
    </header>
  );
}
