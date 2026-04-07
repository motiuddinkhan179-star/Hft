import React, { useState, useEffect, useRef } from 'react';
import { Home, Search, PlusCircle, MessageSquare, User, Tag, Store, X, Sparkles, Zap, ShieldCheck, Rocket, Crown, Flame, Orbit, Atom, ZapOff } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSellMenu, setShowSellMenu] = useState(false);
  const [hasShop, setHasShop] = useState(false);
  const hideOnPaths = ['/chat/', '/item/', '/seller-panel'];
  const shouldHide = hideOnPaths.some(path => location.pathname.startsWith(path));

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setHasShop(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'shops', user.uid),
      (doc) => {
        setHasShop(doc.exists());
      },
      (error) => {
        console.error('Error listening to shop status:', error);
        handleFirestoreError(error, OperationType.GET, `shops/${user.uid}`);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser]);

  // Refined Magnetic & Tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 300 };
  const dx = useSpring(mouseX, springConfig);
  const dy = useSpring(mouseY, springConfig);
  
  const rotateX = useTransform(dy, [-20, 20], [15, -15]);
  const rotateY = useTransform(dx, [-20, 20], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    mouseX.set(x * 0.4);
    mouseY.set(y * 0.4);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  if (shouldHide) return null;

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: PlusCircle, label: 'Sell', path: '/sell', special: true },
    { icon: MessageSquare, label: 'Chats', path: '/chats' },
    { icon: User, label: 'Account', path: '/profile' },
  ];

  return (
    <>
      <AnimatePresence>
        {showSellMenu && (
          <>
            {/* Sophisticated Glass Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSellMenu(false)}
              className="fixed inset-0 z-[55] bg-black/10 backdrop-blur-[12px]"
            />
            
            {/* Orbital Bloom Menu */}
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md pointer-events-none">
              <div className="relative h-48 flex items-center justify-center">
                
                {/* Option 1: Post Ads */}
                <motion.div
                  initial={{ opacity: 0, scale: 0, y: 40, x: 0 }}
                  animate={{ opacity: 1, scale: 1, y: -60, x: -70 }}
                  exit={{ opacity: 0, scale: 0, y: 40, x: 0 }}
                  transition={{ type: "spring", damping: 15, stiffness: 250, delay: 0.05 }}
                  className="absolute pointer-events-auto"
                >
                  <motion.button
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowSellMenu(false);
                      navigate('/sell');
                    }}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-gray-100 group-hover:border-blue-500 transition-colors">
                      <Tag className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest bg-white/90 px-3 py-1 rounded-full shadow-sm">Post Ads</span>
                  </motion.button>
                </motion.div>

                {/* Option 2: Create Dokaan / My Dokaan */}
                <motion.div
                  initial={{ opacity: 0, scale: 0, y: 40, x: 0 }}
                  animate={{ opacity: 1, scale: 1, y: -60, x: 70 }}
                  exit={{ opacity: 0, scale: 0, y: 40, x: 0 }}
                  transition={{ type: "spring", damping: 15, stiffness: 250, delay: 0.1 }}
                  className="absolute pointer-events-auto"
                >
                  <motion.button
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowSellMenu(false);
                      navigate(hasShop ? '/seller-panel' : '/create-dokaan');
                    }}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={cn(
                      "w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-gray-100 transition-colors",
                      hasShop ? "group-hover:border-blue-500" : "group-hover:border-indigo-500"
                    )}>
                      <Store className={cn("w-6 h-6", hasShop ? "text-blue-600" : "text-indigo-600")} />
                    </div>
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest bg-white/90 px-3 py-1 rounded-full shadow-sm">
                      My Dokaan
                    </span>
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-2 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center max-w-md mx-auto h-16 relative">
          {navItems.map((item) => {
            const isSell = item.special;
            return (
              <div key={item.path} className="flex-1 h-full">
                <div className={cn(
                  "flex flex-col items-center justify-center transition-all duration-300 flex-1 h-full cursor-pointer",
                  location.pathname === item.path ? "text-blue-600" : "text-gray-400 hover:text-blue-500",
                  isSell && "z-10"
                )}>
                  {isSell ? (
                    <div 
                      className="relative -mt-6 flex flex-col items-center" 
                      onClick={() => setShowSellMenu(!showSellMenu)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    >
                      {/* Refined Liquid Glow */}
                      <motion.div
                        animate={{
                          scale: showSellMenu ? [1, 1.4, 1.2] : [1, 1.2, 1],
                          opacity: showSellMenu ? [0.3, 0.5, 0.4] : [0.4, 0.1, 0.4],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-blue-500 rounded-full blur-2xl -z-10"
                      />
                      
                      <motion.div
                        style={{ x: dx, y: dy, rotateX, rotateY, perspective: 1000 }}
                        className="relative"
                      >
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white transition-all duration-500 ease-out",
                          showSellMenu 
                            ? "bg-gray-900 rotate-[135deg] scale-90" 
                            : "bg-gradient-to-br from-blue-600 to-indigo-700 rotate-45"
                        )}>
                          {showSellMenu ? (
                            <X className="w-7 h-7 text-white -rotate-[135deg]" />
                          ) : (
                            <PlusCircle className="w-7 h-7 text-white -rotate-45" />
                          )}
                        </div>
                      </motion.div>
                      
                      <span className={cn(
                        "text-[9px] mt-1 font-black uppercase tracking-[0.2em] transition-all duration-300",
                        showSellMenu ? "text-gray-900 opacity-100" : "text-blue-700 opacity-80"
                      )}>
                        {showSellMenu ? 'Close' : 'Sell'}
                      </span>
                    </div>
                  ) : (
                    <NavLink to={item.path} className="flex flex-col items-center group relative">
                      <motion.div
                        whileHover={{ y: -2 }}
                        className="relative"
                      >
                        <item.icon className={cn(
                          "w-6 h-6 mb-1 transition-all duration-300",
                          location.pathname === item.path ? "text-blue-600" : "text-gray-400 group-hover:text-blue-400"
                        )} />
                        {location.pathname === item.path && (
                          <motion.div
                            layoutId="nav-dot-refined"
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                          />
                        )}
                      </motion.div>
                      <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                    </NavLink>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
