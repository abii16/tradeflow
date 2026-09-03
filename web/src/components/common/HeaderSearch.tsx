import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Package, FileText, Truck, MapPin, ArrowUpRight, Scale, Calculator } from 'lucide-react';

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Loads & Shipments' | 'Settlements & Waybills' | 'Carriers' | 'Pages & Modules';
  path: string;
  icon: any;
}

const SEARCH_DATABASE: SearchItem[] = [
  // Loads & Shipments
  {
    id: 'TF-LOAD-8821',
    title: 'TF-LOAD-8821 • 40T Structural Steel',
    subtitle: 'Djibouti → Dire Dawa • Active Bidding',
    category: 'Loads & Shipments',
    path: '/shipper/bids',
    icon: Package,
  },
  {
    id: 'TF-LOAD-8819',
    title: 'TF-LOAD-8819 • 25T Coffee Beans',
    subtitle: 'Modjo → Djibouti • In Transit',
    category: 'Loads & Shipments',
    path: '/shipper/bids',
    icon: Package,
  },
  {
    id: 'TF-LOAD-8812',
    title: 'TF-LOAD-8812 • 18T Textile Goods',
    subtitle: 'Djibouti → Addis Ababa • Completed',
    category: 'Loads & Shipments',
    path: '/shipper/bids',
    icon: Package,
  },
  {
    id: 'SHP-9021-DJM',
    title: 'SHP-9021-DJM • Active Live Shipment',
    subtitle: 'A1 Highway, Near Awash • ETA 14:30 EAT',
    category: 'Loads & Shipments',
    path: '/shipper/operations',
    icon: Truck,
  },

  // Settlements & Waybills
  {
    id: 'WB-902-A',
    title: 'WB-902-A • Fertilizer Urea 40.5 MT',
    subtitle: 'Abyssinia Heavy • ETB 329,800 • PoD Signed',
    category: 'Settlements & Waybills',
    path: '/finance/settlements',
    icon: FileText,
  },
  {
    id: 'WB-903-B',
    title: 'WB-903-B • Steel Billets 38.0 MT',
    subtitle: 'TransHorn Logistics • ETB 232,800 • PoD Signed',
    category: 'Settlements & Waybills',
    path: '/finance/settlements',
    icon: FileText,
  },
  {
    id: 'WB-899-C',
    title: 'WB-899-C • Containers 2x20ft 44.0 MT',
    subtitle: 'BlueNile Freighters • ETB 562,600 • Released',
    category: 'Settlements & Waybills',
    path: '/finance/ledger',
    icon: FileText,
  },
  {
    id: 'WB-875-D',
    title: 'WB-875-D • Demurrage Delay Dispute',
    subtitle: 'Modjo Dry Port Gate 3 • ETB 45,000 In Review',
    category: 'Settlements & Waybills',
    path: '/finance/disputes',
    icon: Scale,
  },

  // Carriers
  {
    id: 'carrier-transhorn',
    title: 'TransHorn Logistics PLC',
    subtitle: 'Rating 4.9 ★ • Class A • 0920-114-550',
    category: 'Carriers',
    path: '/shipper/bids',
    icon: Truck,
  },
  {
    id: 'carrier-abyssinia',
    title: 'Abyssinia Heavy Logistics',
    subtitle: 'Driver: Kassahun Bekele (ETH-4592) • 0911-238-892',
    category: 'Carriers',
    path: '/finance/settlements',
    icon: Truck,
  },
  {
    id: 'carrier-bluenile',
    title: 'BlueNile Freighters',
    subtitle: 'Rating 4.7 ★ • Class B+ • 0933-771-002',
    category: 'Carriers',
    path: '/shipper/bids',
    icon: Truck,
  },

  // Pages & Modules
  {
    id: 'page-spot-pricing',
    title: 'Spot Pricing Calculator Engine',
    subtitle: 'Dynamic rate calculation (FR-04)',
    category: 'Pages & Modules',
    path: '/finance/spot-pricing',
    icon: Calculator,
  },
  {
    id: 'page-telematics',
    title: 'Corridor Telematics & Live Map',
    subtitle: 'GPS tracking Djibouti → Galafi → Modjo',
    category: 'Pages & Modules',
    path: '/shipper/telematics',
    icon: MapPin,
  },
  {
    id: 'page-customs',
    title: 'Digital Customs Vault',
    subtitle: 'Document upload and validation (FR-06)',
    category: 'Pages & Modules',
    path: '/shipper/customs',
    icon: FileText,
  },
  {
    id: 'page-ledger',
    title: 'Multi-Currency Transaction Ledger',
    subtitle: 'Audit records & CSV export',
    category: 'Pages & Modules',
    path: '/finance/ledger',
    icon: FileText,
  },
];

export default function HeaderSearch() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = query.trim() === ''
    ? []
    : SEARCH_DATABASE.filter(item => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      });

  const categories = Array.from(new Set(results.map(r => r.category)));

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery('');
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-[400px]">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 text-slate-400 pointer-events-none" size={14} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search loads, waybills, carriers... (Ctrl+K)"
          className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none placeholder:text-slate-400 transition-colors"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X size={12} />
          </button>
        ) : (
          <kbd className="absolute right-2 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">
            Ctrl+K
          </kbd>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim() !== '' && (
        <div className="absolute left-0 top-full mt-1.5 w-full sm:w-[440px] bg-white border border-slate-200 rounded shadow-md z-50 overflow-hidden text-xs">
          {results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No results found for "<span className="text-slate-700 font-medium">{query}</span>"
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {categories.map((category) => (
                <div key={category} className="p-2">
                  <div className="text-[10px] font-mono font-semibold uppercase text-slate-400 px-2 py-1 tracking-wider">
                    {category}
                  </div>
                  <div className="space-y-0.5">
                    {results
                      .filter(r => r.category === category)
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item.path)}
                          className="w-full text-left flex items-start gap-2.5 px-2 py-1.5 rounded hover:bg-slate-50 transition-colors group"
                        >
                          <item.icon size={14} className="text-slate-400 mt-0.5 shrink-0 group-hover:text-slate-900" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 truncate flex items-center justify-between">
                              <span>{item.title}</span>
                              <ArrowUpRight size={12} className="text-slate-300 group-hover:text-slate-700 shrink-0 ml-1" />
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{item.subtitle}</div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
            <span>Press <kbd className="font-mono bg-white px-1 py-0.5 border border-slate-200 rounded">ESC</kbd> to close</span>
            <span>{results.length} result{results.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
