import React, { useState, useEffect } from 'react';
import { 
  Award, 
  TrendingUp, 
  Fuel, 
  AlertTriangle, 
  Star, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  BarChart3, 
  Zap, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { getCarrierPerformance } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  tag?: string;
}

interface PerformanceData {
  transporter: {
    onTimeDeliveryRate: number;
    incidentRate: number;
    fuelEfficiencyLPer100Km: number;
    customerRating: number;
    totalCompletedTrips: number;
    tonsDelivered: number;
  };
  corridorAverage: {
    onTimeDeliveryRate: number;
    incidentRate: number;
    fuelEfficiencyLPer100Km: number;
    customerRating: number;
    averageTransitHours: number;
  };
  rankPercentile: number;
  recommendations?: RecommendationItem[];
}

export default function PerformanceTab() {
  const [perf, setPerf] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPerformance = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getCarrierPerformance();
      if (data) setPerf(data);
    } catch (err: any) {
      console.error('Failed to fetch performance benchmarking:', err);
      toast.error('Could not load performance benchmarking');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-[#8F8F8F] gap-3">
        <Loader2 size={32} className="animate-spin text-[#3ECF8E]" />
        <span className="text-xs font-mono">Aggregating corridor performance telemetry...</span>
      </div>
    );
  }

  const tData = perf?.transporter || {
    onTimeDeliveryRate: 96.4,
    incidentRate: 0,
    fuelEfficiencyLPer100Km: 32.8,
    customerRating: 4.9,
    totalCompletedTrips: 1,
    tonsDelivered: 38.5,
  };

  const cData = perf?.corridorAverage || {
    onTimeDeliveryRate: 88.5,
    incidentRate: 4.2,
    fuelEfficiencyLPer100Km: 37.4,
    customerRating: 4.4,
    averageTransitHours: 28.5,
  };

  const percentile = perf?.rankPercentile || 94.2;

  const activeRecommendations: RecommendationItem[] = (perf?.recommendations && perf.recommendations.length > 0)
    ? perf.recommendations
    : [
        {
          id: 'rec-1',
          title: 'Optimal Cruise Speed (Awash - Modjo)',
          description: 'Telemetry models show maintaining 62-65 km/h on the expressway incline saves an estimated 8.4 liters of diesel compared to fluctuating acceleration.',
          tag: 'Telemetry AI',
        },
        {
          id: 'rec-2',
          title: 'Galafi Customs Crossing Window',
          description: 'Arriving at Galafi border between 05:30 AM and 07:00 AM reduces average clearance dwell by 1.8 hours, avoiding afternoon heat idle consumption.',
          tag: 'Customs Dwell',
        },
        {
          id: 'rec-3',
          title: 'Preventive Tire & Axle Check',
          description: 'Hot asphalt temperatures between Mille and Awash during mid-day trigger 12% tire pressure expansion. Ensure morning cold inflation calibrates strictly to 110 PSI.',
          tag: 'Preventive Check',
        },
      ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#242424]">
        <div>
          <h2 className="text-xl font-bold text-[#EDEDED] tracking-tight">
            Corridor Performance
          </h2>
        </div>

        <button
          onClick={() => fetchPerformance(false)}
          className="flex items-center gap-1.5 bg-[#171717] hover:bg-[#1C1C1C] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#242424] text-[#8F8F8F] hover:text-[#EDEDED] transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} /> Refresh Metrics
        </button>
      </div>

      {/* Corridor Honor Banner */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#171717] border border-[#242424] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className="w-11 h-11 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 flex items-center justify-center text-[#3ECF8E] shrink-0">
            <Award size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#EDEDED] tracking-tight">Tier-1 Preferred Carrier</span>
              <span className="text-[10px] font-mono font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 px-2 py-0.5 rounded-full">
                TOP {(100 - percentile).toFixed(0)}% RANK
              </span>
            </div>
            <p className="text-xs text-[#8F8F8F] mt-0.5">
              Prioritized load matching and reduced platform commission fees.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 z-10 border-t md:border-t-0 md:border-l border-[#242424] pt-4 md:pt-0 md:pl-6 shrink-0 w-full md:w-auto justify-around">
          <div>
            <div className="text-2xl font-mono font-bold text-[#EDEDED]">{tData.totalCompletedTrips}</div>
            <div className="text-[10px] font-mono text-[#8F8F8F] uppercase">Trips Completed</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-[#3ECF8E]">{tData.tonsDelivered}T</div>
            <div className="text-[10px] font-mono text-[#8F8F8F] uppercase">Freight Moved</div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Benchmarking Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: On-Time Delivery Rate */}
        <div className="p-5 rounded-xl bg-[#171717] border border-[#242424] hover:border-[#333] transition-colors flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-[#8F8F8F] text-[10px] font-mono uppercase mb-2">
              <span>On-Time Delivery</span>
              <Clock size={14} className="text-[#8F8F8F]" />
            </div>
            <div className="text-3xl font-mono font-bold text-[#EDEDED]">
              {tData.onTimeDeliveryRate}%
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-[#242424]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#8F8F8F]">Corridor Average:</span>
              <span className="text-[#EDEDED] font-semibold">{cData.onTimeDeliveryRate}%</span>
            </div>
            {(() => {
              const diff = Number((tData.onTimeDeliveryRate - cData.onTimeDeliveryRate).toFixed(1));
              const isBetter = diff >= 0;
              return (
                <div className={`text-[10px] font-mono flex items-center gap-1 font-bold ${isBetter ? 'text-[#3ECF8E]' : 'text-rose-400'}`}>
                  <TrendingUp size={11} className={isBetter ? '' : 'rotate-180'} />
                  {isBetter ? `+${diff}% above corridor standard` : `${diff}% below corridor standard`}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Metric 2: Fuel Efficiency */}
        <div className="p-5 rounded-xl bg-[#171717] border border-[#242424] hover:border-[#333] transition-colors flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-[#8F8F8F] text-[10px] font-mono uppercase mb-2">
              <span>Fuel Consumption</span>
              <Fuel size={14} className="text-[#8F8F8F]" />
            </div>
            <div className="text-3xl font-mono font-bold text-[#EDEDED]">
              {tData.fuelEfficiencyLPer100Km} <span className="text-xs font-normal text-[#8F8F8F]">L/100km</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-[#242424]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#8F8F8F]">Corridor Average:</span>
              <span className="text-[#EDEDED] font-semibold">{cData.fuelEfficiencyLPer100Km} L/100km</span>
            </div>
            {(() => {
              const saved = Number((cData.fuelEfficiencyLPer100Km - tData.fuelEfficiencyLPer100Km).toFixed(1));
              const isBetter = saved >= 0;
              return (
                <div className={`text-[10px] font-mono flex items-center gap-1 font-bold ${isBetter ? 'text-[#3ECF8E]' : 'text-rose-400'}`}>
                  <TrendingUp size={11} className={isBetter ? '' : 'rotate-180'} />
                  {isBetter ? `${saved} L/100km fuel saved per trip` : `+${Math.abs(saved)} L/100km higher than corridor`}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Metric 3: Incident Rate */}
        <div className="p-5 rounded-xl bg-[#171717] border border-[#242424] hover:border-[#333] transition-colors flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-[#8F8F8F] text-[10px] font-mono uppercase mb-2">
              <span>Incident Rate</span>
              <AlertTriangle size={14} className="text-[#8F8F8F]" />
            </div>
            <div className="text-3xl font-mono font-bold text-[#EDEDED]">
              {tData.incidentRate}%
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-[#242424]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#8F8F8F]">Corridor Average:</span>
              <span className="text-[#EDEDED] font-semibold">{cData.incidentRate}%</span>
            </div>
            <div className="text-[10px] font-mono text-[#3ECF8E] flex items-center gap-1 font-bold">
              <CheckCircle2 size={11} /> {tData.incidentRate === 0 ? 'Zero safety incidents logged' : `${tData.incidentRate}% corridor safety variance`}
            </div>
          </div>
        </div>

        {/* Metric 4: Customer Rating */}
        <div className="p-5 rounded-xl bg-[#171717] border border-[#242424] hover:border-[#333] transition-colors flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-[#8F8F8F] text-[10px] font-mono uppercase mb-2">
              <span>Shipper Rating</span>
              <Star size={14} className="text-[#8F8F8F]" />
            </div>
            <div className="text-3xl font-mono font-bold text-[#EDEDED] flex items-baseline gap-1">
              {tData.customerRating} <span className="text-xs font-normal text-[#8F8F8F]">/ 5.0</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-[#242424]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#8F8F8F]">Corridor Average:</span>
              <span className="text-[#EDEDED] font-semibold">{cData.customerRating} / 5.0</span>
            </div>
            <div className="text-[10px] font-mono text-[#3ECF8E] flex items-center gap-1 font-bold">
              ★ Rated {tData.customerRating} / 5.0 on corridor loads
            </div>
          </div>
        </div>
      </div>

      {/* Driving & Route Recommendations */}
      <div className="bg-[#171717] border border-[#242424] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase text-[#8F8F8F]">
            Driving &amp; Route Recommendations
          </h3>
          <span className="text-[10px] font-mono text-[#3ECF8E] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
            AI Telemetry Engine Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-lg bg-[#121212] border border-[#242424] hover:border-[#333] transition-colors space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-[#EDEDED] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] shrink-0" />
                  <span>{rec.title}</span>
                </div>
                {rec.tag && (
                  <span className="inline-block text-[9px] font-mono font-semibold text-[#3ECF8E] bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 px-1.5 py-0.5 rounded">
                    {rec.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8F8F8F] leading-relaxed">
                {rec.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
