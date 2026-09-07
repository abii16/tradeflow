import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Scale, Package, ChevronDown, Clock } from 'lucide-react';
import { postLoad, calculateSpotRate } from '@/lib/apiClient';

export default function FreightOrderForm() {
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

  const handleRequestQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        origin: {
          name: formData.origin,
          city: formData.origin.toLowerCase().includes('djibouti') ? 'Djibouti' : formData.origin.toLowerCase().includes('addis') ? 'Addis Ababa' : 'Modjo'
        },
        destination: {
          name: formData.destination,
          city: formData.destination.toLowerCase().includes('modjo') ? 'Modjo' : formData.destination.toLowerCase().includes('hawassa') ? 'Hawassa' : formData.destination.toLowerCase().includes('dire') ? 'Dire Dawa' : 'Addis Ababa'
        },
        cargoType: 'dry',
        weightKg: Number(formData.weightKg) || 0,
        urgency: leadTime === '12h' ? 'high' : leadTime === '48h' ? 'low' : 'standard',
        isUrgent: leadTime === '12h',
        pickupWindowHours: leadTime === '12h' ? 12 : leadTime === '24h' ? 24 : 48,
      };

      const response = await calculateSpotRate(payload);

      setCalculatedPrice(response.spot_price);
      setQuoteDetails(response);
      setQuoteGenerated(true);
    } catch (error: any) {
      console.error(error);
      alert('Failed to calculate spot price: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBroadcast = async () => {
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
      alert('Order posted successfully!');
      setQuoteGenerated(false);
      setQuoteDetails(null);

      // Navigate to Bids Exchange tab
      window.dispatchEvent(new Event('shipper:load_posted'));
      localStorage.setItem('tradeflow_load_posted', Date.now().toString());
      window.history.pushState({ tab: 'bids' }, '', '/shipper/bids');
      window.dispatchEvent(new Event('popstate'));
    } catch (error: any) {
      console.error(error);
      alert('Failed to post order: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl shadow-lg shadow-slate-200/40 overflow-hidden">
        <div className="bg-[#1C1C1C]/50 border-b border-[#2E2E2E] px-5 py-4">
          <h2 className="text-base font-bold text-[#EDEDED]">{t('post_new_freight_order')}</h2>
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
          className="bg-[#2E2E2E] border border-[#2E2E2E] hover:bg-[#3E3E3E] text-[#EDEDED] px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
        >
          {t('generate_instant_spot_quote')}
        </button>
      </div>

      {quoteGenerated && (
        <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl p-5 shadow-lg shadow-slate-200/40 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-start">
            <div>
              <span className="inline-block bg-[#181818] text-[#EDEDED] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[#2E2E2E] mb-1.5">{t('dynamic_pricing_engine')}</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-[#EDEDED] tracking-tight">{calculatedPrice.toLocaleString()} ETB</span>
              <p className="text-[11px] font-medium text-[#8F8F8F]">~${Math.round(calculatedPrice / 118).toLocaleString()} USD</p>
            </div>
          </div>

          <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-lg p-3 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap text-[#8F8F8F] font-medium">
              <span>{t('base_fee')}: {quoteDetails ? Math.round(quoteDetails.breakdown?.base_corridor_rate || 0).toLocaleString() : Math.round(calculatedPrice * 0.75).toLocaleString()}</span>
              <span className="text-[#8F8F8F]">+</span>
              <span>{t('fuel')}: {quoteDetails ? Math.round((quoteDetails.breakdown?.base_corridor_rate || 0) * ((quoteDetails.breakdown?.fuel_multiplier || 1) - 1)).toLocaleString() : Math.round(calculatedPrice * 0.15).toLocaleString()}</span>
              <span className="text-[#8F8F8F]">+</span>
              <span>{t('fees')}: {quoteDetails ? Math.round(calculatedPrice - (quoteDetails.breakdown?.base_corridor_rate || 0) - ((quoteDetails.breakdown?.base_corridor_rate || 0) * ((quoteDetails.breakdown?.fuel_multiplier || 1) - 1))).toLocaleString() : Math.round(calculatedPrice * 0.1).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-[#8F8F8F]">=</span>
              <span className="text-[#EDEDED] font-bold whitespace-nowrap">{t('total')}: {calculatedPrice.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmBroadcast}
            disabled={loading}
            className="w-full bg-[#3ECF8E] hover:bg-[#34b27b] text-black py-2.5 rounded-lg text-xs font-bold shadow-md hover:shadow-[0_0_15px_rgba(62,207,142,0.3)] hover:-translate-y-0.5 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Posting...' : t('confirm_post_load')}
          </button>
        </div>
      )}
    </div>
  );
}
