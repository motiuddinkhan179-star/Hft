import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Chat, Item } from '../types';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronRight, Search, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

interface ChatWithItem extends Chat {
  item?: Item;
}

export default function ChatsList() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData = await Promise.all(snapshot.docs.map(async (chatDoc) => {
        const data = { id: chatDoc.id, ...chatDoc.data() } as Chat;
        const itemDoc = await getDoc(doc(db, 'items', data.itemId));
        return { ...data, item: itemDoc.exists() ? { id: itemDoc.id, ...itemDoc.data() } as Item : undefined };
      }));
      setChats(chatsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredChats = chats.filter(chat => 
    chat.item?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!auth.currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-white pb-20">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <MessageSquare className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Chats</h1>
        <p className="text-gray-500 text-center mb-8">Login to see your conversations with buyers and sellers.</p>
        <button
          onClick={() => navigate('/profile')}
          className="w-full bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          Login to Chat
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <header className="sticky top-0 bg-white shadow-sm z-40 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Chats</h1>
          <div className="bg-blue-50 px-3 py-1 rounded-full ml-auto">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{chats.length} Active</span>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages or items..."
            className="w-full bg-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </header>

      <main className="p-4 space-y-3">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse h-20 rounded-2xl" />
            ))}
          </div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.id}`)}
              className="w-full bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors group"
            >
              <img 
                src={chat.item?.images[0] || 'https://picsum.photos/seed/osl/100/100'} 
                alt="" 
                className="w-16 h-16 rounded-xl object-cover border border-gray-100 shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{chat.item?.title || 'Unknown Item'}</h3>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {formatDistanceToNow(new Date(chat.updatedAt))} ago
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 mb-1">
                  {chat.lastMessage || 'Start a conversation...'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">₹{chat.item?.price.toLocaleString()}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>
          ))
        ) : (
          <div className="text-center py-20">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No chats yet</h3>
            <p className="text-gray-500 text-sm">When you contact a seller or someone contacts you, the chat will appear here.</p>
          </div>
        )}
      </main>
    </div>
  );
}
