'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

// Comprehensive manufacturers list by category (alphabetically sorted with "Other" at end)
const manufacturersByCategory: Record<string, string[]> = {
  'mailing-fulfillment': [
    'Accufast', 'Astro Machine', 'Bell and Howell', 'BlueCrest', 'Böwe Systec',
    'Buskro', 'CMC', 'Datatech', 'Domino', 'Envelope 1', 'Frama', 'Formax',
    'Francotyp-Postalia (FP)', 'Funai', 'Gunther', 'Hapa', 'Hasler', 'Hefter Systemform',
    'Inserco', 'Intec', 'JBM', 'Kern', 'Kirk-Rudy', 'Longford', 'MCS', 'Mailcrafters',
    'Mailmark', 'Martin Yale', 'Mathias Bäuerle', 'National Presort', 'Neopost/Quadient',
    'Norpak', 'Opex', 'Pfaffle', 'Pinnacle', 'Pitney Bowes', 'Postmatic', 'Prolific',
    'Quadient', 'Rena', 'Salina Vortex', 'Secap', 'Sitma', 'Standard Register',
    'Streamfeeder', 'Sure-Feed', 'Tritek', 'Video Jet', 'Winkler+Dünnebier',
    'Window Book', 'Zipmail', 'Other'
  ],
  'printing': [
    'AB Dick', 'Adast', 'Agfa', 'Akiyama', 'AM Multigraphics', 'Anatol', 'Aquaflex',
    'Aries', 'Atlantic Zeiser', 'Autologic', 'Baldwin', 'basysPrint', 'Brother',
    'Canon', 'Cerutti', 'Colordyne', 'Comco', 'Cron', 'Dainippon Screen', 'Delphax',
    'DigiFlex', 'Domino', 'Drent Goebel', 'Durst', 'EFI', 'Electron', 'Esko',
    'Epson', 'ETI Converting', 'Fischer & Krecke', 'Flexotecnica', 'Fujifilm',
    'Gallus', 'Goss', 'Grafix', 'GWS Printing Systems', 'Halm', 'Hamada', 'Hantscho',
    'Harris', 'Heidelberg', 'HP', 'HP Indigo', 'Inca', 'Iwasaki', 'Jetrix',
    'KBA (Koenig & Bauer)', 'Kodak', 'Komori', 'Konica Minolta', 'Kyocera', 'Labelmen',
    'Lawson', 'Lemaire', 'Linoprint', 'Lüscher', 'M&R', 'Macchingraf', 'MAN Roland',
    'Manroland', 'Mark Andy', 'Markem-Imaje', 'MHM', 'Mimaki', 'Mitsubishi',
    'MPS', 'Muller Martini', 'Mutoh', 'Nilpeter', 'Numa', 'NUR', 'Oce', 'Omet',
    'Omso', 'Panasonic', 'Perfector', 'Presstek', 'PrintFactory', 'Purup-Eskofot',
    'Ricoh', 'RMGT', 'ROQ', 'Roland DG', 'Rotatek', 'Ryobi', 'Sakurai', 'Samsung',
    'Sanwa', 'Schawk', 'Scitex', 'Screen', 'Sharp', 'Shinohara', 'Solna',
    'SPS Technoscreen', 'Stealth', 'Stork', 'Svecia', 'swissQprint', 'Thieme',
    'Timsons', 'Tokyo Kikai', 'Toshiba', 'Uteco', 'Videojet', 'Vutek', 'Windmoeller & Hoelscher',
    'Workhorse', 'Xante', 'Xeikon', 'Xerox', 'Other'
  ],
  'bindery-finishing': [
    'ACCO Brands', 'Akiles', 'Autobond', 'Baum', 'Baumfolder', 'Bielomatik',
    'Bograma', 'Brausse', 'C.P. Bourg', 'Challenge', 'Colter & Peterson', 'Coverbind',
    'CP Bourg', 'Cyklos', 'D&K', 'Dahle', 'Drytac', 'Duplo', 'Eurofold', 'Fastbind',
    'Foldmaster', 'Formax', 'GBC', 'Glunz & Jensen', 'GMP', 'Grafisk', 'GUK',
    'Harris', 'Hefter Systemform', 'Heidelberg', 'Herzog+Heymann', 'Hohner', 'Horizon',
    'Ideal', 'Intimus', 'James Burn', 'KAMA', 'Kluge', 'Kolbus', 'Komfi', 'Laminator.com',
    'Lawson', 'Ledco', 'Lhermite', 'MBM', 'MBO', 'Morgana', 'Muller Martini',
    'Multipli', 'Nagel', 'Neschen', 'Perfecta', 'Pitney Bowes', 'Polar', 'Powis Parker',
    'Prism', 'Renz', 'Rollem', 'Rosback', 'Schneider Senator', 'Scodix', 'Seal',
    'Shoei', 'Spiral', 'Stahl', 'Standard Horizon', 'Steinemann', 'Sterling', 'Sulby',
    'Tamerica', 'Theisen & Bonitz', 'Thermotype', 'Therm-O-Type', 'Triumph', 'Unibind',
    'USI', 'Vijuk', 'Vivid', 'Watkiss', 'Wohlenberg', 'Young Shin', 'Zechini', 'Other'
  ],
  'packaging': [
    '3M-Matic', 'Accraply', 'Agnati', 'All Packaging Machinery', 'ARPAC', 'Asahi',
    'ASKO', 'Automated Packaging Systems', 'Belco', 'Berhalter', 'BestPack', 'Beumer',
    'BHS', 'Bielloni', 'Bobst', 'Bosch', 'Brausse', 'CAM', 'Campbell Wrapper',
    'Carint', 'Cariba', 'Cartopak', 'CI Flexo', 'Climax', 'Coating Excellence',
    'Combi', 'Comexi', 'Conflex', 'Cryovac', 'DCM', 'Delkor', 'Dong Fang', 'Douglas',
    'Eastey', 'Econocorp', 'EMBA', 'Eterna', 'Excellon', 'Falcon', 'Fallas', 'FMC',
    'Fosber', 'Giave', 'Graphic Packaging', 'Great Lakes', 'Hartness', 'Heidelberg',
    'Herma', 'HMC', 'Isowa', 'Jagenberg', 'Jones', 'KAMA', 'KBA', 'Kliklok',
    'Koenig & Bauer', 'Kosme', 'Krones', 'Lantech', 'Latitude', 'Loveshaw', 'Marden Edwards',
    'Marquip', 'Martin', 'Masterwork', 'MGS', 'Multivac', 'Norden', 'Nordmeccanica',
    'Ossid', 'P.E. Labellers', 'PCMC', 'PDC', 'Pearson', 'Polypack', 'R.A. Jones',
    'Rovema', 'Sacmi', 'Sanwa', 'SBL', 'Schneider', 'Sealed Air', 'Shanklin',
    'Sidel', 'Sigpack', 'Sitma', 'Soma', 'SUN Automation', 'TCY', 'Texwrap',
    'Thiele', 'Triangle', 'ULMA', 'Uteco', 'Vidmar', 'Wexxar', 'Windmoeller & Hoelscher',
    'Wrap-Ade', 'Yawa', 'Young Shin', 'Yupack', 'Zambelli', 'Other'
  ],
  'material-handling': [
    'Autoquip', 'Barrett', 'Beumer', 'Big Joe', 'Bishamon', 'Blue Giant', 'BT',
    'Budgit', 'CAM', 'Cascade', 'Caterpillar', 'Clark', 'CM', 'Coffing', 'Combilift',
    'Crown', 'Daifuku', 'Dematic', 'Demag', 'Doosan', 'Dorner', 'Drexel', 'Eaton',
    'FlexLink', 'Frazier', 'Genie', 'Gorbel', 'Harrington', 'Heli', 'Honeywell',
    'Husky', 'Hyster', 'Hytrol', 'Intelligrated', 'Interlake Mecalux', 'Interroll',
    'JLG', 'Jungheinrich', 'Kion', 'Komatsu', 'Konecranes', 'Landoll', 'Lift-Rite',
    'Linde', 'Little Giant', 'Lonking', 'Marco', 'Mitsubishi', 'Moffett', 'Nissan',
    'Omega', 'Pallet Mule', 'Penco', 'Presto', 'Prime Mover', 'Rapistan', 'Raymond',
    'Relius', 'Ridg-U-Rak', 'Robur', 'Siemens', 'Southworth', 'SSI Schaefer',
    'Steel King', 'Still', 'Sumitomo', 'Swisslog', 'Taylor-Dunn', 'TCM', 'TGW',
    'Toyota', 'Uline', 'Unarco', 'Unicarriers', 'Vanderlande', 'Vestil', 'Wesco',
    'Wildeck', 'Yale', 'Other'
  ],
  'parts-supplies': [
    'Aftermarket', 'Agfa', 'Bell and Howell', 'Bobst', 'Canon', 'Generic/Compatible',
    'Heidelberg', 'HP', 'Kodak', 'Komori', 'Konica Minolta', 'Manroland', 'MBO',
    'Muller Martini', 'OEM Parts', 'Pitney Bowes', 'Polar', 'Rebuilt/Refurbished',
    'Ricoh', 'Xerox', 'Other'
  ]
};

// Get all unique manufacturers (alphabetically sorted with "Other" at end)
const allManufacturers = [...new Set(Object.values(manufacturersByCategory).flat())]
  .filter(m => m !== 'Other')
  .sort()
  .concat(['Other']);

interface MakeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  category?: string; // Optional category to filter by
  placeholder?: string;
  className?: string;
}

export default function MakeAutocomplete({
  value,
  onChange,
  category,
  placeholder = 'Enter manufacturer...',
  className = '',
}: MakeAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Get predefined manufacturers for the selected category
  const predefinedManufacturers = useMemo(() => {
    if (category && manufacturersByCategory[category]) {
      return manufacturersByCategory[category];
    }
    return allManufacturers;
  }, [category]);

  // Fetch make suggestions based on current input
  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    setLoading(true);
    try {
      const searchLower = searchTerm.toLowerCase();

      // Filter predefined manufacturers
      let filtered = predefinedManufacturers.filter(m => {
        if (!searchTerm) return true;
        return m.toLowerCase().includes(searchLower);
      });

      // Sort: exact matches first, then starts with, then contains, "Other" always last
      filtered = filtered.sort((a, b) => {
        // "Other" always at the end
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;

        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();

        // Exact match
        if (aLower === searchLower && bLower !== searchLower) return -1;
        if (bLower === searchLower && aLower !== searchLower) return 1;

        // Starts with
        if (aLower.startsWith(searchLower) && !bLower.startsWith(searchLower)) return -1;
        if (bLower.startsWith(searchLower) && !aLower.startsWith(searchLower)) return 1;

        // Alphabetical
        return aLower.localeCompare(bLower);
      });

      setSuggestions(filtered.slice(0, 15)); // Show up to 15 suggestions
    } catch (err) {
      console.error('Error in fetchSuggestions:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [predefinedManufacturers]);

  // Debounce the fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showSuggestions) {
        fetchSuggestions(value);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, category, showSuggestions, fetchSuggestions]);

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

  const handleSelectSuggestion = (make: string) => {
    onChange(make);
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
          fetchSuggestions(value);
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
              Select manufacturer
            </p>
            {suggestions.map((make, index) => (
              <button
                key={make}
                type="button"
                onClick={() => handleSelectSuggestion(make)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${
                  index === highlightedIndex ? 'bg-blue-50' : ''
                }`}
              >
                {make}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Show hint when no suggestions */}
      {showSuggestions && !loading && suggestions.length === 0 && value.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <p className="px-3 py-2 text-sm text-gray-500 italic">
            No existing manufacturers found. Enter your manufacturer manually.
          </p>
        </div>
      )}
    </div>
  );
}
