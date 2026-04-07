import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CATEGORIES, Category, Item } from '../types';
import { Camera, X, MapPin, IndianRupee, Tag, FileText, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function EditItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '' as Category | '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    images: [] as string[],
  });

  useEffect(() => {
    const fetchItem = async () => {
      if (!id || !auth.currentUser) return;
      try {
        const docRef = doc(db, 'items', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Item;
          if (data.sellerId !== auth.currentUser.uid) {
            toast.error('You are not authorized to edit this ad');
            navigate('/');
            return;
          }
          setFormData({
            title: data.title,
            description: data.description,
            price: data.price.toString(),
            category: data.category as Category,
            location: data.location,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            images: data.images,
          });
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
  }, [id, navigate]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        let name = 'Current Location';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          const data = await res.json();
          const addr = data.address;
          const specific = addr.suburb || addr.neighbourhood || addr.city_district || addr.village || addr.town;
          const city = addr.city || addr.state;
          
          if (specific && city && specific !== city) {
            name = `${specific}, ${city}`;
          } else {
            name = specific || city || 'Current Location';
          }
        } catch (e) {
          console.error('Reverse geocoding failed', e);
        }

        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          location: name
        }));
        toast.success(`Location detected: ${name}`);
      },
      (error) => {
        console.error('Error detecting location:', error);
        toast.error('Failed to detect location');
      }
    );
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 1024 * 1024) {
        toast.error('Image size should be less than 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !auth.currentUser) return;

    if (!formData.category || !formData.title || !formData.price) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, 'items', id);
      await updateDoc(docRef, {
        ...formData,
        price: parseFloat(formData.price),
        updatedAt: new Date().toISOString(),
      });

      toast.success('Ad updated successfully!');
      navigate(`/item/${id}`);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <header className="sticky top-0 bg-white shadow-sm z-40 px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Edit Ad</h1>
        <div className="w-8" />
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Image Upload */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 block uppercase tracking-wider">Photos</label>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageAdd}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 min-w-[96px] border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Camera className="w-8 h-8 mb-1" />
              <span className="text-[10px] font-bold">Add Photo</span>
            </button>
            {formData.images.map((url, index) => (
              <div key={index} className="relative w-24 h-24 min-w-[96px]">
                <img src={url} alt="" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Tag className="w-3 h-3" /> Category
            </label>
            <select
              value={formData.category}
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              required
            >
              <option value="">Select Category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3 h-3" /> Ad Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. iPhone 13 Pro Max"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3 h-3" /> Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Include condition, features, reason for selling..."
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <IndianRupee className="w-3 h-3" /> Price
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="Set a price"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><MapPin className="w-3 h-3" /> Location</span>
              <button 
                type="button" 
                onClick={detectLocation}
                className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline"
              >
                Detect Location
              </button>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Bandra, Mumbai"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={saving}
          className={cn(
            "w-full bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all",
            saving ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-800 hover:shadow-blue-300"
          )}
        >
          {saving ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Updating Ad...</span>
            </div>
          ) : (
            'Save Changes'
          )}
        </motion.button>
      </form>
    </div>
  );
}
