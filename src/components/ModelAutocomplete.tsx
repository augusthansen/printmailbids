'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface ModelAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  make: string; // The manufacturer to filter by
  placeholder?: string;
  className?: string;
}

export default function ModelAutocomplete({
  value,
  onChange,
  make,
  placeholder = 'Enter model...',
  className = '',
}: ModelAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch model suggestions based on manufacturer and current input
  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    if (!make || make.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Query distinct models from listings that match the manufacturer
      let query = supabase
        .from('listings')
        .select('model')
        .ilike('make', `%${make}%`)
        .not('model', 'is', null)
        .not('model', 'eq', '');

      // If user has typed something, filter by that too
      if (searchTerm && searchTerm.length > 0) {
        query = query.ilike('model', `%${searchTerm}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error('Error fetching model suggestions:', error);
        setSuggestions([]);
        return;
      }

      // Get unique models and sort them
      const uniqueModels = [...new Set(data?.map((d: { model: string | null }) => d.model).filter(Boolean) as string[])];

      // Sort: exact matches first, then starts with, then contains
      const sorted = uniqueModels.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        // Exact match
        if (aLower === searchLower && bLower !== searchLower) return -1;
        if (bLower === searchLower && aLower !== searchLower) return 1;

        // Starts with
        if (aLower.startsWith(searchLower) && !bLower.startsWith(searchLower)) return -1;
        if (bLower.startsWith(searchLower) && !aLower.startsWith(searchLower)) return 1;

        // Alphabetical
        return aLower.localeCompare(bLower);
      });

      setSuggestions(sorted.slice(0, 10)); // Limit to 10 suggestions
    } catch (err) {
      console.error('Error in fetchSuggestions:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [make, supabase]);

  // Debounce the fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showSuggestions) {
        fetchSuggestions(value);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, make, showSuggestions, fetchSuggestions]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          onChange(suggestions[highlightedIndex]);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const handleSelectSuggestion = (model: string) => {
    onChange(model);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => {
          setShowSuggestions(true);
          if (make) {
            fetchSuggestions(value);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      />

      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          <div className="py-1">
            <p className="px-3 py-1 text-xs text-gray-500 border-b">
              Models previously listed for {make}
            </p>
            {suggestions.map((model, index) => (
              <button
                key={model}
                type="button"
                onClick={() => handleSelectSuggestion(model)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${
                  index === highlightedIndex ? 'bg-blue-50' : ''
                }`}
              >
                {model}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Show hint when no suggestions but make is selected */}
      {showSuggestions && !loading && suggestions.length === 0 && make && value.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <p className="px-3 py-2 text-sm text-gray-500 italic">
            No existing models found for &quot;{make}&quot;. Enter your model manually.
          </p>
        </div>
      )}
    </div>
  );
}
