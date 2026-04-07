import { motion } from 'motion/react';
import Logo from './Logo';

export default function SplashScreen() {
  return (
    <div className="min-h-screen bg-slate-900 flex justify-center">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.4, scale: 1 }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
            className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.4, scale: 1 }}
            transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", delay: 1 }}
            className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-indigo-500/30 rounded-full blur-[100px]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.2, scale: 1 }}
            transition={{ duration: 6, repeat: Infinity, repeatType: "reverse", delay: 2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]"
          />
        </div>

        {/* Glassmorphism Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="relative z-10 flex flex-col items-center p-12 rounded-[3rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        >
          <motion.div
            animate={{ 
              y: [0, -8, 0],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <Logo size="xl" variant="white" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-col items-center"
          >
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-blue-400 to-transparent mb-4" />
            <p className="text-blue-200 font-black tracking-[0.3em] uppercase text-xs text-center drop-shadow-md">
              Buy • Sell • Connect
            </p>
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-blue-400 to-transparent mt-4" />
          </motion.div>
        </motion.div>

        {/* Loading Dots */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <div className="flex gap-2.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.2, 1, 0.2],
                  y: [0, -4, 0]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]"
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-blue-300/50 uppercase tracking-widest">Loading</span>
        </motion.div>
      </div>
    </div>
  );
}
