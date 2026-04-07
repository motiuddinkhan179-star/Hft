import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Message, Chat as ChatType, Item } from '../types';
import { ArrowLeft, Send, Phone, MoreVertical, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<ChatType | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    const fetchChatAndItem = async () => {
      try {
        const chatDoc = await getDoc(doc(db, 'chats', id));
        if (chatDoc.exists()) {
          const chatData = { id: chatDoc.id, ...chatDoc.data() } as ChatType;
          setChat(chatData);
          
          const itemDoc = await getDoc(doc(db, 'items', chatData.itemId));
          if (itemDoc.exists()) {
            setItem({ id: itemDoc.id, ...itemDoc.data() } as Item);
          }
        } else {
          toast.error('Chat not found');
          navigate('/chats');
        }
      } catch (error) {
        console.error('Error fetching chat:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatAndItem();

    const q = query(
      collection(db, `chats/${id}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(messagesData);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [id, navigate]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !id || !auth.currentUser) return;

    const text = inputText.trim();
    setInputText('');

    try {
      await addDoc(collection(db, `chats/${id}/messages`), {
        chatId: id,
        senderId: auth.currentUser.uid,
        text,
        createdAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, 'chats', id), {
        lastMessage: text,
        updatedAt: new Date().toISOString(),
      });

      // Send notification to recipient
      const recipientId = chat?.participants.find(p => p !== auth.currentUser?.uid);
      if (recipientId) {
        await addDoc(collection(db, 'notifications'), {
          userId: recipientId,
          title: 'New Message',
          message: `${auth.currentUser.displayName || 'Someone'} sent you a message: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
          type: 'message',
          read: false,
          link: `/chat/${id}`,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
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
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="sticky top-0 bg-white shadow-sm z-40 px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <img 
              src={item?.images[0] || 'https://picsum.photos/seed/osl/100/100'} 
              alt="" 
              className="w-10 h-10 rounded-xl object-cover border border-gray-100 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-sm font-bold text-gray-900 line-clamp-1">{item?.title}</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">₹{item?.price.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-full text-blue-600">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="bg-blue-50/50 px-4 py-3 flex items-center justify-center gap-2 text-blue-700 text-[10px] font-bold uppercase tracking-widest border-b border-blue-100">
        <ShieldCheck className="w-4 h-4" />
        <span>Stay safe: Never pay in advance</span>
      </div>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === auth.currentUser?.uid;
          return (
            <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
              <div className={cn(
                "max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm",
                isMe ? "bg-blue-700 text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
              )}>
                {msg.text}
              </div>
              <span className="text-[9px] text-gray-400 mt-1 font-medium">
                {formatDistanceToNow(new Date(msg.createdAt))} ago
              </span>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </main>

      <footer className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 max-w-md mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={cn(
              "p-3.5 rounded-2xl shadow-lg transition-all active:scale-95",
              inputText.trim() ? "bg-blue-700 text-white shadow-blue-200" : "bg-gray-100 text-gray-400"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
