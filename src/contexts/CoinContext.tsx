import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, increment, collection, addDoc, query, where, orderBy, limit, getDoc, setDoc } from 'firebase/firestore';
import { Transaction } from '../types';
import { toast } from 'react-hot-toast';

interface CoinContextType {
  coins: number;
  transactions: Transaction[];
  earnCoins: (amount: number, description: string) => Promise<void>;
  spendCoins: (amount: number, description: string) => Promise<boolean>;
  checkIn: () => Promise<void>;
  watchAd: () => Promise<void>;
  spinWheel: (amount: number) => Promise<void>;
  scratchCard: (amount: number) => Promise<void>;
  canCheckIn: boolean;
  adCount: number;
  spinCount: number;
  scratchCount: number;
  loading: boolean;
}

const CoinContext = createContext<CoinContextType | undefined>(undefined);

export function CoinProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoins] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [adCount, setAdCount] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [scratchCount, setScratchCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setCoins(0);
        setTransactions([]);
        setLoading(false);
        return;
      }

      // Listen to user coins and game stats
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCoins(data.coins || 0);
          
          // Reset daily counts if it's a new day
          const today = new Date().toDateString();
          const lastActivityDate = data.lastActivityDate || today;
          
          if (today !== lastActivityDate) {
            updateDoc(userRef, {
              adCount: 0,
              spinCount: 0,
              scratchCount: 0,
              lastActivityDate: today
            });
            setAdCount(0);
            setSpinCount(0);
            setScratchCount(0);
          } else {
            setAdCount(data.adCount || 0);
            setSpinCount(data.spinCount || 0);
            setScratchCount(data.scratchCount || 0);
          }

          // Check if can check in today
          const lastCheckIn = data.lastCheckIn;
          if (!lastCheckIn) {
            setCanCheckIn(true);
          } else {
            const lastDate = new Date(lastCheckIn).toDateString();
            setCanCheckIn(today !== lastDate);
          }
        } else {
          // Initialize user if not exists
          setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            createdAt: new Date().toISOString(),
            coins: 100, // Welcome coins
            lastCheckIn: null,
            lastFreeAdDate: null,
            adCount: 0,
            spinCount: 0,
            scratchCount: 0,
            lastActivityDate: new Date().toDateString()
          }, { merge: true });
        }
        setLoading(false);
      }, (err) => {
        console.error("Coin user snapshot error:", err);
        setLoading(false);
      });

      // Listen to transactions
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
        const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setTransactions(txs);
      }, (err) => {
        console.error("Coin transactions snapshot error:", err);
      });

      return () => {
        unsubscribeUser();
        unsubscribeTransactions();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const earnCoins = useCallback(async (amount: number, description: string) => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        coins: increment(amount)
      });
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.uid,
        amount,
        type: 'earn',
        description,
        createdAt: new Date().toISOString()
      });
      toast.success(`Earned ${amount} coins!`);
    } catch (error) {
      console.error('Error earning coins:', error);
    }
  }, []);

  const spendCoins = useCallback(async (amount: number, description: string) => {
    if (!auth.currentUser) return false;
    
    // Check balance first
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    const currentCoins = userSnap.data()?.coins || 0;
    
    if (currentCoins < amount) {
      toast.error('Insufficient coins!');
      return false;
    }

    try {
      await updateDoc(userRef, {
        coins: increment(-amount)
      });
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.uid,
        amount,
        type: 'spend',
        description,
        createdAt: new Date().toISOString()
      });
      toast.success(`Spent ${amount} coins!`);
      return true;
    } catch (error) {
      console.error('Error spending coins:', error);
      toast.error('Transaction failed');
      return false;
    }
  }, []);

  const checkIn = useCallback(async () => {
    if (!auth.currentUser || !canCheckIn) return;
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        coins: increment(2),
        lastCheckIn: new Date().toISOString()
      });
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.uid,
        amount: 2,
        type: 'earn',
        description: 'Daily Check-in Bonus',
        createdAt: new Date().toISOString()
      });
      toast.success('Daily Bonus Claimed! +2 Coins');
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Failed to claim bonus');
    }
  }, [canCheckIn]);

  const watchAd = useCallback(async () => {
    if (!auth.currentUser || adCount >= 3) {
      toast.error('Daily ad limit reached (3/3)');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        coins: increment(1),
        adCount: increment(1),
        lastActivityDate: new Date().toDateString()
      });
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.uid,
        amount: 1,
        type: 'earn',
        description: 'Watched Video Ad',
        createdAt: new Date().toISOString()
      });
      toast.success('Earned 1 coin from Ad!');
    } catch (error) {
      console.error('Error watching ad:', error);
    }
  }, [adCount]);

  const spinWheel = useCallback(async (amount: number) => {
    if (!auth.currentUser || spinCount >= 10) {
      toast.error('Daily spin limit reached (10/10)');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        coins: increment(amount),
        spinCount: increment(1),
        lastActivityDate: new Date().toDateString()
      });
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.uid,
        amount,
        type: 'earn',
        description: `Lucky Spin Reward: ${amount} coins`,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error spinning wheel:', error);
    }
  }, [spinCount]);

  const scratchCard = useCallback(async (amount: number) => {
    if (!auth.currentUser || scratchCount >= 10) {
      toast.error('Daily scratch limit reached (10/10)');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        coins: increment(amount),
        scratchCount: increment(1),
        lastActivityDate: new Date().toDateString()
      });
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.uid,
        amount,
        type: 'earn',
        description: `Scratch Card Reward: ${amount} coins`,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error scratching card:', error);
    }
  }, [scratchCount]);

  return (
    <CoinContext.Provider value={{ 
      coins, 
      transactions, 
      earnCoins, 
      spendCoins, 
      checkIn, 
      watchAd,
      spinWheel,
      scratchCard,
      canCheckIn, 
      adCount,
      spinCount,
      scratchCount,
      loading 
    }}>
      {children}
    </CoinContext.Provider>
  );
}

export function useCoins() {
  const context = useContext(CoinContext);
  if (context === undefined) {
    throw new Error('useCoins must be used within a CoinProvider');
  }
  return context;
}
