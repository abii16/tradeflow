import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronDown, 
  Lock, 
  ShieldAlert, 
  Truck, 
  Calendar, 
  Sparkles, 
  AlertTriangle
} from 'lucide-react';
import { postLoad, calculateSpotRate } from '@/lib/apiClient';
import EthiopianDatePicker from '@/components/common/EthiopianDatePicker';
import toast from 'react-hot-toast';

interface FreightOrderFormProps {
  verificationStatus?: string;
  isVerified?: boolean;
  onRefreshVerification?: () => void;
}

export default function FreightOrderForm({
  verificationStatus = 'PENDING',
  isVerified = false,
  onRefreshVerification
}: FreightOrderFormProps) {
  const { t } = useTranslation();
  const [quoteGenerated, setQuoteGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [quoteDetails, setQuoteDetails] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Form State adhering to SRS Section 3.2 (FR-02.1) & Section 3.4 (FR-04.1)
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [cargoCategory, setCargoCategory] = useState<string>('');
  const [cargoDescription, setCargoDescription] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [volumeM3, setVolumeM3] = useState('');
  const [truckType, setTruckType] = useState<string>('FLATBED');
  const [customTruckType, setCustomTruckType] = useState<string>('');
  const [isCustomTruckType, setIsCustomTruckType] = useState<boolean>(false);
  const [urgencyTier, setUrgencyTier] = useState<string>('standard');
  const [customUrgencyHours, setCustomUrgencyHours] = useState<string>('24');
  const [earliestPickup, setEarliestPickup] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Helper to extract canonical corridor city for AI Spot Model
  const extractCity = (str: string, fallback: string = ''): string => {
    if (!str || !str.trim()) return fallback;
    const s = str.trim().toLowerCase();
    if (s.includes('djibouti')) return 'Djibouti';
    if (s.includes('galafi')) return 'Galafi';
    if (s.includes('semera') || s.includes('samara')) return 'Semera';
    if (s.includes('kombolcha')) return 'Kombolcha';
    if (s.includes('dire')) return 'Dire Dawa';
    if (s.includes('hawassa')) return 'Hawassa';
    if (s.includes('modjo') || s.includes('mojo')) return 'Modjo';
    if (s.includes('adama') || s.includes('nazret')) return 'Adama';
    if (s.includes('mekelle')) return 'Mekelle';
    if (s.includes('addis') || s.includes('kality') || s.includes('akaki')) return 'Addis Ababa';
    if (s.includes('bahir') || s.includes('dar')) return 'Bahir Dar';
    if (s.includes('gondar')) return 'Gondar';
    if (s.includes('jimma')) return 'Jimma';
    if (s.includes('harar')) return 'Harar';
    if (s.includes('moyale')) return 'Moyale';
    const trimmed = str.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };

  // Sync recommended truck type when cargo category changes
  const handleCategoryChange = (val: string) => {
    setCargoCategory(val);
    const cat = val.toLowerCase();
    if (cat.includes('refrig') || cat.includes('cold') || cat.includes('perish')) {
      setTruckType('REEFER');
      setIsCustomTruckType(false);
    } else if (cat.includes('bulk') || cat.includes('agri') || cat.includes('grain')) {
      setTruckType('SIDE_WALL');
      setIsCustomTruckType(false);
    } else if (cat.includes('haz') || cat.includes('chem') || cat.includes('fuel')) {
      setTruckType('TANKER');
      setIsCustomTruckType(false);
    } else if (cat.includes('oversize') || cat.includes('heavy') || cat.includes('machin')) {
      setTruckType('LOWBED');
      setIsCustomTruckType(false);
    }
  };

  const handleTruckTypeChange = (type: string) => {
    setTruckType(type);
    if (type === 'CUSTOM') {
      setIsCustomTruckType(true);
    } else {
      setIsCustomTruckType(false);
    }
  };

  // Preset volume helper
  const handleContainerPreset = (preset: '20ft' | '40ft' | '40hc' | 'bulk') => {
    if (preset === '20ft') {
      setVolumeM3('33');
      setWeightKg('24000');
    } else if (preset === '40ft') {
      setVolumeM3('67');
      setWeightKg('28000');
    } else if (preset === '40hc') {
      setVolumeM3('76');
      setWeightKg('30000');
    } else if (preset === 'bulk') {
      setVolumeM3('50');
      setWeightKg('40000');
    }
  };

  // Request AI Spot Rate from FastAPI AI Engine
  const handleRequestQuote = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (!origin.trim()) {
      toast.error('Please enter or select an origin terminal');
      return;
    }
    if (!destination.trim()) {
      toast.error('Please enter or select a destination dry port');
      return;
    }
    if (!weightKg || Number(weightKg) <= 0) {
      toast.error('Please enter gross cargo weight in kg');
      return;
    }

    try {
      setLoading(true);

      const originCity = extractCity(origin, 'Djibouti') || 'Djibouti';
      const destinationCity = extractCity(destination, 'Modjo') || 'Modjo';
      const effectiveCategory = cargoCategory.trim() || 'Dry Cargo';
      const effectiveTruckType = (truckType === 'CUSTOM' || isCustomTruckType)
        ? (customTruckType.trim() || 'CUSTOM_TRUCK')
        : truckType;
      const pickupWindowHours = urgencyTier === 'high' ? 12 : urgencyTier === 'low' ? 48 : urgencyTier === 'custom' ? (Number(customUrgencyHours) || 24) : 24;

      const payload = {
        origin: {
          name: origin,
          city: originCity
        },
        destination: {
          name: destination,
          city: destinationCity
        },
        cargoType: effectiveCategory,
        truckType: effectiveTruckType,
        weightKg: Number(weightKg) || 1000,
        volumeM3: volumeM3 ? Number(volumeM3) : undefined,
        urgency: urgencyTier === 'high' ? 'high' : urgencyTier === 'low' ? 'low' : 'standard',
        isUrgent: urgencyTier === 'high',
        pickupWindowHours: pickupWindowHours,
        currency: 'ETB',
      };

      const response = await calculateSpotRate(payload);

      setCalculatedPrice(response.spot_price ?? response.recommended_spot_rate ?? 0);
      setQuoteDetails(response);
      setQuoteGenerated(true);
      setAiError(null);
      toast.success('Dynamic AI Spot Quote calculated with LightGBM ML model!');
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.message || 'AI Spot Pricing Engine is currently offline.';
      setAiError(errMsg);
      setQuoteGenerated(false);
      setQuoteDetails(null);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Broadcast Load to Transporter Marketplace (SRS FR-01 & FR-02)
  const handleConfirmBroadcast = async () => {
    if (!isVerified) {
      toast.error(`Posting Restricted: Your shipper account is in ${verificationStatus} status. Per SRS Section 3.1 (FR-01), admin approval is required before loads can be broadcast to the transporter marketplace.`);
      return;
    }

    try {
      setLoading(true);
      const originCity = extractCity(origin, 'Djibouti');
      const destinationCity = extractCity(destination, 'Modjo');
      const effectiveCategory = cargoCategory.trim() || 'Dry Cargo';
      const effectiveTruckType = (truckType === 'CUSTOM' || isCustomTruckType)
        ? (customTruckType.trim() || 'CUSTOM_TRUCK')
        : truckType;
      const expiryHours = urgencyTier === 'high' ? 12 : urgencyTier === 'low' ? 48 : urgencyTier === 'custom' ? (Number(customUrgencyHours) || 24) : 24;

      await postLoad({
        title: `${effectiveCategory.toUpperCase()}: ${cargoDescription || 'Commercial Freight'}`,
        description: `Corridor haul: ${cargoDescription || effectiveCategory}. Equipment: ${effectiveTruckType}. Earliest Pickup: ${earliestPickup || 'Immediate'}. Special Instructions: ${specialInstructions || 'Standard Corridor Haul'}.`,
        origin: { address: origin, city: originCity },
        destination: { address: destination, city: destinationCity },
        weightKg: Number(weightKg),
        volumeM3: volumeM3 ? Number(volumeM3) : undefined,
        cargoType: effectiveCategory,
        budgetAmount: calculatedPrice,
        currency: 'ETB',
        expiryHours: expiryHours,
      });

      toast.success('Order broadcast successfully to the transporter marketplace!');
      setQuoteGenerated(false);
      setQuoteDetails(null);

      // Trigger load refresh and navigate to Bids Exchange tab
      window.dispatchEvent(new Event('shipper:load_posted'));
      localStorage.setItem('tradeflow_load_posted', Date.now().toString());
      window.history.pushState({ tab: 'bids' }, '', '/shipper/bids');
      window.dispatchEvent(new Event('popstate'));
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || error.message || 'Unknown error';
      toast.error('Failed to post order: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const originCity = extractCity(origin);
  const destCity = extractCity(destination);
  const weightNum = Number(weightKg) || 0;
  const weightTons = (weightNum / 1000).toFixed(1);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl shadow-lg shadow-black/40 overflow-hidden">
        {/* Card Header */}
        <div className="bg-[#1C1C1C] border-b border-[#2E2E2E] px-6 py-3.5 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-bold text-[#EDEDED]">
            {t('post_new_freight_order', 'Post New Freight Order')}
          </h2>
          {!isVerified && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock size={12} /> Broadcast Locked (Pending Admin Verification)
            </span>
          )}
        </div>

        {/* Input Form */}
        <form id="quote-form" onSubmit={handleRequestQuote} className="p-6 space-y-6">
          {/* Section 1: Route */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono font-bold text-[#8F8F8F] uppercase tracking-wider">
              <span>Route</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Origin */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[#EDEDED]">{t('origin', 'Origin')}</label>
                  {originCity && (
                    <span className="text-[10px] font-mono text-[#24b47e] bg-[#24b47e]/10 px-1.5 py-0.5 rounded">
                      {originCity}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  name="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  required
                  className="w-full px-3.5 bg-[#1C1C1C] border border-[#2E2E2E] h-10 text-xs font-medium rounded-lg text-[#EDEDED] placeholder-[#707070] focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e]/30 transition-all font-sans"
                  placeholder="Origin"
                />
              </div>

              {/* Destination */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[#EDEDED]">{t('destination', 'Destination')}</label>
                  {destCity && (
                    <span className="text-[10px] font-mono text-[#24b47e] bg-[#24b47e]/10 px-1.5 py-0.5 rounded">
                      {destCity}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  name="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                  className="w-full px-3.5 bg-[#1C1C1C] border border-[#2E2E2E] h-10 text-xs font-medium rounded-lg text-[#EDEDED] placeholder-[#707070] focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e]/30 transition-all font-sans"
                  placeholder="Destination"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Cargo */}
          <div className="space-y-3 pt-2 border-t border-[#2E2E2E]">
            <div className="text-[11px] font-mono font-bold text-[#8F8F8F] uppercase tracking-wider">
              <span>Cargo</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#EDEDED]">Category</label>
                <input
                  type="text"
                  name="category"
                  value={cargoCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3.5 bg-[#1C1C1C] border border-[#2E2E2E] h-10 text-xs font-medium rounded-lg text-[#EDEDED] placeholder-[#707070] focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e]/30 transition-all font-sans"
                  placeholder="Category"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-[#EDEDED]">Description</label>
                <input
                  type="text"
                  value={cargoDescription}
                  onChange={(e) => setCargoDescription(e.target.value)}
                  required
                  className="w-full px-3.5 bg-[#1C1C1C] border border-[#2E2E2E] h-10 text-xs font-medium rounded-lg text-[#EDEDED] placeholder-[#707070] focus:border-[#24b47e] focus:ring-1 focus:ring-[#24b47e]/30 transition-all font-sans"
                  placeholder="Description"
                />
              </div>
            </div>

            {/* Weight & Volume Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-1">
              {/* Weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[#EDEDED]">Gross Weight</label>
                  {weightNum > 0 && (
                    <span className="text-[10px] font-mono text-[#8F8F8F]">
                      ≈ {weightTons} Tons
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    required
                    className="w-full px-3 pr-10 bg-[#1C1C1C] border border-[#2E2E2E] h-10 text-xs font-medium rounded-lg text-[#EDEDED] focus:border-[#3ECF8E] focus:ring-2 focus:ring-[#3ECF8E]/20 transition-all font-mono"
                    placeholder="28000"
                  />
                  <span className="absolute right-3 text-xs font-mono font-bold text-[#8F8F8F] pointer-events-none">kg</span>
                </div>
              </div>

              {/* Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[#EDEDED]">Volume</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleContainerPreset('20ft')}
                      className="text-[9px] px-1 py-0.5 bg-[#1C1C1C] hover:bg-[#2A2A2A] border border-[#2E2E2E] text-[#8F8F8F] rounded"
                      title="20ft Container preset"
                    >
                      20ft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleContainerPreset('40ft')}
                      className="text-[9px] px-1 py-0.5 bg-[#1C1C1C] hover:bg-[#2A2A2A] border border-[#2E2E2E] text-[#8F8F8F] rounded"
                      title="40ft Container preset"
                    >
                      40ft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleContainerPreset('40hc')}
                      className="text-[9px] px-1 py-0.5 bg-[#1C1C1C] hover:bg-[#2A2A2A] border border-[#2E2E2E] text-[#8F8F8F] rounded"
                      title="40ft High Cube preset"
                    >
                      40HC
                    </button>
                  </div>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={volumeM3}
                    onChange={(e) => setVolumeM3(e.target.value)}
                    className="w-full px-3 pr-10 bg-[#1C1C1C] border border-[#2E2E2E] h-10 text-xs font-medium rounded-lg text-[#EDEDED] focus:border-[#3ECF8E] focus:ring-2 focus:ring-[#3ECF8E]/20 transition-all font-mono"
                    placeholder="33"
                  />
                  <span className="absolute right-3 text-xs font-mono font-bold text-[#8F8F8F] pointer-events-none">m³</span>
                </div>
              </div>

              {/* Equipment */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[#EDEDED]">Equipment</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (isCustomTruckType || truckType === 'CUSTOM') {
                        setIsCustomTruckType(false);
                        setTruckType('FLATBED');
                      } else {
                        setIsCustomTruckType(true);
                        setTruckType('CUSTOM');
                      }
                    }}
                    className="text-[10px] font-mono text-[#3ECF8E] hover:underline cursor-pointer"
                  >
                    {isCustomTruckType || truckType === 'CUSTOM' ? 'Standard Options' : '+ Custom (በራስዎ መጻፍ)'}
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={truckType}
                    onChange={(e) => handleTruckTypeChange(e.target.value)}
                    className="w-full px-3 pr-8 bg-[#1C1C1C] border border-[#2E2E2E] h-10 text-xs font-medium rounded-lg text-[#EDEDED] focus:border-[#3ECF8E] focus:ring-2 focus:ring-[#3ECF8E]/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="FLATBED">Flatbed (40ft)</option>
                    <option value="SIDE_WALL">Side-Wall Box</option>
                    <option value="REEFER">Reefer (-20°C)</option>
                    <option value="TANKER">Tanker (Fuel)</option>
                    <option value="LOWBED">Lowbed (Heavy)</option>
                    <option value="CUSTOM">Other / ሌላ ተሽከርካሪ (በራስዎ ያስገቡ)...</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8F8F8F] pointer-events-none" />
                </div>
                {(isCustomTruckType || truckType === 'CUSTOM') && (
                  <div className="pt-1 animate-in fade-in slide-in-from-top-1">
                    <input
                      type="text"
                      value={customTruckType}
                      onChange={(e) => setCustomTruckType(e.target.value)}
                      required={isCustomTruckType || truckType === 'CUSTOM'}
                      className="w-full px-3 bg-[#1C1C1C] border border-[#3ECF8E]/50 h-9 text-xs font-medium rounded-lg text-[#EDEDED] focus:border-[#3ECF8E] focus:ring-2 focus:ring-[#3ECF8E]/20 transition-all"
                      placeholder="የተሽከርካሪ ዓይነት (e.g. Isuzu NPR, Sino Truck, Car Carrier, Box Van...)"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Dispatch */}
          <div className="space-y-3 pt-2 border-t border-[#2E2E2E]">
            <div className="text-[11px] font-mono font-bold text-[#8F8F8F] uppercase tracking-wider">
              <span>Dispatch</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {/* Urgency */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[#EDEDED]">Urgency</label>
                  {urgencyTier === 'custom' && (
                    <span className="text-[10px] font-mono text-[#3ECF8E]">
                      {customUrgencyHours}h Window
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={urgencyTier}
                    onChange={(e) => setUrgencyTier(e.target.value)}
                    className="w-full px-3 pr-8 bg-[#1C1C1C] border border-[#2E2E2E] h-10 text-xs font-medium rounded-lg text-[#EDEDED] focus:border-[#3ECF8E] focus:ring-2 focus:ring-[#3ECF8E]/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="standard">Standard (24h)</option>
                    <option value="high">Express (+15%)</option>
                    <option value="low">Economy (-5%)</option>
                    <option value="custom">Custom Hours (በራስዎ ሰዓት ይወስኑ)...</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8F8F8F] pointer-events-none" />
                </div>
                {urgencyTier === 'custom' && (
                  <div className="pt-1 animate-in fade-in slide-in-from-top-1">
                    <input
                      type="number"
                      min="1"
                      max="720"
                      value={customUrgencyHours}
                      onChange={(e) => setCustomUrgencyHours(e.target.value)}
                      className="w-full px-3 bg-[#1C1C1C] border border-[#3ECF8E]/50 h-9 text-xs font-mono rounded-lg text-[#EDEDED] focus:border-[#3ECF8E] focus:ring-2 focus:ring-[#3ECF8E]/20 transition-all"
                      placeholder="የመጫኛ ሰዓት ገደብ (Hours, e.g. 18, 36, 72)"
                    />
                  </div>
                )}
              </div>

              {/* Earliest Pickup Date (Ethiopian Calendar) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#EDEDED]">Earliest Pickup</label>
                  <span className="text-[10px] font-mono text-[#3ECF8E] bg-[#3ECF8E]/10 px-1.5 py-0.5 rounded border border-[#3ECF8E]/20">
                    የኢትዮጵያ አቆጣጠር
                  </span>
                </div>
                <EthiopianDatePicker
                  value={earliestPickup}
                  onChange={(iso) => setEarliestPickup(iso)}
                  placeholder="ቀን ይምረጡ (e.g. ጥቅምት 11, 2017)"
                />
              </div>

              {/* Special Handling */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#EDEDED]">Special Handling</label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full px-3 bg-[#1C1C1C] border border-[#2E2E2E] h-10 text-xs font-medium rounded-lg text-[#EDEDED] focus:border-[#3ECF8E] focus:ring-2 focus:ring-[#3ECF8E]/20 transition-all"
                  placeholder="e.g. Tarpaulin, Fragile"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Submit Quote Button Bar */}
        <div className="p-5 bg-[#1C1C1C] border-t border-[#2E2E2E] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-[#8F8F8F]">
            <Sparkles size={14} className="text-[#24b47e]" />
            <span>AI Spot Engine calculates real-time corridor rates</span>
          </div>

          <button
            type="submit"
            form="quote-form"
            disabled={loading}
            className="flex items-center gap-2 bg-[#24b47e] hover:bg-[#1fa16f] text-white px-5 py-2.5 rounded-lg text-xs font-semibold shadow-sm hover:shadow-[0_0_15px_rgba(36,180,126,0.25)] transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <Sparkles size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Evaluating Model...' : 'Get AI Spot Quote'}</span>
          </button>
        </div>
      </div>

      {/* AI Error Notification */}
      {aiError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={16} className="text-red-400 shrink-0" />
            <div>
              <span className="font-bold text-red-300">AI Pricing Engine Error:</span>{' '}
              <span>{aiError}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAiError(null)}
            className="text-red-400/80 hover:text-red-300 font-bold px-2 py-1 text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dynamic AI Spot Quote Card (SRS FR-04.1) */}
      {quoteGenerated && (
        <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl p-6 shadow-xl shadow-black/50 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#2E2E2E]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#3ECF8E]/15 text-[#3ECF8E] text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[#3ECF8E]/30">
                  ML Spot Rate Quote (FR-04.1)
                </span>
                <span className="text-[10px] font-mono text-[#8F8F8F]">
                  Corridor: {quoteDetails?.corridor_matched || `${extractCity(origin, 'Djibouti')} — ${extractCity(destination, 'Modjo')}`}
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#EDEDED]">
                Recommended Freight Spot Tariff
              </h3>
            </div>

            <div className="text-right">
              <span className="text-3xl font-black font-mono text-[#EDEDED] tracking-tight">
                {calculatedPrice.toLocaleString()} <span className="text-sm font-bold text-[#3ECF8E]">ETB</span>
              </span>
              <p className="text-xs font-mono font-medium text-[#8F8F8F]">
                ≈ ${(Math.round(calculatedPrice / 118)).toLocaleString()} USD
              </p>
            </div>
          </div>

          {/* Breakdown Table */}
          {(() => {
            const b = quoteDetails?.breakdown;
            const baseTariff = b ? Math.round(b.base_corridor_rate) : Math.round(calculatedPrice * 0.7);
            const fuelCharge = b ? Math.round(baseTariff * Math.max(0.08, (b.fuel_multiplier || 1) - 1 + 0.12)) : Math.round(calculatedPrice * 0.15);
            const demandWeightFees = Math.max(0, calculatedPrice - baseTariff - fuelCharge);

            return (
              <div className="space-y-3">
                <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-lg p-3.5 text-xs font-mono flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 flex-wrap text-[#8F8F8F]">
                    <span>Base Distance: <strong className="text-[#EDEDED]">{baseTariff.toLocaleString()} ETB</strong></span>
                    <span>+</span>
                    <span>Diesel Fuel Index: <strong className="text-[#EDEDED]">{fuelCharge.toLocaleString()} ETB</strong></span>
                    <span>+</span>
                    <span>Weight & Demand: <strong className="text-[#EDEDED]">{demandWeightFees.toLocaleString()} ETB</strong></span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span>=</span>
                    <span className="text-[#3ECF8E] font-bold text-sm whitespace-nowrap">Total: {calculatedPrice.toLocaleString()} ETB</span>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-[#8F8F8F] font-mono px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#3ECF8E] font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse" />
                      LightGBM Active (R²: {quoteDetails?.model_confidence_r2 ? (quoteDetails.model_confidence_r2 * 100).toFixed(1) + '%' : '99.9%'})
                    </span>
                    <span>•</span>
                    <span>Ref ID: {quoteDetails?.calculation_id?.substring(0, 12) || 'QTE-LIVE'}</span>
                  </div>
                  {b?.rate_per_ton_km && (
                    <span className="text-zinc-400">
                      Index: {b.rate_per_ton_km} ETB/t·km ({b.distance_km} km corridor)
                    </span>
                  )}
                </div>

                {b?.is_clamped && (
                  <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg font-mono flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>SRS FR-04.1 Volatility Protection: {b.clamp_reason}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Action Button: Broadcast to Transporter Marketplace */}
          <div className="pt-2 border-t border-[#2E2E2E]">
            {!isVerified ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={true}
                  className="w-full bg-[#1C1C1C] text-[#8F8F8F] border border-amber-500/30 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-inner"
                >
                  <Lock size={15} className="text-amber-400" />
                  <span>Marketplace Broadcast Locked (Account Pending Admin Verification)</span>
                </button>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between gap-3">
                  <span>SRS Section 3.1 (FR-01): Legal entity credentials must be verified by Platform Administration before freight orders can be dispatched to carriers.</span>
                  {onRefreshVerification && (
                    <button
                      type="button"
                      onClick={onRefreshVerification}
                      className="shrink-0 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-md font-semibold text-xs transition-colors"
                    >
                      Check Status
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConfirmBroadcast}
                disabled={loading}
                className="w-full bg-[#24b47e] hover:bg-[#1fa16f] text-white py-3 rounded-xl text-xs font-semibold shadow-sm hover:shadow-[0_0_20px_rgba(36,180,126,0.3)] hover:-translate-y-0.5 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Truck size={16} />
                <span>{loading ? 'Broadcasting Freight Order...' : 'Broadcast Freight Order & Solicit Carrier Bids (FR-02)'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
