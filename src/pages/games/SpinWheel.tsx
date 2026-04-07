import { useState, useRef } from 'react';
import { ArrowLeft, Zap, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCoins } from '../../contexts/CoinContext';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { cn } from '../../lib/utils';

const PRIZES = [0, 1, 0, 5, 0, 2, 0, 10];
const COLORS = ['#FFD700', '#FF8C00', '#FF1493', '#9400D3', '#4B0082', '#0000FF', '#00BFFF', '#00FA9A'];

export default function SpinWheel() {
  const navigate = useNavigate();
  const { spinWheel, spinCount } = useCoins();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = async () => {
    if (spinCount >= 10) {
      toast.error('Daily spin limit reached (10/10)');
      return;
    }
    if (isSpinning) return;

    setIsSpinning(true);
    
    // Calculate random prize
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const prize = PRIZES[prizeIndex];
    
    // Calculate rotation
    const segmentAngle = 360 / PRIZES.length;
    // We want the selected segment to land at the top (which is 0 degrees or 360 degrees)
    // The pointer is at the top.
    const targetRotation = rotation + 360 * 5 + (360 - (prizeIndex * segmentAngle)); 
    
    setRotation(targetRotation);

    // Wait for animation to finish
    setTimeout(async () => {
      setIsSpinning(false);
      if (prize > 0) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#FF8C00', '#FF1493']
        });
        await spinWheel(prize);
        toast.success(`You won ${prize} coins! 🎉`, { icon: '🪙' });
      } else {
        await spinWheel(0); // Still counts as a spin
        toast.error('Better luck next time! 😢');
      }
    }, 4000); // 4 seconds animation
  };

  // Generate conic gradient string
  const conicGradient = PRIZES.map((_, i) => {
    const startAngle = (i * 360) / PRIZES.length;
    const endAngle = ((i + 1) * 360) / PRIZES.length;
    return `${COLORS[i]} ${startAngle}deg ${endAngle}deg`;
  }).join(', ');

  return (
    <div className="pb-24 bg-slate-900 min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-600/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-600/20 blur-[120px] rounded-full" />
      </div>

      <header className="sticky top-0 z-40 px-4 py-4 flex items-center justify-between bg-slate-900/50 backdrop-blur-md border-b border-white/10">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          LUCKY SPIN
        </h1>
        <div className="w-9" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 uppercase tracking-tight drop-shadow-lg">
            Spin & Win
          </h2>
          <div className="inline-flex items-center gap-2 mt-3 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              {10 - spinCount} Spins Left
            </p>
          </div>
        </div>

        <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] mb-16">
          {/* Outer Glow */}
          <div className="absolute inset-0 bg-amber-500/30 blur-2xl rounded-full animate-pulse" />
          
          {/* Pointer */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 48L0 16C0 16 6 0 20 0C34 0 40 16 40 16L20 48Z" fill="url(#paint0_linear)" />
              <path d="M20 48L0 16C0 16 6 0 20 0C34 0 40 16 40 16L20 48Z" fill="url(#paint1_linear)" fillOpacity="0.5" />
              <defs>
                <linearGradient id="paint0_linear" x1="20" y1="0" x2="20" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFD700" />
                  <stop offset="1" stopColor="#FF8C00" />
                </linearGradient>
                <linearGradient id="paint1_linear" x1="0" y1="24" x2="40" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" />
                  <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Wheel Container */}
          <div className="w-full h-full rounded-full p-2 bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_0_40px_rgba(0,0,0,0.5),inset_0_4px_10px_rgba(255,255,255,0.2)] relative z-10">
            <motion.div 
              ref={wheelRef}
              className="w-full h-full rounded-full overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
              style={{ background: `conic-gradient(${conicGradient})` }}
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.2, 0.8, 0.1, 1] }} // Custom spring-like ease out
            >
              {/* Lines between segments */}
              {PRIZES.map((_, index) => (
                <div 
                  key={`line-${index}`}
                  className="absolute top-0 left-1/2 w-[2px] h-1/2 bg-white/30 origin-bottom -translate-x-1/2"
                  style={{ transform: `rotate(${(360 / PRIZES.length) * index}deg)` }}
                />
              ))}

              {/* Text Labels */}
              {PRIZES.map((prize, index) => {
                // We want the text to be in the middle of the segment
                const angle = (360 / PRIZES.length) * index + (360 / PRIZES.length) / 2;
                return (
                  <div 
                    key={`text-${index}`}
                    className="absolute top-0 left-1/2 w-12 h-1/2 origin-bottom -translate-x-1/2 flex items-start justify-center pt-6"
                    style={{ transform: `rotate(${angle}deg)` }}
                  >
                    <span className="text-white font-black text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] -rotate-90">
                      {prize === 0 ? '0' : prize}
                    </span>
                  </div>
                );
              })}
            </motion.div>

            {/* Center Knob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.2)] border-4 border-slate-700 z-20 flex items-center justify-center">
              <div className="w-6 h-6 bg-amber-500 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)]" />
            </div>
          </div>
        </div>

        <button
          onClick={handleSpin}
          disabled={isSpinning || spinCount >= 10}
          className={cn(
            "relative group overflow-hidden rounded-full py-4 px-12 transition-all duration-300",
            isSpinning || spinCount >= 10 
              ? "bg-slate-700 text-slate-400 cursor-not-allowed" 
              : "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:shadow-[0_0_60px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95"
          )}
        >
          {/* Button Shine Effect */}
          {!(isSpinning || spinCount >= 10) && (
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
          )}
          <span className="relative z-10 font-black uppercase tracking-widest text-lg">
            {isSpinning ? 'Spinning...' : 'Spin Now'}
          </span>
        </button>
      </div>
    </div>
  );
}
