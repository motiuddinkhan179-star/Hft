import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Phone, Mail, HelpCircle, ChevronRight, Search, FileText, Shield, AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function HelpSupport() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);

  const faqs = [
    { 
      icon: HelpCircle, 
      label: 'How to buy an item?', 
      desc: 'Learn the basics of purchasing',
      content: 'To buy an item, browse the listings, click on an item you like, and use the "Chat" button to contact the seller. You can negotiate the price and arrange a meeting place.'
    },
    { 
      icon: FileText, 
      label: 'Selling guidelines', 
      desc: 'Rules for listing your items',
      content: 'When selling, ensure your photos are clear, descriptions are accurate, and prices are fair. Avoid listing prohibited items like weapons, drugs, or illegal services.'
    },
    { 
      icon: Shield, 
      label: 'Safety tips', 
      desc: 'Stay safe while trading',
      content: 'Always meet in public places, bring a friend if possible, and inspect the item before paying. Never share your OTP or bank details with anyone.'
    },
    { 
      icon: AlertTriangle, 
      label: 'Report a problem', 
      desc: 'Let us know if something is wrong',
      content: 'If you encounter a scammer or a suspicious listing, use the "Report" button on the item page or contact our support team via email at support@osl.com.'
    },
  ];

  const handleContact = (type: 'chat' | 'call' | 'email') => {
    switch (type) {
      case 'chat':
        navigate('/chats');
        break;
      case 'call':
        window.location.href = 'tel:+919876543210';
        break;
      case 'email':
        window.location.href = 'mailto:support@osl.com';
        break;
    }
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <header className="sticky top-0 bg-white shadow-sm z-40 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Help & Support</h1>
      </header>

      <main className="p-4 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white rounded-2xl pl-12 pr-4 py-4 text-sm shadow-sm border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button 
            onClick={() => handleContact('chat')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <div className="bg-blue-50 p-3 rounded-xl">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-900 uppercase">Chat</span>
          </button>
          <button 
            onClick={() => handleContact('call')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <div className="bg-green-50 p-3 rounded-xl">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-900 uppercase">Call</span>
          </button>
          <button 
            onClick={() => handleContact('email')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <div className="bg-purple-50 p-3 rounded-xl">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-900 uppercase">Email</span>
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-2">Common Questions</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {faqs.filter(f => f.label.toLowerCase().includes(searchQuery.toLowerCase())).map((item, index) => (
              <div key={index}>
                <button
                  onClick={() => setSelectedFaq(selectedFaq === index ? null : index)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group"
                >
                  <div className="bg-gray-50 p-3 rounded-2xl group-hover:bg-gray-100 transition-colors">
                    <item.icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-900 text-sm">{item.label}</h3>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{item.desc}</p>
                  </div>
                  <ChevronRight className={cn("w-5 h-5 text-gray-300 transition-transform", selectedFaq === index && "rotate-90")} />
                </button>
                <AnimatePresence>
                  {selectedFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-gray-50/50"
                    >
                      <p className="p-5 text-xs text-gray-600 leading-relaxed">
                        {item.content}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-700 p-6 rounded-[32px] shadow-xl shadow-blue-200 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Still need help?</h3>
            <p className="text-blue-100 text-sm mb-4">Our support team is available 24/7 to assist you with any issues.</p>
            <button 
              onClick={() => handleContact('email')}
              className="bg-white text-blue-700 font-bold px-6 py-2.5 rounded-xl text-sm active:scale-95 transition-all"
            >
              Contact Support
            </button>
          </div>
          <HelpCircle className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-600/30 -rotate-12" />
        </div>
      </main>
    </div>
  );
}
