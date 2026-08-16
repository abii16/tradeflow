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

  const selectedRoute = useMemo(() => 
    CORRIDOR_ROUTES.find(r => r.id === selectedRouteId) || CORRIDOR_ROUTES[0],
    [selectedRouteId]
  );

  const selectedCargo = useMemo(() => 
    CARGO_TYPES.find(c => c.id === selectedCargoId) || CARGO_TYPES[0],
    [selectedCargoId]
  );

  // Dynamic Spot Calculation Equation (FR-04)
  const calculation = useMemo(() => {
    const weight = parseFloat(cargoWeight) || selectedCargo.defaultWeight;
    const baseDistanceTariff = selectedRoute.distanceKm * selectedRoute.baseRatePerKm;
    const weightTonnageFactor = 1 + (weight - 20) * 0.015;
    const fuelAdjustedBase = baseDistanceTariff * fuelIndexModifier * selectedCargo.multiplier;
    const subtotal = fuelAdjustedBase * weightTonnageFactor * selectedRoute.riskFactor;
    const finalSpotRate = Math.round(subtotal * demandSurgeScore / 500) * 500;
    
    const contractBaseline = Math.round(baseDistanceTariff * selectedCargo.multiplier * 1.02 / 500) * 500;
    const divergencePercent = ((finalSpotRate - contractBaseline) / contractBaseline) * 100;

    const platformCommission = Math.round(finalSpotRate * 0.03);
    const netCarrierPayout = finalSpotRate - platformCommission;

    return {
      weight,
      baseDistanceTariff,
      fuelSurcharge: Math.round(baseDistanceTariff * (fuelIndexModifier - 1)),
      demandSurgeAmount: Math.round(subtotal * (demandSurgeScore - 1)),
      riskSurcharge: Math.round(subtotal * (selectedRoute.riskFactor - 1)),
      finalSpotRate,
      contractBaseline,
      divergencePercent,
      platformCommission,
      netCarrierPayout,
      confidenceScore: 96.4,
      fuelBurnLiters: Math.round((selectedRoute.distanceKm / 100) * 32.4)
    };
  }, [selectedRoute, selectedCargo, cargoWeight, fuelIndexModifier, demandSurgeScore]);

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Input Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-4 text-xs hover:border-slate-300 transition-colors">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-semibold text-slate-900 text-sm">Route & Freight Parameters</h2>
              <p className="text-slate-500">Configure transit corridor route, cargo specifications, and market indexes.</p>
            </div>

            {/* Route Selection */}
            <div>
              <label className="font-medium text-slate-700 block mb-1.5">
                Corridor Route
              </label>
              <div className="space-y-1.5">
                {CORRIDOR_ROUTES.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`w-full text-left p-2.5 border rounded-md flex items-center justify-between transition-colors ${
                      selectedRouteId === route.id
                        ? 'border-slate-900 bg-slate-50 font-medium text-slate-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{route.name}</span>
                    <span className="font-mono text-slate-500 text-[11px]">{route.distanceKm} km</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cargo Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Commodity Type
                </label>
                <select
                  value={selectedCargoId}
                  onChange={(e) => {
                    setSelectedCargoId(e.target.value);
                    const c = CARGO_TYPES.find(item => item.id === e.target.value);
                    if (c) setCargoWeight(c.defaultWeight.toString());
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-slate-900 bg-white"
                >
                  {CARGO_TYPES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Weight (Metric Tons)
                </label>
                <input
                  type="number"
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                  min="5"
                  max="60"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            {/* Modifiers */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-700">Fuel Price Index:</span>
                  <span className="font-mono text-slate-900">{Math.round(105 * fuelIndexModifier)} ETB/L</span>
                </div>
                <input
                  type="range"
                  min="0.95"
                  max="1.25"
                  step="0.01"
                  value={fuelIndexModifier}
                  onChange={(e) => setFuelIndexModifier(parseFloat(e.target.value))}
                  className="w-full accent-slate-900 h-1.5 bg-slate-200 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-700">Demand / Capacity Ratio:</span>
                  <span className="font-mono text-slate-900">{demandSurgeScore.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.90"
                  max="1.20"
                  step="0.01"
                  value={demandSurgeScore}
                  onChange={(e) => setDemandSurgeScore(parseFloat(e.target.value))}
                  className="w-full accent-slate-900 h-1.5 bg-slate-200 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Breakdown (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-3">
              <div className="text-slate-500 font-medium">Guaranteed Spot Rate (FR-04)</div>
              <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight mt-1">
                {formatMoney(calculation.finalSpotRate)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Quote valid for 60 minutes • 96.4% confidence score
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Base Distance Tariff ({selectedRoute.distanceKm} km)</span>
                <span className="font-mono text-slate-900">{formatMoney(calculation.baseDistanceTariff)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fuel Surcharge (~{calculation.fuelBurnLiters} L)</span>
                <span className="font-mono text-slate-900">+{formatMoney(calculation.fuelSurcharge)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Market Demand Adjustment</span>
                <span className="font-mono text-slate-900">+{formatMoney(calculation.demandSurgeAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Route Risk & Checkpoint Buffer</span>
                <span className="font-mono text-slate-900">+{formatMoney(calculation.riskSurcharge)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 font-medium text-slate-700">
                <span>Platform Commission (3%)</span>
                <span className="font-mono text-slate-900">{formatMoney(calculation.platformCommission)}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-semibold pt-1">
                <span>Net Carrier Payout</span>
                <span className="font-mono">{formatMoney(calculation.netCarrierPayout)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLockQuote}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md transition-colors flex items-center justify-center gap-1.5"
            >
              {lockedSuccess ? (
                <>
                  <Check size={14} />
                  <span>Spot Rate Locked</span>
                </>
              ) : (
                <>
                  <Lock size={14} />
                  <span>Lock Spot Rate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
