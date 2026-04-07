import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface LocationContextType {
  userLocation: { lat: number; lng: number; name: string } | null;
  radius: number;
  setRadius: (radius: number) => void;
  detectLocation: () => Promise<void>;
  setLocationName: (name: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [radius, setRadius] = useState(50); // Default 50km

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('osl_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserLocation(parsed.location);
        setRadius(parsed.radius || 50);
      } catch (e) {
        console.error('Failed to parse saved location', e);
      }
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (userLocation) {
      localStorage.setItem('osl_location', JSON.stringify({ location: userLocation, radius }));
    }
  }, [userLocation, radius]);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          let name = 'Current Location';
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await res.json();
            
            const addr = data.address;
            // Try to get the most specific name possible
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

          setUserLocation({ lat, lng, name });
          toast.success(`Location: ${name}`);
          resolve();
        },
        (err) => {
          console.error(err);
          let msg = 'Failed to get location';
          if (err.code === 1) msg = 'Location permission denied';
          if (err.code === 2) msg = 'Location unavailable';
          if (err.code === 3) msg = 'Location request timed out';
          toast.error(msg);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }, []);

  const setLocationName = (name: string) => {
    if (userLocation) {
      setUserLocation({ ...userLocation, name });
    }
  };

  return (
    <LocationContext.Provider value={{ userLocation, radius, setRadius, detectLocation, setLocationName }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
