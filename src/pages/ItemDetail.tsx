import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs, setDoc, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Item, Chat } from '../types';
import { ArrowLeft, Share2, Heart, MapPin, User, MessageCircle, Phone, ChevronRight, ShieldCheck, Trash2, Edit3, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setIsAdmin(user.email === 'khanmohammadahmad591@gmail.com' || user.email === 'khanmohammadahmad123@gmail.com');
    }
  }, []);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'items', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Item;
          const now = new Date();
          
          // Automatic Expiry Logic
          if (data.status === 'active' && data.expiresAt) {
            const expiresAt = new Date(data.expiresAt);
            if (now > expiresAt) {
              await updateDoc(docRef, { status: 'sold' });
              data.status = 'sold';
            }
          }

          // Automatic Deletion Logic
          if (data.deleteAt) {
            const deleteAt = new Date(data.deleteAt);
            if (now > deleteAt) {
              await deleteDoc(docRef);
              toast.error('This ad has expired and been removed');
              navigate('/');
              return;
            }
          }

          setItem({ id: docSnap.id, ...data } as Item);
        } else {
          toast.error('Item not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching item:', error);
        toast.error('Failed to load item');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();

    if (auth.currentUser && id) {
      const likeId = `${auth.currentUser.uid}_${id}`;
      const unsubscribe = onSnapshot(doc(db, 'likes', likeId), (doc) => {
        setIsLiked(doc.exists());
      });
      return () => unsubscribe();
    }
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!item || !auth.currentUser) return;
    const isOwner = item.sellerId === auth.currentUser.uid;
    if (!isOwner && !isAdmin) return;
    
    if (!window.confirm('Are you sure you want to delete this ad?')) return;

    try {
      await deleteDoc(doc(db, 'items', item.id));
      toast.success('Ad deleted successfully');
      navigate(isOwner ? '/my-ads' : '/');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete ad');
    }
  };

  const handleLike = async () => {
    if (!auth.currentUser) {
      toast.error('Please login to like items');
      return;
    }
    if (!item) return;

    const likeId = `${auth.currentUser.uid}_${item.id}`;
    try {
      if (isLiked) {
        await deleteDoc(doc(db, 'likes', likeId));
      } else {
        await setDoc(doc(db, 'likes', likeId), {
          id: likeId,
          userId: auth.currentUser.uid,
          itemId: item.id,
          createdAt: new Date().toISOString()
        });
        
        if (item.sellerId !== auth.currentUser.uid) {
          await addDoc(collection(db, 'notifications'), {
            userId: item.sellerId,
            title: 'Item Liked',
            message: `${auth.currentUser.displayName || 'Someone'} liked your item "${item.title}"`,
            type: 'item_liked',
            read: false,
            link: `/item/${item.id}`,
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Action failed');
    }
  };

  const handleChat = async () => {
    if (!auth.currentUser) {
      toast.error('Please login to chat with the seller');
      return;
    }

    if (auth.currentUser.uid === item?.sellerId) {
      toast.error('You cannot chat with yourself');
      return;
    }

    try {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef, 
        where('itemId', '==', item?.id),
        where('participants', 'array-contains', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      
      let chatId;
      if (!querySnapshot.empty) {
        chatId = querySnapshot.docs[0].id;
      } else {
        const newChat = await addDoc(chatsRef, {
          itemId: item?.id,
          participants: [auth.currentUser.uid, item?.sellerId],
          lastMessage: '',
          updatedAt: new Date().toISOString(),
        });
        chatId = newChat.id;
      }
      
      navigate(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="relative aspect-square bg-black">
        <img 
          src={item.images[0] || 'https://picsum.photos/seed/osl/800/800'} 
          alt={item.title} 
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
              <Share2 className="w-6 h-6" />
            </button>
            <button 
              onClick={handleLike}
              className={cn(
                "p-2 backdrop-blur-md rounded-full transition-colors",
                isLiked ? "bg-red-600 text-white" : "bg-white/20 text-white"
              )}
            >
              <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white px-6 py-6 rounded-b-[40px] shadow-sm border-b border-gray-100 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">₹{item.price.toLocaleString()}</h1>
          <span className="text-xs text-gray-500 font-medium">{formatDistanceToNow(new Date(item.createdAt))} ago</span>
        </div>
        <h2 className="text-lg text-gray-700 mb-4">{item.title}</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>{item.location}</span>
          </div>
          {item.isBoosted && (
            <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg border border-amber-200">
              <Zap className="w-3 h-3 fill-current" />
              <span className="text-[10px] font-black uppercase tracking-widest">Boosted</span>
            </div>
          )}
        </div>

        {/* Seller or Admin Actions */}
        {(auth.currentUser?.uid === item.sellerId || isAdmin) && (
          <div className="mt-6 pt-6 border-t border-gray-100 flex gap-3">
            {auth.currentUser?.uid === item.sellerId && (
              <button 
                onClick={() => navigate(`/edit-item/${item.id}`)}
                className="flex-1 bg-blue-50 text-blue-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit Ad
              </button>
            )}
            <button 
              onClick={handleDelete}
              className="flex-1 bg-red-50 text-red-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {isAdmin && auth.currentUser?.uid !== item.sellerId ? 'Admin Delete' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white px-6 py-6 rounded-[40px] shadow-sm border border-gray-100 mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider text-xs text-gray-500">Description</h3>
        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
      </div>

      <button 
        onClick={() => navigate(`/profile/${item.sellerId}`)}
        className="w-full bg-white px-6 py-6 rounded-[40px] shadow-sm border border-gray-100 mb-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-gray-900">{item.sellerName}</h4>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">View Profile</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
      </button>

      <div className="bg-blue-50/50 px-6 py-4 rounded-[40px] flex items-center gap-3 text-blue-700 text-xs font-bold uppercase tracking-widest mx-4">
        <ShieldCheck className="w-5 h-5" />
        <span>Your safety is our priority</span>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <div className="flex gap-4 max-w-md mx-auto">
          <button 
            onClick={handleChat}
            className="flex-1 bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            Chat
          </button>
          <button className="flex-1 bg-white border-2 border-blue-700 text-blue-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all">
            <Phone className="w-5 h-5" />
            Call
          </button>
        </div>
      </div>
    </div>
  );
}
