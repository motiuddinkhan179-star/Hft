import { useState, useEffect } from 'react';
import { ArrowLeft, Play, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCoins } from '../../contexts/CoinContext';
import { toast } from 'react-hot-toast';

export default function WatchAd() {
  const navigate = useNavigate();
  const { watchAd, adCount } = useCoins();
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      setIsPlaying(false);
      setIsCompleted(true);
      handleAdComplete();
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const handleStartAd = () => {
    if (adCount >= 5) {
      toast.error('Daily ad limit reached (5/5)');
      return;
    }
    setIsPlaying(true);
    setTimeLeft(15);
    setIsCompleted(false);
  };

  const handleAdComplete = async () => {
    await watchAd();
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen flex flex-col">
      <header className="sticky top-0 bg-white shadow-sm z-40 px-4 py-4 flex items-center justify-between">
        <button 
          onClick={() => {
            if (isPlaying) {
              toast.error('Please finish watching the ad to earn coins!');
            } else {
              navigate(-1);
            }
          }} 
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Watch Ad</h1>
        <div className="w-8" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Watch & Earn</h2>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">
            Ads remaining today: {5 - adCount}/5
          </p>
        </div>

        <div className="w-full max-w-sm aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative flex items-center justify-center mb-12">
          {isPlaying ? (
            <div className="text-white text-center">
              <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="font-bold uppercase tracking-widest">Playing Ad...</p>
              <p className="text-2xl font-black mt-2">{timeLeft}s</p>
            </div>
          ) : isCompleted ? (
            <div className="text-green-400 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <p className="font-bold uppercase tracking-widest">Reward Granted!</p>
            </div>
          ) : (
            <button 
              onClick={handleStartAd}
              disabled={adCount >= 5}
              className="w-20 h-20 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors disabled:opacity-50"
            >
              <Play className="w-8 h-8 text-white ml-2" />
            </button>
          )}
        </div>

        {!isPlaying && !isCompleted && (
          <button
            onClick={handleStartAd}
            disabled={adCount >= 5}
            className="bg-red-600 text-white font-black uppercase tracking-widest py-4 px-12 rounded-full shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            Watch Ad Now
          </button>
        )}

        {isCompleted && adCount < 5 && (
          <button
            onClick={handleStartAd}
            className="bg-blue-600 text-white font-black uppercase tracking-widest py-4 px-12 rounded-full shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
          >
            Watch Another
          </button>
        )}
      </div>
    </div>
  );
}
