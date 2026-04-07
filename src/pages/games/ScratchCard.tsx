import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Gift, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCoins } from '../../contexts/CoinContext';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

const PRIZES = [0, 1, 0, 2, 0, 5];

export default function ScratchCard() {
  const navigate = useNavigate();
  const { scratchCard, scratchCount } = useCoins();
  const [isRevealed, setIsRevealed] = useState(false);
  const [prize, setPrize] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scratchedArea, setScratchedArea] = useState(0);

  useEffect(() => {
    setPrize(PRIZES[Math.floor(Math.random() * PRIZES.length)]);
    initCanvas();
  }, []);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create metallic gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#94a3b8'); // slate-400
    gradient.addColorStop(0.2, '#e2e8f0'); // slate-200
    gradient.addColorStop(0.5, '#cbd5e1'); // slate-300
    gradient.addColorStop(0.8, '#f8fafc'); // slate-50
    gradient.addColorStop(1, '#94a3b8'); // slate-400

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise/texture
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    // Add text
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = '900 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow for embossed look
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 0;
    ctx.fillText('SCRATCH HERE', canvas.width / 2, canvas.height / 2);
    
    // Reset shadow for drawing
    ctx.shadowColor = 'transparent';

    setScratchedArea(0);
    setIsRevealed(false);
  };

  const handleScratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isRevealed || scratchCount >= 10) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    // Scale coordinates to match canvas internal resolution vs display size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    x *= scaleX;
    y *= scaleY;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2); // Larger brush size
    ctx.fill();

    setScratchedArea(prev => {
      const newArea = prev + 1;
      if (newArea > 40 && !isRevealed) { // Reveal earlier
        revealPrize();
      }
      return newArea;
    });
  };

  const revealPrize = async () => {
    setIsRevealed(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Smooth clear animation
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    if (prize > 0) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#f97316', '#fb923c', '#fdba74']
      });
      await scratchCard(prize);
      toast.success(`You won ${prize} coins! 🎉`, { icon: '🪙' });
    } else {
      await scratchCard(0);
      toast.error('Better luck next time! 😢');
    }
  };

  const handleReset = () => {
    if (scratchCount >= 10) {
      toast.error('Daily scratch limit reached (10/10)');
      return;
    }
    setPrize(PRIZES[Math.floor(Math.random() * PRIZES.length)]);
    initCanvas();
  };

  return (
    <div className="pb-24 bg-slate-900 min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-orange-600/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-red-600/20 blur-[120px] rounded-full" />
      </div>

      <header className="sticky top-0 z-40 px-4 py-4 flex items-center justify-between bg-slate-900/50 backdrop-blur-md border-b border-white/10">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-400" />
          SCRATCH CARD
        </h1>
        <div className="w-9" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-500 uppercase tracking-tight drop-shadow-lg">
            Scratch & Win
          </h2>
          <div className="inline-flex items-center gap-2 mt-3 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              {10 - scratchCount} Cards Left
            </p>
          </div>
        </div>

        {/* Ticket Container */}
        <div className="relative w-full max-w-[320px] aspect-square mb-12">
          {/* Ticket Border/Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-3 shadow-[0_20px_50px_rgba(234,88,12,0.3)]">
            <div className="w-full h-full border-2 border-dashed border-white/40 rounded-2xl relative overflow-hidden bg-slate-900">
              
              {/* Prize underneath */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-900/50 to-slate-900">
                {prize > 0 ? (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={isRevealed ? { scale: 1, opacity: 1 } : {}}
                    className="flex flex-col items-center"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(234,88,12,0.5)]">
                      <Gift className="w-10 h-10 text-white" />
                    </div>
                    <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-orange-200 drop-shadow-lg">
                      {prize}
                    </span>
                    <span className="text-sm font-bold uppercase tracking-widest text-orange-300 mt-2">Coins Won!</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={isRevealed ? { scale: 1, opacity: 1 } : {}}
                    className="flex flex-col items-center"
                  >
                    <span className="text-3xl font-black uppercase tracking-widest text-slate-500">Try Again</span>
                  </motion.div>
                )}
              </div>

              {/* Scratchable surface */}
              <canvas
                ref={canvasRef}
                width={400} // Higher internal resolution for crispness
                height={400}
                className={cn(
                  "absolute inset-0 z-10 w-full h-full cursor-pointer touch-none transition-opacity duration-500",
                  isRevealed ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
                onMouseDown={() => setIsDrawing(true)}
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
                onMouseMove={handleScratch}
                onTouchStart={() => setIsDrawing(true)}
                onTouchEnd={() => setIsDrawing(false)}
                onTouchMove={handleScratch}
              />
            </div>
          </div>
        </div>

        {isRevealed && scratchCount < 10 && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={handleReset}
            className="relative group overflow-hidden rounded-full py-4 px-12 bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-[0_0_40px_rgba(234,88,12,0.4)] hover:shadow-[0_0_60px_rgba(234,88,12,0.6)] hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
            <span className="relative z-10 font-black uppercase tracking-widest text-lg">
              Next Card
            </span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
