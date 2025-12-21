'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressComponents {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: AddressComponents) => void;
  placeholder?: string;
  className?: string;
}

declare global {
  interface Window {
    google: typeof google;
    initGoogleMapsCallback?: () => void;
  }
}

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Start typing an address...',
  className = '',
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load Google Maps Script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn('Google Maps API key not found. Address autocomplete will be disabled.');
      return;
    }

    // Check if already loaded
    if (window.google?.maps?.places) {
      setIsScriptLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Wait for it to load
      existingScript.addEventListener('load', () => setIsScriptLoaded(true));
      return;
    }

    // Load the script
    setIsLoading(true);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsScriptLoaded(true);
      setIsLoading(false);
    };

    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove the script on unmount as other components might use it
    };
  }, []);

  // Initialize autocomplete
  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places || autocompleteRef.current) {
      return;
    }

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: ['us', 'ca', 'mx'] },
      fields: ['address_components', 'formatted_address'],
      types: ['address'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();

      if (!place?.address_components) {
        return;
      }

      // Parse address components
      const addressData: AddressComponents = {
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
      };

      let streetNumber = '';
      let streetName = '';

      for (const component of place.address_components) {
        const type = component.types[0];

        switch (type) {
          case 'street_number':
            streetNumber = component.long_name;
            break;
          case 'route':
            streetName = component.long_name;
            break;
          case 'subpremise':
            addressData.address_line2 = component.long_name;
            break;
          case 'locality':
            addressData.city = component.long_name;
            break;
          case 'administrative_area_level_1':
            addressData.state = component.short_name;
            break;
          case 'postal_code':
            addressData.postal_code = component.long_name;
            break;
          case 'country':
            addressData.country = component.short_name;
            break;
        }
      }

      // Combine street number and name
      addressData.address_line1 = streetNumber && streetName
        ? `${streetNumber} ${streetName}`
        : streetName || streetNumber;

      // Update the input value
      onChange(addressData.address_line1);

      // Notify parent of the full address
      onAddressSelect(addressData);
    });
  }, [onChange, onAddressSelect]);

  // Initialize when script loads
  useEffect(() => {
    if (isScriptLoaded && inputRef.current) {
      initializeAutocomplete();
    }
  }, [isScriptLoaded, initializeAutocomplete]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
      )}
    </div>
  );
}
