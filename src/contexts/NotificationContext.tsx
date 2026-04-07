import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { toast } from 'react-hot-toast';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'message' | 'system' | 'item_sold';
  read: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification sound URL (a simple ping/pop sound)
const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(new Audio(NOTIFICATION_SOUND_URL));
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setTimeout(() => {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        isFirstLoad.current = true;
      }, 0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));

      // Check for new unread notifications added since last snapshot
      if (!isFirstLoad.current && !snapshot.metadata.fromCache) {
        const hasNewUnread = snapshot.docChanges().some(change => 
          change.type === 'added' && !(change.doc.data() as any).read
        );

        if (hasNewUnread) {
          audioRef.current.play().catch(err => console.error('Error playing notification sound:', err));
          const newest = newNotifications.find(n => !n.read);
          if (newest) {
            toast(newest.title, {
              icon: '🔔',
              duration: 4000,
            });
          }
        }
      }

      // Wrap state updates in setTimeout to ensure they happen after the current render cycle
      setTimeout(() => {
        setNotifications(newNotifications);
        setUnreadCount(newNotifications.filter(n => !n.read).length);
        setLoading(false);
        isFirstLoad.current = false;
      }, 0);
    }, (error) => {
      console.error('Notification listener error:', error);
      setTimeout(() => setLoading(false), 0);
    });

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
