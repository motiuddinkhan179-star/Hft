import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { ArrowLeft, Bell, Check, Trash2, MessageSquare, Info, ShoppingBag } from 'lucide-react';
import { doc, updateDoc, deleteDoc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, loading } = useNotifications();

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!auth.currentUser) return;
    try {
      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter(n => !n.read);
      unreadNotifications.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
      toast.success('All marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'item_sold': return <ShoppingBag className="w-5 h-5 text-green-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <header className="sticky top-0 bg-white shadow-sm z-40 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        </div>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead}
            className="text-blue-600 text-xs font-bold uppercase tracking-wider hover:underline"
          >
            Mark all read
          </button>
        )}
      </header>

      <main className="p-4 space-y-3">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse h-24 rounded-2xl" />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <div 
              key={notification.id}
              className={cn(
                "bg-white p-4 rounded-2xl shadow-sm border transition-all relative group",
                notification.read ? "border-gray-100 opacity-80" : "border-blue-100 bg-blue-50/30"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-2.5 rounded-xl shrink-0",
                  notification.read ? "bg-gray-100" : "bg-blue-100"
                )}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0" onClick={() => {
                  if (!notification.read) markAsRead(notification.id);
                  if (notification.link) navigate(notification.link);
                }}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={cn("text-sm font-bold truncate", notification.read ? "text-gray-700" : "text-gray-900")}>
                      {notification.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(notification.createdAt))} ago
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {notification.message}
                  </p>
                </div>
              </div>
              
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.read && (
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    className="p-1.5 bg-white shadow-sm rounded-lg text-blue-600 hover:bg-blue-50"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(notification.id)}
                  className="p-1.5 bg-white shadow-sm rounded-lg text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500 text-sm">We'll notify you when someone messages you or your ad gets a like.</p>
          </div>
        )}
      </main>
    </div>
  );
}
