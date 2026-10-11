import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Scale, Package, ChevronDown, Clock, Lock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { postLoad, calculateSpotRate } from '@/lib/apiClient';
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
  const [leadTime, setLeadTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [formData, setFormData] = useState({
    origin: '',
    cargoType: '',
    destination: '',
    weightKg: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const [quoteDetails, setQuoteDetails] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleRequestQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiError(null);
    try {
      setLoading(true);

      const cLower = (formData.cargoType || '').toLowerCase();
      const mappedCargoType: 'dry' | 'bulk' | 'fragile' | 'hazmat' | 'perishable' | 'refrigerated' | 'general' =
        cLower.includes('reefer') || cLower.includes('refrigerat') || cLower.includes('pharma') ? 'refrigerated' :
        cLower.includes('bulk') || cLower.includes('agricultural') ? 'bulk' :
        cLower.includes('fuel') || cLower.includes('petroleum') || cLower.includes('tanker') ? 'hazmat' :
        cLower.includes('perish') ? 'perishable' :
        'dry';

      const mappedTruckType =
        cLower.includes('reefer') ? 'REEFER' :
        cLower.includes('tanker') ? 'TANKER' :
        cLower.includes('box') ? 'SIDE_WALL' :
        'FLATBED';

      const extractCity = (str: string, fallback: string) => {
        const s = (str || '').toLowerCase();
        if (s.includes('djibouti')) return 'Djibouti';
        if (s.includes('galafi')) return 'Galafi';
        if (s.includes('semera')) return 'Semera';
        if (s.includes('kombolcha')) return 'Kombolcha';
        if (s.includes('dire')) return 'Dire Dawa';
        if (s.includes('hawassa')) return 'Hawassa';
        if (s.includes('modjo')) return 'Modjo';
        if (s.includes('adama') || s.includes('nazret')) return 'Adama';
        if (s.includes('mekelle')) return 'Mekelle';
        if (s.includes('addis') || s.includes('kality')) return 'Addis Ababa';
        return fallback;
      };

      const payload = {
        origin: {
          name: formData.origin,
          city: extractCity(formData.origin, 'Djibouti')
        },
        destination: {
          name: formData.destination,
          city: extractCity(formData.destination, 'Addis Ababa')
        },
        cargoType: mappedCargoType,
        truckType: mappedTruckType,
        weightKg: Number(formData.weightKg) || 0,
        urgency: leadTime === '12h' ? 'high' : leadTime === '48h' ? 'low' : 'standard',
        isUrgent: leadTime === '12h',
        pickupWindowHours: leadTime === '12h' ? 12 : leadTime === '24h' ? 24 : 48,
      };

      const response = await calculateSpotRate(payload);

      setCalculatedPrice(response.spot_price ?? response.recommended_spot_rate ?? 0);
      setQuoteDetails(response);
      setQuoteGenerated(true);
      setAiError(null);
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

  const handleConfirmBroadcast = async () => {
    if (!isVerified) {
      toast.error(`Posting Restricted: Your shipper account is in ${verificationStatus} status. Per SRS Section 3.1 (FR-01), admin approval is required before loads can be broadcast to the transporter marketplace.`);
      return;
    }

    try {
      setLoading(true);
      await postLoad({
        title: `Freight: ${formData.cargoType}`,
        description: `Deliver ${formData.cargoType} from ${formData.origin} to ${formData.destination}`,
        origin: { address: formData.origin, city: formData.origin.toLowerCase().includes('djibouti') ? 'Djibouti' : 'Modjo' },
        destination: { address: formData.destination, city: formData.destination.toLowerCase().includes('modjo') ? 'Modjo' : 'Addis Ababa' },
        weightKg: Number(formData.weightKg),
        cargoType: formData.cargoType,
        budgetAmount: calculatedPrice,
        currency: 'ETB',
        expiryHours: leadTime === '12h' ? 12 : leadTime === '24h' ? 24 : 48
      });
      toast.success('Order posted successfully to the freight marketplace!');
      setQuoteGenerated(false);
      setQuoteDetails(null);

      // Navigate to Bids Exchange tab
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

  return (
    <div className="space-y-5">
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl shadow-lg shadow-black/40 overflow-hidden">
        <div className="bg-[#1C1C1C]/50 border-b border-[#2E2E2E] px-5 py-4 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-bold text-[#EDEDED]">{t('post_new_freight_order')}</h2>
          {!isVerified && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock size={11} /> Broadcast Locked (Pending Admin Approval)
            </span>
          )}
        </div>

        <form id="quote-form" onSubmit={handleRequestQuote} className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#EDEDED]">{t('origin')}</Label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8F8F]" />
                <input type="text" list="origin-list" name="origin" value={formData.origin} onChange={handleChange} required className="w-full pl-9 pr-8 bg-[#1C1C1C] border border-[#2E2E2E] h-9 text-xs font-medium rounded-lg text-[#EDEDED] focus:bg-[#232323] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E] transition-all appearance-none" placeholder={t('origin')} />
                <datalist id="origin-list">
                  <option value="Djibouti Port / Doraleh Container Terminal (DCT)" />
                  <option value="Djibouti Free Trade Zone (DFTZ)" />
                  <option value="Galafi Border Terminal (Inbound)" />
                  <option value="Modjo Dry Port & Terminal (Outbound Export)" />
                  <option value="Addis Ababa / Kality Customs Branch" />
                  <option value="Dire Dawa Dry Port" />
                  <option value="Semera Logistics Hub" />
                  <option value="Kombolcha Dry Port" />
                  <option value="Hawassa Industrial Park Terminal" />
                </datalist>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8F8F8F] pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#EDEDED]">{t('cargo_details')}</Label>
              <div className="relative">
                <Package size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8F8F]" />
                <input type="text" list="cargo-list" name="cargoType" value={formData.cargoType} onChange={handleChange} required className="w-full pl-9 pr-8 bg-[#1C1C1C] border border-[#2E2E2E] h-9 text-xs font-medium rounded-lg text-[#EDEDED] focus:bg-[#232323] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E] transition-all appearance-none" placeholder={t('cargo_details')} />
                <datalist id="cargo-list">
                  <option value="30T Construction Rebar (Flatbed)" />
                  <option value="20ft Standard Dry Container (FCL)" />
                  <option value="40ft High Cube Container (FCL)" />
                  <option value="40T Bulk Agricultural / Coffee Beans (High-Side)" />
                  <option value="Heavy Machinery / Industrial Equipment (Lowbed)" />
                  <option value="Refrigerated Perishables / Pharma (Reefer)" />
                  <option value="Bulk Petroleum / Fuel Tanker" />
                  <option value="General Palletized Merchandise (Box Truck)" />
                </datalist>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8F8F8F] pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#EDEDED]">{t('destination')}</Label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8F8F]" />
                <input type="text" list="destination-list" name="destination" value={formData.destination} onChange={handleChange} required className="w-full pl-9 pr-8 bg-[#1C1C1C] border border-[#2E2E2E] h-9 text-xs font-medium rounded-lg text-[#EDEDED] focus:bg-[#232323] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E] transition-all appearance-none" placeholder={t('destination')} />
                <datalist id="destination-list">
                  <option value="Modjo Dry Port & Terminal, Ethiopia" />
                  <option value="Addis Ababa / Kality Customs Clearance Center" />
                  <option value="Djibouti Container Terminal (Export Exit)" />
                  <option value="Dire Dawa Free Trade Zone" />
                  <option value="Semera Freight Hub" />
                  <option value="Kombolcha Dry Port" />
                  <option value="Hawassa Industrial Park" />
                  <option value="Mekelle Hub" />
                  <option value="Adama Industrial Hub" />
                </datalist>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8F8F8F] pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#EDEDED]">{t('weight_volume')}</Label>
              <div className="relative flex items-center">
                <Scale size={15} className="absolute left-3 text-[#8F8F8F]" />
                <Input type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} required className="pl-9 pr-10 bg-[#1C1C1C] border border-[#2E2E2E] h-9 text-xs font-medium rounded-lg text-[#EDEDED] focus:bg-[#232323] focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E] transition-all" placeholder="Weight" />
                <span className="absolute right-3 text-xs font-medium text-[#8F8F8F] pointer-events-none">kg</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#EDEDED]">{t('lead_time_window')}</Label>
              <div className="relative">
                <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8F8F]" />
                <input
                  type="text"
                  list="lead-time-list"
                  name="leadTime"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  required
                  className="w-full pl-9 pr-8 bg-[#1C1C1C] border border-[#2E2E2E] h-9 text-xs font-medium rounded-lg text-[#EDEDED] focus:bg-[#232323] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E] transition-all appearance-none"
                  placeholder={t('lead_time_window')}
                />
                <datalist id="lead-time-list">
                  <option value="12h">{t('express_12h')}</option>
                  <option value="24h">{t('standard_24h')}</option>
                  <option value="48h">{t('flexible_48h')}</option>
                </datalist>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8F8F8F] pointer-events-none" />
              </div>
            </div>
          </div>



        </form>
      </div>

      <div className="flex items-center justify-end px-1 mt-2">
        <button
          type="submit"
          form="quote-form"
          disabled={loading}
          className="bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 hover:bg-[#3ECF8E]/20 text-[#3ECF8E] px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
        >
          {t('generate_instant_spot_quote')}
        </button>
      </div>

      {aiError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={16} className="text-red-400 shrink-0" />
            <div>
              <span className="font-bold text-red-300">AI Pricing Engine Unavailable:</span>{' '}
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

      {quoteGenerated && (
        <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl p-5 shadow-lg shadow-black/40 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-start">
            <div>
              <span className="inline-block bg-[#181818] text-[#EDEDED] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[#2E2E2E] mb-1.5">{t('dynamic_pricing_engine')}</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-[#EDEDED] tracking-tight">{calculatedPrice.toLocaleString()} ETB</span>
              <p className="text-[11px] font-medium text-[#8F8F8F]">~${Math.round(calculatedPrice / 118).toLocaleString()} USD</p>
            </div>
          </div>

          {(() => {
            const b = quoteDetails?.breakdown;
            const baseTariff = b ? Math.round(b.base_corridor_rate) : Math.round(calculatedPrice * 0.7);
            const fuelCharge = b ? Math.round(baseTariff * Math.max(0.08, (b.fuel_multiplier || 1) - 1 + 0.12)) : Math.round(calculatedPrice * 0.15);
            const demandWeightFees = Math.max(0, calculatedPrice - baseTariff - fuelCharge);
            return (
              <div className="space-y-2">
                <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-lg p-3 text-xs font-mono flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap text-[#8F8F8F] font-medium">
                    <span>{t('base_fee')}: {baseTariff.toLocaleString()} ETB</span>
                    <span className="text-[#8F8F8F]">+</span>
                    <span>{t('fuel')}: {fuelCharge.toLocaleString()} ETB</span>
                    <span className="text-[#8F8F8F]">+</span>
                    <span>Weight & Demand: {demandWeightFees.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[#8F8F8F]">=</span>
                    <span className="text-[#EDEDED] font-bold whitespace-nowrap">{t('total')}: {calculatedPrice.toLocaleString()} ETB</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8F8F8F] font-mono px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#3ECF8E] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse"></span>
                      ML Model Active (LightGBM R²: {quoteDetails?.model_confidence_r2 ? (quoteDetails.model_confidence_r2 * 100).toFixed(1) + '%' : '99.9%'})
                    </span>
                    <span>•</span>
                    <span>Ref ID: {quoteDetails?.calculation_id || 'QTE-LIVE'}</span>
                  </div>
                  {b?.rate_per_ton_km && (
                    <span className="text-zinc-400">
                      Rate: {b.rate_per_ton_km} ETB/t·km ({b.distance_km} km)
                    </span>
                  )}
                </div>

                {b?.is_clamped && (
                  <div className="text-[10px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded font-mono">
                    🛡️ SRS Volatility Band: {b.clamp_reason}
                  </div>
                )}
              </div>
            );
          })()}

          {!isVerified ? (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={true}
                className="w-full bg-[#1C1C1C] text-[#8F8F8F] border border-amber-500/30 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-inner"
              >
                <Lock size={14} className="text-amber-400" />
                <span>Broadcast Locked (Account Pending Admin Approval)</span>
              </button>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center justify-between gap-2">
                <span>SRS FR-01: Freight orders cannot be broadcast to transporters until an Administrator verifies your legal entity credentials in the Verification Queue.</span>
                {onRefreshVerification && (
                  <button
                    type="button"
                    onClick={onRefreshVerification}
                    className="shrink-0 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-semibold text-[10px] transition-colors"
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
              className="w-full bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] py-2.5 rounded-lg text-xs font-bold shadow-md hover:shadow-[0_0_15px_rgba(62,207,142,0.3)] hover:-translate-y-0.5 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? 'Posting...' : t('confirm_post_load')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
