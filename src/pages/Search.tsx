import React, { useState } from 'react';
import { Search as SearchIcon, MapPin, SlidersHorizontal, ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { Category } from '../types';

const CATEGORIES: Category[] = ['Mobiles', 'Cars', 'Bikes', 'Electronics', 'Furniture', 'Property', 'Jobs', 'Services'];

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '' as Category | '',
    minPrice: '',
    maxPrice: ''
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !filters.category) return;

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Find items related to "${query}" ${filters.category ? `in category ${filters.category}` : ''} ${filters.minPrice ? `with min price ${filters.minPrice}` : ''} ${filters.maxPrice ? `with max price ${filters.maxPrice}` : ''} in Mumbai, India. Provide a list of places and what they are known for.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: 19.0760,
                longitude: 72.8777
              }
            }
          }
        }
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      setResults(chunks || []);
      toast.success('Search completed!');
      setShowFilters(false);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to perform AI search');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <header className="sticky top-0 bg-white shadow-sm z-40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <form onSubmit={handleSearch} className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for anything..."
            className="w-full bg-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            autoFocus
          />
        </form>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "p-2 rounded-xl transition-colors",
            showFilters ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
          )}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </header>

      {showFilters && (
        <div className="bg-white border-b border-gray-100 p-4 space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Filters</h3>
            <button onClick={() => setShowFilters(false)}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilters(f => ({ ...f, category: f.category === cat ? '' : cat }))}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    filters.category === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Min Price</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                placeholder="₹ Min"
                className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Max Price</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                placeholder="₹ Max"
                className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="w-full bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all"
          >
            Apply Filters
          </button>
        </div>
      )}

      <main className="p-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse h-24 rounded-2xl" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">AI Recommendations</h3>
            {results.map((chunk, index) => (
              <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-xl">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{chunk.maps?.title || 'Location'}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{chunk.maps?.uri || 'No details available'}</p>
                  {chunk.maps?.uri && (
                    <a 
                      href={chunk.maps.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 text-[10px] font-bold uppercase mt-2 inline-block"
                    >
                      View on Maps
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Search for items</h3>
            <p className="text-gray-500 text-sm">Type what you're looking for to see AI-powered suggestions and local listings.</p>
          </div>
        )}
      </main>
    </div>
  );
}
