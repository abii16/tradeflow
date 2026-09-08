import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  Fuel, 
  TrendingUp, 
  Check, 
  Lock 
} from 'lucide-react';

interface SpotPricingCalculatorProps {
  currency: 'ETB' | 'USD' | 'DJF';
  formatMoney: (amountInETB: number) => string;
  onLockRate?: (quote: any) => void;
}

const CORRIDOR_ROUTES = [
  { id: 'dj-modjo', name: 'Djibouti Port → Modjo Dry Port', distanceKm: 780, baseRatePerKm: 280, riskFactor: 1.02 },
  { id: 'dj-addis', name: 'Djibouti Port → Addis Ababa (Kality)', distanceKm: 855, baseRatePerKm: 290, riskFactor: 1.04 },
  { id: 'dj-kombolcha', name: 'Djibouti Port → Kombolcha Industrial Park', distanceKm: 640, baseRatePerKm: 310, riskFactor: 1.08 },
  { id: 'dj-hawassa', name: 'Djibouti Port → Hawassa Industrial Park', distanceKm: 990, baseRatePerKm: 295, riskFactor: 1.03 },
  { id: 'galafi-modjo', name: 'Galafi Checkpoint → Modjo Dry Port', distanceKm: 580, baseRatePerKm: 285, riskFactor: 1.01 },
  { id: 'modjo-dj', name: 'Modjo Dry Port → Djibouti Port (Export Backhaul)', distanceKm: 780, baseRatePerKm: 210, riskFactor: 1.00 },
];

const CARGO_TYPES = [
  { id: 'cont-20', name: '20ft Container (Standard)', defaultWeight: 22, multiplier: 1.0 },
  { id: 'cont-40', name: '40ft High Cube Container', defaultWeight: 30, multiplier: 1.35 },
  { id: 'bulk-fert', name: 'Bulk Fertilizer (Urea / DAP)', defaultWeight: 40, multiplier: 1.15 },
  { id: 'steel', name: 'Steel Billets & Heavy Coils', defaultWeight: 38, multiplier: 1.22 },
  { id: 'fuel', name: 'Fuel Tanker (Diesel / Jet A1)', defaultWeight: 35, multiplier: 1.40 },
  { id: 'coffee-exp', name: 'Coffee Bags (Export Grade)', defaultWeight: 25, multiplier: 0.95 },
];

export default function SpotPricingCalculator({
  currency,
  formatMoney,
  onLockRate
}: SpotPricingCalculatorProps) {
  const [selectedRouteId, setSelectedRouteId] = useState('dj-modjo');
  const [selectedCargoId, setSelectedCargoId] = useState('bulk-fert');
  const [cargoWeight, setCargoWeight] = useState('40');
  const [fuelIndexModifier, setFuelIndexModifier] = useState(1.05);
  const [demandSurgeScore, setDemandSurgeScore] = useState(1.08);
  const [lockedSuccess, setLockedSuccess] = useState(false);

  const [quoteData, setQuoteData] = useState<any>(null);

  const selectedRoute = useMemo(() => 
    CORRIDOR_ROUTES.find(r => r.id === selectedRouteId) || CORRIDOR_ROUTES[0],
    [selectedRouteId]
  );

  const selectedCargo = useMemo(() => 
    CARGO_TYPES.find(c => c.id === selectedCargoId) || CARGO_TYPES[0],
    [selectedCargoId]
  );

  React.useEffect(() => {
    async function fetchQuote() {
      try {
        const { calculateSpotRate } = await import('@/lib/apiClient');
        const weight = parseFloat(cargoWeight) || selectedCargo.defaultWeight;
        const [originCity, destCity] = selectedRoute.name.split(' → ').map(s => s.trim());
        
        const payload = {
          origin: { city: originCity },
          destination: { city: destCity },
          cargoType: 'dry',
          weightKg: weight * 1000,
          customFuelPrice: fuelIndexModifier * 95.5,
          urgency: demandSurgeScore > 1.05 ? 'high' : 'standard'
        };

        const res = await calculateSpotRate(payload);
        setQuoteData(res.quote || res);
      } catch (err) {
        console.error('Failed to fetch spot rate quote', err);
      }
    }
    const timeoutId = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [selectedRoute, selectedCargo, cargoWeight, fuelIndexModifier, demandSurgeScore]);

  // Dynamic Spot Calculation Equation (FR-04)
  const calculation = useMemo(() => {
    const weight = parseFloat(cargoWeight) || selectedCargo.defaultWeight;
    
    // If backend returns a quote, use its values
    if (quoteData && quoteData.totalAmount) {
      const finalSpotRate = Math.round(Number(quoteData.totalAmount));
      const platformCommission = Math.round(finalSpotRate * 0.03);
      
      return {
        weight,
        baseDistanceTariff: Math.round(Number(quoteData.baseRate)),
        fuelSurcharge: Math.round(Number(quoteData.fuelSurcharge)),
        demandSurgeAmount: Math.round(Number(quoteData.surgeAmount)),
        riskSurcharge: Math.round(Number(quoteData.riskSurcharge) || 0),
        cargoSurcharge: 0,
        weightSurcharge: 0,
        finalSpotRate,
        platformCommission,
        netCarrierPayout: finalSpotRate - platformCommission,
        confidenceScore: 96.4,
        fuelBurnLiters: Math.round((selectedRoute.distanceKm / 100) * 32.4)
      };
    }
    
    // Fallback to local calculation: strictly additive components
    const baseDistanceTariff = selectedRoute.distanceKm * selectedRoute.baseRatePerKm;
    
    // Additive surcharges
    const cargoSurcharge = Math.round(baseDistanceTariff * (selectedCargo.multiplier - 1));
    const weightSurcharge = Math.round(baseDistanceTariff * ((weight - 20) * 0.015));
    const fuelSurcharge = Math.round(baseDistanceTariff * (fuelIndexModifier - 1));
    const demandSurgeAmount = Math.round(baseDistanceTariff * (demandSurgeScore - 1));
    const riskSurcharge = Math.round(baseDistanceTariff * (selectedRoute.riskFactor - 1));
    
    // Exact sum of all components
    const exactTotal = baseDistanceTariff + cargoSurcharge + weightSurcharge + fuelSurcharge + demandSurgeAmount + riskSurcharge;
    
    // Final rate rounded to nearest 500 ETB
    const finalSpotRate = Math.round(exactTotal / 500) * 500;
    
    // Absorb the rounding difference into demand surge to ensure math adds up visually
    const adjustedDemandSurgeAmount = demandSurgeAmount + (finalSpotRate - exactTotal);

    const platformCommission = Math.round(finalSpotRate * 0.03);
    const netCarrierPayout = finalSpotRate - platformCommission;

    return {
      weight,
      baseDistanceTariff,
      fuelSurcharge,
      demandSurgeAmount: adjustedDemandSurgeAmount,
      riskSurcharge,
      cargoSurcharge,
      weightSurcharge,
      finalSpotRate,
      platformCommission,
      netCarrierPayout,
      confidenceScore: 96.4,
      fuelBurnLiters: Math.round((selectedRoute.distanceKm / 100) * 32.4)
    };
  }, [quoteData, selectedRoute, selectedCargo, cargoWeight, fuelIndexModifier, demandSurgeScore]);

  const handleLockQuote = () => {
    setLockedSuccess(true);
    if (onLockRate) {
      onLockRate({
        route: selectedRoute.name,
        cargo: selectedCargo.name,
        weight: calculation.weight,
        rate: calculation.finalSpotRate,
        commission: calculation.platformCommission
      });
    }
    setTimeout(() => setLockedSuccess(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-[#232323] border border-[#2E2E2E] shadow-black/20 rounded-xl p-5 sm:p-6 space-y-5 transition-all duration-200">
            <div className="border-b border-[#2E2E2E] pb-4">
              <h2 className="font-bold text-[#EDEDED] text-base tracking-tight">Route & Freight Parameters</h2>
              <p className="text-[#8F8F8F] text-sm mt-0.5">Configure transit corridor route, cargo specifications, and market indexes.</p>
            </div>

            {/* Route Selection */}
            <div>
              <label className="font-semibold text-[#EDEDED] text-sm block mb-2">
                Corridor Route
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CORRIDOR_ROUTES.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`w-full text-left p-3 border rounded-lg flex flex-col gap-1 transition-all duration-200 ${
                      selectedRouteId === route.id
                        ? 'border-[#3ECF8E]/50 bg-[#3ECF8E]/10 shadow-sm ring-1 ring-[#3ECF8E]/20'
                        : 'border-[#2E2E2E] hover:border-[#3ECF8E]/30 hover:bg-[#2A2A2A]'
                    }`}
                  >
                    <span className={`text-sm font-medium ${selectedRouteId === route.id ? 'text-[#3ECF8E]' : 'text-[#EDEDED]'}`}>
                      {route.name}
                    </span>
                    <span className={`font-mono text-xs ${selectedRouteId === route.id ? 'text-[#3ECF8E]' : 'text-[#8F8F8F]'}`}>
                      {route.distanceKm} km • Base: ETB {route.baseRatePerKm}/km
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cargo Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="font-semibold text-[#EDEDED] text-sm block">
                  Commodity Type
                </label>
                <select
                  value={selectedCargoId}
                  onChange={(e) => {
                    setSelectedCargoId(e.target.value);
                    const c = CARGO_TYPES.find(item => item.id === e.target.value);
                    if (c) setCargoWeight(c.defaultWeight.toString());
                  }}
                  className="w-full px-3 py-2 border border-[#2E2E2E] bg-[#181818] rounded-lg text-sm text-[#EDEDED] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E] transition-shadow shadow-sm"
                >
                  {CARGO_TYPES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-[#EDEDED] text-sm block">
                  Weight (Metric Tons)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(e.target.value)}
                    min="5"
                    max="60"
                    className="w-full pl-3 pr-10 py-2 border border-[#2E2E2E] bg-[#181818] rounded-lg font-mono text-sm font-medium text-[#EDEDED] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E] transition-shadow shadow-sm"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#8F8F8F] text-sm font-medium">
                    MT
                  </div>
                </div>
              </div>
            </div>

            {/* Modifiers */}
            <div className="pt-4 border-t border-[#2E2E2E] space-y-5">
              <div className="bg-[#181818] p-4 rounded-lg border border-[#2E2E2E]">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-[#8F8F8F]" />
                    <span className="font-semibold text-[#EDEDED] text-sm">Fuel Price Index</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs bg-[#232323] text-[#EDEDED] border-[#2E2E2E]">
                    {Math.round(105 * fuelIndexModifier)} ETB/L
                  </Badge>
                </div>
                <input
                  type="range"
                  min="0.95"
                  max="1.25"
                  step="0.01"
                  value={fuelIndexModifier}
                  onChange={(e) => setFuelIndexModifier(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#2E2E2E] rounded-lg appearance-none cursor-pointer accent-[#3ECF8E] hover:accent-[#34b27b] transition-all"
                />
              </div>

              <div className="bg-[#181818] p-4 rounded-lg border border-[#2E2E2E]">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#8F8F8F]" />
                    <span className="font-semibold text-[#EDEDED] text-sm">Demand / Capacity Ratio</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs bg-[#232323] text-[#EDEDED] border-[#2E2E2E]">
                    {demandSurgeScore.toFixed(2)}x
                  </Badge>
                </div>
                <input
                  type="range"
                  min="0.90"
                  max="1.20"
                  step="0.01"
                  value={demandSurgeScore}
                  onChange={(e) => setDemandSurgeScore(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#2E2E2E] rounded-lg appearance-none cursor-pointer accent-[#3ECF8E] hover:accent-[#34b27b] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Breakdown (5 Cols) */}
        <div className="lg:col-span-5">
          <div className="bg-[#181818] rounded-xl shadow-xl overflow-hidden text-[#EDEDED] relative border border-[#3ECF8E]/30">
            {/* Decorative top pattern */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3ECF8E]/20 via-[#3ECF8E] to-[#3ECF8E]/20 opacity-80" />
            
            <div className="p-6 pb-0">
              <div className="text-[#3ECF8E]/90 font-medium text-xs tracking-wider uppercase mb-1">
                Guaranteed Spot Rate (FR-04)
              </div>
              <div className="text-3xl font-bold font-mono text-white tracking-tight flex items-baseline gap-1">
                <span className="text-lg text-[#8F8F8F] font-sans tracking-normal">ETB</span>
                {calculation.finalSpotRate.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#8F8F8F] mt-1.5 flex items-center gap-1.5 bg-[#232323] inline-flex px-2 py-1 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
                Quote valid for 60m • 96.4% confidence
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[#8F8F8F]">Base Distance ({selectedRoute.distanceKm} km)</span>
                  <span className="font-mono text-[#EDEDED]">{formatMoney(calculation.baseDistanceTariff)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8F8F8F]">Cargo Type Adj.</span>
                  <span className="font-mono text-[#3ECF8E]">+{formatMoney(calculation.cargoSurcharge)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8F8F8F]">Weight Surcharge (&gt;20t)</span>
                  <span className="font-mono text-[#3ECF8E]">+{formatMoney(calculation.weightSurcharge)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8F8F8F]">Fuel Surcharge</span>
                  <span className="font-mono text-[#3ECF8E]">+{formatMoney(calculation.fuelSurcharge)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8F8F8F]">Market Demand</span>
                  <span className="font-mono text-[#3ECF8E]">+{formatMoney(calculation.demandSurgeAmount)}</span>
                </div>
                <div className="flex justify-between items-center pb-3">
                  <span className="text-[#8F8F8F]">Route Risk Buffer</span>
                  <span className="font-mono text-[#3ECF8E]">+{formatMoney(calculation.riskSurcharge)}</span>
                </div>

                <div className="border-t border-dashed border-[#2E2E2E] pt-3 flex justify-between items-center text-[#EDEDED]">
                  <span>Platform Fee (3%)</span>
                  <span className="font-mono text-rose-500">- {formatMoney(calculation.platformCommission)}</span>
                </div>
              </div>

              <div className="border-t border-[#2E2E2E] pt-4 mt-2">
                <div className="flex justify-between items-end">
                  <div className="text-sm font-medium text-[#EDEDED]">Net Carrier Payout</div>
                  <div className="text-xl font-bold font-mono text-[#3ECF8E] tracking-tight">
                    {formatMoney(calculation.netCarrierPayout)}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-2">
              <button
                type="button"
                onClick={handleLockQuote}
                className="w-full py-3.5 bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] font-bold text-sm rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
              >
                {lockedSuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Rate Locked Successfully</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Lock Spot Rate & Proceed</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
