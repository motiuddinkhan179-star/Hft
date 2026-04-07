import { Smartphone, Car, Monitor, Home, Sofa, Shirt, Bike, Briefcase, Settings } from 'lucide-react';
import { Category, CATEGORIES } from '../types';
import { cn } from '../lib/utils';

const categoryIcons: Record<Category, any> = {
  'Mobiles': Smartphone,
  'Cars': Car,
  'Electronics': Monitor,
  'Property': Home,
  'Furniture': Sofa,
  'Fashion': Shirt,
  'Bikes': Bike,
  'Jobs': Briefcase,
  'Services': Settings,
};

interface CategoryBarProps {
  selectedCategory?: Category;
  onSelect?: (category: Category) => void;
}

export default function CategoryBar({ selectedCategory, onSelect }: CategoryBarProps) {
  return (
    <div className="flex overflow-x-auto gap-4 px-4 py-4 scrollbar-hide bg-white border-b border-gray-100">
      {CATEGORIES.map((category) => {
        const Icon = categoryIcons[category];
        const isSelected = selectedCategory === category;
        
        return (
          <button
            key={category}
            onClick={() => onSelect?.(category)}
            className={cn(
              "flex flex-col items-center gap-2 min-w-[70px] transition-all",
              isSelected ? "scale-110" : "hover:scale-105"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm",
              isSelected ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
            )}>
              <Icon className="w-6 h-6" />
            </div>
            <span className={cn(
              "text-[10px] font-semibold whitespace-nowrap",
              isSelected ? "text-blue-700" : "text-gray-600"
            )}>
              {category}
            </span>
          </button>
        );
      })}
    </div>
  );
}
