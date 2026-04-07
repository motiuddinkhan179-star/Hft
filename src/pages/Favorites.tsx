import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Item } from '../types';
import ItemCard from '../components/ItemCard';
import { ArrowLeft, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Favorites() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'likes'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const itemsData = await Promise.all(snapshot.docs.map(async (likeDoc) => {
        const data = likeDoc.data();
        const itemDoc = await getDoc(doc(db, 'items', data.itemId));
        return itemDoc.exists() ? { id: itemDoc.id, ...itemDoc.data() } as Item : null;
      }));
      setItems(itemsData.filter(item => item !== null) as Item[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <header className="sticky top-0 bg-white shadow-sm z-40 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Favorites</h1>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-xl aspect-[3/4]" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <ItemCard item={item} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-500 text-sm mb-6">Like items you're interested in and they'll appear here.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-200"
            >
              Start Browsing
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
