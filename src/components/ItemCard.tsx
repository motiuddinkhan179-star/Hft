import { Heart, MapPin, Zap } from 'lucide-react';
import { Item } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, setDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

interface ItemCardProps {
  item: Item;
}

export default function ItemCard({ item }: ItemCardProps) {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const likeId = `${auth.currentUser.uid}_${item.id}`;
    const unsubscribe = onSnapshot(doc(db, 'likes', likeId), (doc) => {
      setIsLiked(doc.exists());
    });
    return () => unsubscribe();
  }, [item.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      toast.error('Please login to like items');
      return;
    }

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
        
        // Send notification to seller
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

  return (
    <div 
      onClick={() => navigate(`/item/${item.id}`)}
      className={cn(
        "bg-white rounded-xl shadow-sm border overflow-hidden cursor-pointer hover:shadow-md transition-all",
        item.isBoosted ? "border-amber-200 ring-1 ring-amber-100" : "border-gray-100"
      )}
    >
      <div className="relative aspect-square">
        <img 
          src={item.images[0] || 'https://picsum.photos/seed/osl/400/400'} 
          alt={item.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        
        {/* Boosted Badge */}
        {item.isBoosted && (
          <div className="absolute top-2 left-2 bg-amber-400 text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg z-10">
            <Zap className="w-3 h-3 fill-current" />
            <span className="text-[8px] font-black uppercase tracking-widest">Featured</span>
          </div>
        )}

        <button 
          onClick={handleLike}
          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors z-10"
        >
          <Heart className={cn("w-4 h-4 transition-colors", isLiked ? "text-red-600 fill-current" : "text-gray-600")} />
        </button>
        {item.status === 'sold' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Sold
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-lg font-bold text-gray-900">₹{item.price.toLocaleString()}</span>
        </div>
        <h3 className="text-sm text-gray-700 line-clamp-1 mb-2">{item.title}</h3>
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[80px]">{item.location}</span>
          </div>
          <span>{formatDistanceToNow(new Date(item.createdAt))} ago</span>
        </div>
      </div>
    </div>
  );
}
