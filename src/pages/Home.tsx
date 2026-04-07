import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Item, Category } from '../types';
import Header from '../components/Header';
import CategoryBar from '../components/CategoryBar';
import ItemCard from '../components/ItemCard';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import { cn } from '../lib/utils';

// Haversine formula to calculate distance in km
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [showRadiusFilter, setShowRadiusFilter] = useState(false);
  const { userLocation, radius, setRadius } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let q = query(collection(db, 'items'), where('status', '==', 'active'), orderBy('createdAt', 'desc'), limit(100));
    
    if (selectedCategory) {
      q = query(
        collection(db, 'items'), 
        where('status', '==', 'active'),
        where('category', '==', selectedCategory),
        orderBy('createdAt', 'desc'), 
        limit(100)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      // Sort: Boosted first, then by date
      const sorted = [...itemsData].sort((a, b) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setItems(sorted);
      setLoading(false);
    }, (error) => {
      console.error("Home items fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedCategory]);

  useEffect(() => {
    if (userLocation) {
      const filtered = items.filter(item => {
        if (!item.latitude || !item.longitude) return true; 
        const dist = getDistance(userLocation.lat, userLocation.lng, item.latitude, item.longitude);
        return dist <= radius;
      });
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [items, userLocation, radius]);

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <Header />
      <CategoryBar 
        selectedCategory={selectedCategory} 
        onSelect={(cat) => setSelectedCategory(prev => prev === cat ? undefined : cat)} 
      />
      
      <main className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {selectedCategory ? `${selectedCategory} Listings` : 'Fresh Recommendations'}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-xl aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ItemCard item={item} />
              </motion.div>
            ))}
          </div>
        )}

        {items.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📦</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500 text-sm">Be the first to list something in your area!</p>
          </div>
        )}
      </main>
    </div>
  );
}
