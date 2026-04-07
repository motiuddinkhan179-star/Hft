import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDocFromServer } from 'firebase/firestore';
import Home from './pages/Home';
import Search from './pages/Search';
import Sell from './pages/Sell';
import Profile from './pages/Profile';
import ItemDetail from './pages/ItemDetail';
import Chat from './pages/Chat';
import ChatsList from './pages/ChatsList';
import BottomNav from './components/BottomNav';
import Notifications from './pages/Notifications';
import MyAds from './pages/MyAds';
import Favorites from './pages/Favorites';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import HelpSupport from './pages/HelpSupport';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CreateDokaan from './pages/CreateDokaan';
import SellerPanel from './pages/SellerPanel';
import CoinsPage from './pages/Coins';
import EditItem from './pages/EditItem';
import SpinWheel from './pages/games/SpinWheel';
import ScratchCard from './pages/games/ScratchCard';
import WatchAd from './pages/games/WatchAd';
import SplashScreen from './components/SplashScreen';

import { NotificationProvider } from './contexts/NotificationContext';
import { LocationProvider } from './contexts/LocationContext';
import { CoinProvider } from './contexts/CoinContext';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    // Test Firestore connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firestore connection successful.");
      } catch (error: any) {
        console.error("Firestore connection test failed:", error);
        if (error.message.includes('the client is offline') || error.message.includes('unavailable')) {
          toast.error("Connection failed. Please check your internet or Firebase setup.");
        }
      }
    };
    testConnection();

    // Ensure splash screen shows for at least 2.5 seconds
    const splashTimer = setTimeout(() => {
      setSplashFinished(true);
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setTimeout(() => {
        setUser(user);
        if (user) {
          // Ensure user profile exists in Firestore
          setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            createdAt: new Date().toISOString()
          }, { merge: true }).catch(err => {
            console.error('Error saving user profile:', err);
            if (err.message.includes('permission-denied')) {
              toast.error("Permission denied. Please check your account.");
            } else if (err.message.includes('unavailable')) {
              toast.error("Firestore is currently unavailable.");
            }
          });
        }
        setAuthLoading(false);
      }, 0);
    });

    return () => {
      clearTimeout(splashTimer);
      unsubscribe();
    };
  }, []);

  if (authLoading || !splashFinished) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <LocationProvider>
        <CoinProvider>
          <NotificationProvider>
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative overflow-hidden">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/sell" element={<Sell />} />
                <Route path="/chats" element={<ChatsList />} />
                <Route path="/chat/:id" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/item/:id" element={<ItemDetail />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/my-ads" element={<MyAds />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/profile/:uid" element={<UserProfile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<HelpSupport />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/create-dokaan" element={<CreateDokaan />} />
                <Route path="/seller-panel" element={<SellerPanel />} />
                <Route path="/coins" element={<CoinsPage />} />
                <Route path="/edit-item/:id" element={<EditItem />} />
                <Route path="/games/spin" element={<SpinWheel />} />
                <Route path="/games/scratch" element={<ScratchCard />} />
                <Route path="/games/watch-ad" element={<WatchAd />} />
              </Routes>
              <BottomNav />
              <Toaster position="top-center" />
            </div>
          </NotificationProvider>
        </CoinProvider>
      </LocationProvider>
    </Router>
  );
}
