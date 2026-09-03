import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Scale, Package, ChevronDown, Clock } from 'lucide-react';
import { postLoad, calculateSpotRate } from '@/lib/apiClient';

export default function FreightOrderForm() {
  const { t } = useTranslation();
  const [quoteGenerated, setQuoteGenerated] = useState(false);
  const [leadTime, setLeadTime] = useState('24h');
  const [loading, setLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [formData, setFormData] = useState({
    origin: 'Djibouti Port / Doraleh Container Terminal (DCT)',
    cargoType: '30T Construction Rebar (Flatbed)',
    destination: 'Modjo Dry Port & Terminal, Ethiopia',
    weightKg: '32000'
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
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-800">Post New Freight Order</h2>
        </div>

        <form onSubmit={handleRequestQuote} className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Origin</Label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select name="origin" value={formData.origin} onChange={handleChange} required className="w-full pl-9 pr-8 bg-slate-50 border border-slate-200 h-9 text-xs font-medium rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer">
                  <option value="Djibouti Port / Doraleh Container Terminal (DCT)">Djibouti Port / Doraleh Container Terminal (DCT)</option>
                  <option value="Djibouti Free Trade Zone (DFTZ)">Djibouti Free Trade Zone (DFTZ)</option>
                  <option value="Galafi Border Terminal (Inbound)">Galafi Border Terminal (Inbound)</option>
                  <option value="Modjo Dry Port & Terminal (Outbound Export)">Modjo Dry Port & Terminal (Outbound Export)</option>
                  <option value="Addis Ababa / Kality Customs Branch">Addis Ababa / Kality Customs Branch</option>
                  <option value="Dire Dawa Dry Port">Dire Dawa Dry Port</option>
                  <option value="Semera Logistics Hub">Semera Logistics Hub</option>
                  <option value="Kombolcha Dry Port">Kombolcha Dry Port</option>
                  <option value="Hawassa Industrial Park Terminal">Hawassa Industrial Park Terminal</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Cargo Details</Label>
              <div className="relative">
                <Package size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select name="cargoType" value={formData.cargoType} onChange={handleChange} required className="w-full pl-9 pr-8 bg-slate-50 border border-slate-200 h-9 text-xs font-medium rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer">
                  <option value="30T Construction Rebar (Flatbed)">30T Construction Rebar (Flatbed)</option>
                  <option value="20ft Standard Dry Container (FCL)">20ft Standard Dry Container (FCL)</option>
                  <option value="40ft High Cube Container (FCL)">40ft High Cube Container (FCL)</option>
                  <option value="40T Bulk Agricultural / Coffee Beans (High-Side)">40T Bulk Agricultural / Coffee Beans (High-Side)</option>
                  <option value="Heavy Machinery / Industrial Equipment (Lowbed)">Heavy Machinery / Industrial Equipment (Lowbed)</option>
                  <option value="Refrigerated Perishables / Pharma (Reefer)">Refrigerated Perishables / Pharma (Reefer)</option>
                  <option value="Bulk Petroleum / Fuel Tanker">Bulk Petroleum / Fuel Tanker</option>
                  <option value="General Palletized Merchandise (Box Truck)">General Palletized Merchandise (Box Truck)</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Destination</Label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select name="destination" value={formData.destination} onChange={handleChange} required className="w-full pl-9 pr-8 bg-slate-50 border border-slate-200 h-9 text-xs font-medium rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer">
                  <option value="Modjo Dry Port & Terminal, Ethiopia">Modjo Dry Port & Terminal, Ethiopia</option>
                  <option value="Addis Ababa / Kality Customs Clearance Center">Addis Ababa / Kality Customs Clearance Center</option>
                  <option value="Djibouti Container Terminal (Export Exit)">Djibouti Container Terminal (Export Exit)</option>
                  <option value="Dire Dawa Free Trade Zone">Dire Dawa Free Trade Zone</option>
                  <option value="Semera Freight Hub">Semera Freight Hub</option>
                  <option value="Kombolcha Dry Port">Kombolcha Dry Port</option>
                  <option value="Hawassa Industrial Park">Hawassa Industrial Park</option>
                  <option value="Mekelle Hub">Mekelle Hub</option>
                  <option value="Adama Industrial Hub">Adama Industrial Hub</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Weight & Volume</Label>
              <div className="relative">
                <Scale size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} required className="pl-9 bg-slate-50 border border-slate-200 h-9 text-xs font-medium rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="Weight in kg" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <Label className="text-xs font-semibold text-slate-700">Lead Time Window</Label>
            <div className="relative">
              <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                name="leadTime" 
                value={leadTime} 
                onChange={(e) => setLeadTime(e.target.value)} 
                required 
                className="w-full pl-9 pr-8 bg-slate-50 border border-slate-200 h-9 text-xs font-medium rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="12h">Express (12h) - High priority surcharge</option>
                <option value="24h">Standard (24h) - Standard corridor rate</option>
                <option value="48h">Flexible (48h) - Backhaul discount</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Includes corridor tolls, fuel surcharge & VAT</span>
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-100 border border-slate-300 text-slate-800 px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-200 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
            >
              Generate Instant Spot Quote
            </button>
          </div>
        </form>
      </div>

      {quoteGenerated && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-start">
            <div>
              <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-200 mb-1.5">Dynamic Pricing Engine (FR-02.3)</span>
              <h3 className="text-sm font-bold text-slate-800">Calculated Corridor Benchmark</h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-slate-800 tracking-tight">{calculatedPrice.toLocaleString()} ETB</span>
              <p className="text-[11px] font-medium text-slate-500">~${Math.round(calculatedPrice / 118).toLocaleString()} USD</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono flex items-center justify-between">
             <div className="flex items-center gap-2 flex-wrap text-slate-600 font-medium">
                <span>Base: {quoteDetails ? Math.round(quoteDetails.breakdown?.base_corridor_rate || 0).toLocaleString() : Math.round(calculatedPrice * 0.75).toLocaleString()}</span>
                <span className="text-slate-300">+</span>
                <span>Fuel: {quoteDetails ? Math.round((quoteDetails.breakdown?.base_corridor_rate || 0) * ((quoteDetails.breakdown?.fuel_multiplier || 1) - 1)).toLocaleString() : Math.round(calculatedPrice * 0.15).toLocaleString()}</span>
                <span className="text-slate-300">+</span>
                <span>Fees: {quoteDetails ? Math.round(calculatedPrice - (quoteDetails.breakdown?.base_corridor_rate || 0) - ((quoteDetails.breakdown?.base_corridor_rate || 0) * ((quoteDetails.breakdown?.fuel_multiplier || 1) - 1))).toLocaleString() : Math.round(calculatedPrice * 0.1).toLocaleString()}</span>
             </div>
             <div className="flex items-center gap-2 ml-4">
                <span className="text-slate-300">=</span>
                <span className="text-slate-800 font-bold whitespace-nowrap">Total: {calculatedPrice.toLocaleString()}</span>
             </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmBroadcast}
            disabled={loading}
            className="w-full bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-900 py-3 rounded-lg text-sm font-bold shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Confirm & Post Load'}
          </button>
        </div>
      )}
    </div>
  );
}
