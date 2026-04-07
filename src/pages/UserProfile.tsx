import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, setDoc, deleteDoc, addDoc, getCountFromServer, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { User, Item } from '../types';
import ItemCard from '../components/ItemCard';
import { ArrowLeft, User as UserIcon, UserPlus, UserMinus, Star, MessageCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

export default function UserProfile() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User & { isPremium?: boolean } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ followers: 0, following: 0, rating: 0, totalRatings: 0 });

  useEffect(() => {
    if (!uid) return;

    const fetchStats = async () => {
      // Followers count
      const followersQ = query(collection(db, 'following'), where('followedId', '==', uid));
      const followersSnapshot = await getCountFromServer(followersQ);
      
      // Following count
      const followingQ = query(collection(db, 'following'), where('followerId', '==', uid));
      const followingSnapshot = await getCountFromServer(followingQ);

      // Ratings
      const ratingsQ = query(collection(db, 'ratings'), where('targetUserId', '==', uid));
      const ratingsSnapshot = await getDocs(ratingsQ);
      const ratings = ratingsSnapshot.docs.map(doc => doc.data().rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      setStats({
        followers: followersSnapshot.data().count,
        following: followingSnapshot.data().count,
        rating: parseFloat(avgRating.toFixed(1)),
        totalRatings: ratings.length
      });
    };

    fetchStats();

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          setProfile({ uid: userDoc.id, ...userDoc.data() } as any);
        } else {
          // If user doc doesn't exist, we can still show a placeholder or handle it
          console.warn('User profile not found in Firestore');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();

    // Fetch items
    const itemsQ = query(collection(db, 'items'), where('sellerId', '==', uid), orderBy('createdAt', 'desc'));
    const unsubscribeItems = onSnapshot(itemsQ, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item)));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching items:', error);
      setLoading(false);
    });

    // Check following status
    if (auth.currentUser) {
      const followId = `${auth.currentUser.uid}_${uid}`;
      const unsubscribeFollow = onSnapshot(doc(db, 'following', followId), (doc) => {
        setIsFollowing(doc.exists());
      });
      return () => {
        unsubscribeItems();
        unsubscribeFollow();
      };
    }

    return () => unsubscribeItems();
  }, [uid]);

  const handleFollow = async () => {
    if (!auth.currentUser) {
      toast.error('Please login to follow users');
      return;
    }
    if (auth.currentUser.uid === uid) return;

    const followId = `${auth.currentUser.uid}_${uid}`;
    try {
      if (isFollowing) {
        await deleteDoc(doc(db, 'following', followId));
        toast.success('Unfollowed');
      } else {
        await setDoc(doc(db, 'following', followId), {
          id: followId,
          followerId: auth.currentUser.uid,
          followedId: uid,
          createdAt: new Date().toISOString()
        });
        
        // Send notification
        await addDoc(collection(db, 'notifications'), {
          userId: uid,
          title: 'New Follower',
          message: `${auth.currentUser.displayName || 'Someone'} started following you!`,
          type: 'new_follower',
          read: false,
          link: `/profile/${auth.currentUser.uid}`,
          createdAt: new Date().toISOString()
        });
        
        toast.success('Following');
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Action failed');
    }
  };

  const [ratingLoading, setRatingLoading] = useState(false);

  const handleRate = async (value: number) => {
    if (!auth.currentUser) {
      toast.error('Please login to rate users');
      return;
    }
    if (auth.currentUser.uid === uid) {
      toast.error('You cannot rate yourself');
      return;
    }

    setRatingLoading(true);
    const ratingId = `${auth.currentUser.uid}_${uid}`;
    try {
      await setDoc(doc(db, 'ratings', ratingId), {
        id: ratingId,
        fromUserId: auth.currentUser.uid,
        targetUserId: uid,
        rating: value,
        createdAt: new Date().toISOString()
      });
      toast.success('Rating submitted!');
      // Refresh stats
      const ratingsQ = query(collection(db, 'ratings'), where('targetUserId', '==', uid));
      const ratingsSnapshot = await getDocs(ratingsQ);
      const ratings = ratingsSnapshot.docs.map(doc => doc.data().rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      setStats(prev => ({
        ...prev,
        rating: parseFloat(avgRating.toFixed(1)),
        totalRatings: ratings.length
      }));
    } catch (error) {
      console.error('Rating error:', error);
      toast.error('Failed to submit rating');
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  const displayName = profile?.displayName || (items.length > 0 ? items[0].sellerName : 'Anonymous User');

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <header className="sticky top-0 bg-white shadow-sm z-40 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">User Profile</h1>
      </header>

      <div className="bg-white px-6 pt-10 pb-8 rounded-b-[40px] shadow-sm mb-6">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <img 
              src={profile?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`} 
              alt={displayName} 
              className="w-24 h-24 rounded-full border-4 border-blue-50 shadow-md mb-4"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-4 right-0 bg-green-500 w-5 h-5 rounded-full border-2 border-white" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
            {profile?.isPremium && (
              <div className="bg-blue-600 text-white p-1 rounded-full shadow-sm" title="Premium Member">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>
          {profile?.location && (
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">📍 {profile.location}</p>
          )}
          {profile?.bio && (
            <p className="text-gray-600 text-xs mt-2 text-center max-w-xs italic">"{profile.bio}"</p>
          )}
          <div className="flex items-center gap-1 text-yellow-500 mt-1">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-bold text-gray-700">{stats.rating} ({stats.totalRatings} reviews)</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <span className="block text-lg font-bold text-gray-900">{items.length}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Ads</span>
          </div>
          <div className="text-center border-x border-gray-100">
            <span className="block text-lg font-bold text-gray-900">{stats.followers}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Followers</span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-bold text-gray-900">{stats.following}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Following</span>
          </div>
        </div>

        {auth.currentUser?.uid !== uid && (
          <div className="flex gap-3">
            <button
              onClick={handleFollow}
              className={cn(
                "flex-1 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95",
                isFollowing 
                  ? "bg-gray-100 text-gray-700" 
                  : "bg-blue-700 text-white shadow-lg shadow-blue-200"
              )}
            >
              {isFollowing ? <UserMinus className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
            <button
              onClick={() => navigate(`/chats`)}
              className="w-14 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center active:scale-95 transition-all"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>
        )}
        {auth.currentUser?.uid !== uid && (
          <div className="mt-8 pt-8 border-t border-gray-50">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Rate this Seller</h4>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  disabled={ratingLoading}
                  className="p-1 transition-transform active:scale-90"
                >
                  <Star 
                    className={cn(
                      "w-8 h-8 transition-colors",
                      star <= stats.rating ? "text-yellow-400 fill-current" : "text-gray-200"
                    )} 
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <main className="px-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Listings by {displayName}</h3>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ItemCard item={item} />
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
