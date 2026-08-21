import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Scale, Package } from 'lucide-react';
import { postLoad } from '@/lib/apiClient';

export default function FreightOrderForm() {
  const { t } = useTranslation();
  const [quoteGenerated, setQuoteGenerated] = useState(false);
  const [leadTime, setLeadTime] = useState('24h');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    origin: 'Djibouti Container Terminal',
    cargoType: '30T Construction Rebar (Flatbed)',
    destination: 'Modjo Dry Port, Ethiopia',
    weightKg: '32000'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRequestQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteGenerated(true);
  };

  const handleConfirmBroadcast = async () => {
    try {
      setLoading(true);
      await postLoad({
        title: `Freight: ${formData.cargoType}`,
        description: `Deliver ${formData.cargoType} from ${formData.origin} to ${formData.destination}`,
        origin: formData.origin,
        destination: formData.destination,
        weightKg: Number(formData.weightKg),
        cargoType: formData.cargoType,
        budgetAmount: 348000,
        currency: 'ETB',
        expiryHours: leadTime === '12h' ? 12 : leadTime === '24h' ? 24 : 48
      });
      alert('Order broadcasted to exchange successfully!');
      setQuoteGenerated(false);
      // Optional: trigger refresh in parent
      window.dispatchEvent(new Event('shipper:load_posted'));
    } catch (error) {
      console.error(error);
      alert('Failed to broadcast order');
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
                <Input name="origin" value={formData.origin} onChange={handleChange} required className="pl-8 bg-slate-50/50 border-slate-200 h-8 text-xs font-medium rounded text-slate-900 focus:bg-white" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">Cargo Details</Label>
              <div className="relative">
                <Package size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input name="cargoType" value={formData.cargoType} onChange={handleChange} required className="pl-8 bg-slate-50/50 border-slate-200 h-8 text-xs font-medium rounded text-slate-900 focus:bg-white" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">Destination</Label>
              <div className="relative">
                <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input name="destination" value={formData.destination} onChange={handleChange} required className="pl-8 bg-slate-50/50 border-slate-200 h-8 text-xs font-medium rounded text-slate-900 focus:bg-white" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">Weight & Volume</Label>
              <div className="relative">
                <Scale size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} required className="pl-8 bg-slate-50/50 border-slate-200 h-8 text-xs font-medium rounded text-slate-900 focus:bg-white" placeholder="Weight in kg" />
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
        <div className="bg-slate-900 text-white rounded-md p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Dynamic Pricing Engine (FR-02.3)</span>
              <h3 className="text-base font-semibold mt-0.5">Calculated Corridor Benchmark</h3>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-emerald-400">348,000 ETB</span>
              <p className="text-[11px] text-slate-400">~$2,950 USD</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-800 pt-3">
            <div>
              <span className="text-slate-400 text-[11px] block">Transit Estimate</span>
              <span className="font-semibold text-slate-200">18 - 22 Hours</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Verified Fleet Capacity</span>
              <span className="font-semibold text-slate-200">14 Carriers in Galafi</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Smart Contract Status</span>
              <span className="font-semibold text-emerald-400">Escrow Ready</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmBroadcast}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Broadcasting...' : 'Confirm & Broadcast Order to Exchange'}
          </button>
        </div>
      )}
    </div>
  );
}
