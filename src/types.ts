export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  location?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  coins: number;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  location: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  status: 'active' | 'sold';
  isBoosted?: boolean;
  boostDays?: number;
  boostExpiresAt?: string;
  expiresAt?: string;
  deleteAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend';
  description: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  participants: string[];
  itemId: string;
  lastMessage: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export type Category = 'Mobiles' | 'Cars' | 'Electronics' | 'Property' | 'Furniture' | 'Fashion' | 'Bikes' | 'Jobs' | 'Services';

export const CATEGORIES: Category[] = [
  'Mobiles', 'Cars', 'Electronics', 'Property', 'Furniture', 'Fashion', 'Bikes', 'Jobs', 'Services'
];
