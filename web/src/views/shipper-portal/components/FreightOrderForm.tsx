import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Scale, Package } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-md p-4">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Post New Freight Order</h2>
          <p className="text-xs text-slate-500 mt-0.5">Submit cargo details for corridor matching (FR-02)</p>
        </div>

        <form onSubmit={handleRequestQuote} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">Origin</Label>
              <div className="relative">
                <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select name="origin" value={formData.origin} onChange={handleChange} required className="w-full pl-8 pr-3 bg-slate-50/50 border border-slate-200 h-8 text-xs font-medium rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition-colors appearance-none">
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
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">Cargo Details</Label>
              <div className="relative">
                <Package size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select name="cargoType" value={formData.cargoType} onChange={handleChange} required className="w-full pl-8 pr-3 bg-slate-50/50 border border-slate-200 h-8 text-xs font-medium rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition-colors appearance-none">
                  <option value="30T Construction Rebar (Flatbed)">30T Construction Rebar (Flatbed)</option>
                  <option value="20ft Standard Dry Container (FCL)">20ft Standard Dry Container (FCL)</option>
                  <option value="40ft High Cube Container (FCL)">40ft High Cube Container (FCL)</option>
                  <option value="40T Bulk Agricultural / Coffee Beans (High-Side)">40T Bulk Agricultural / Coffee Beans (High-Side)</option>
                  <option value="Heavy Machinery / Industrial Equipment (Lowbed)">Heavy Machinery / Industrial Equipment (Lowbed)</option>
                  <option value="Refrigerated Perishables / Pharma (Reefer)">Refrigerated Perishables / Pharma (Reefer)</option>
                  <option value="Bulk Petroleum / Fuel Tanker">Bulk Petroleum / Fuel Tanker</option>
                  <option value="General Palletized Merchandise (Box Truck)">General Palletized Merchandise (Box Truck)</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">Destination</Label>
              <div className="relative">
                <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select name="destination" value={formData.destination} onChange={handleChange} required className="w-full pl-8 pr-3 bg-slate-50/50 border border-slate-200 h-8 text-xs font-medium rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition-colors appearance-none">
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
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">Weight & Volume</Label>
              <div className="relative">
                <Scale size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} required className="pl-8 bg-slate-50/50 border-slate-200 h-8 text-xs font-medium rounded text-slate-900 focus:bg-white" placeholder="Weight in kg" />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {[
                  { value: '18000', label: '18,000 kg (20ft)' },
                  { value: '28000', label: '28,000 kg (40ft)' },
                  { value: '32000', label: '32,000 kg (Rebar)' },
                  { value: '40000', label: '40,000 kg (Bulk)' }
                ].map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, weightKg: preset.value }))}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-slate-700 mb-1 block">Lead Time Window</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '12h', label: 'Express (12h)', desc: 'High priority surcharge' },
                { id: '24h', label: 'Standard (24h)', desc: 'Standard corridor rate' },
                { id: '48h', label: 'Flexible (48h)', desc: 'Backhaul discount' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLeadTime(opt.id)}
                  className={`p-2.5 border rounded-md text-left transition-all ${
                    leadTime === opt.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className={`text-[11px] mt-0.5 ${leadTime === opt.id ? 'text-slate-300' : 'text-slate-500'}`}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Includes corridor tolls, fuel surcharge & VAT</span>
            <button
              type="submit"
              className="bg-slate-900 text-white px-4 py-2 rounded-md text-xs font-medium hover:bg-slate-800 transition-colors"
            >
              Generate Instant Spot Quote
            </button>
          </div>
        </form>
      </div>

      {quoteGenerated && (
        <div className="bg-white border border-slate-200 text-slate-900 rounded-md p-4 space-y-3 shadow-sm mt-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Dynamic Pricing Engine (FR-02.3)</span>
              <h3 className="text-base font-semibold mt-0.5">Calculated Corridor Benchmark</h3>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-emerald-600">{calculatedPrice.toLocaleString()} ETB</span>
              <p className="text-[11px] text-slate-500">~${Math.round(calculatedPrice / 118).toLocaleString()} USD</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded p-2 text-[11px] font-mono flex items-center justify-between mt-3 text-slate-600">
             <div className="flex items-center gap-1.5 flex-wrap">
                <span>Corridor Base: {quoteDetails ? Math.round(quoteDetails.breakdown?.base_corridor_rate || 0).toLocaleString() : Math.round(calculatedPrice * 0.75).toLocaleString()}</span>
                <span className="text-slate-400">+</span>
                <span>Fuel Index: {quoteDetails ? Math.round((quoteDetails.breakdown?.base_corridor_rate || 0) * ((quoteDetails.breakdown?.fuel_multiplier || 1) - 1)).toLocaleString() : Math.round(calculatedPrice * 0.15).toLocaleString()}</span>
                <span className="text-slate-400">+</span>
                <span>Surcharges: {quoteDetails ? Math.round(calculatedPrice - (quoteDetails.breakdown?.base_corridor_rate || 0) - ((quoteDetails.breakdown?.base_corridor_rate || 0) * ((quoteDetails.breakdown?.fuel_multiplier || 1) - 1))).toLocaleString() : Math.round(calculatedPrice * 0.1).toLocaleString()}</span>
             </div>
             <div className="flex items-center gap-1.5 ml-2">
                <span className="text-slate-400">=</span>
                <span className="text-emerald-700 font-bold whitespace-nowrap">Total: {calculatedPrice.toLocaleString()} ETB</span>
             </div>
          </div>



          <button
            type="button"
            onClick={handleConfirmBroadcast}
            disabled={loading}
            className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Confirm & Post Load'}
          </button>
        </div>
      )}
    </div>
  );
}
