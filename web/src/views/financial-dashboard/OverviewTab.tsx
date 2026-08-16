import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Wallet, 
  ArrowRightLeft, 
  Plus, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Building2, 
  PhoneCall,
  ArrowRight
} from 'lucide-react';

interface OverviewTabProps {
  currency: 'ETB' | 'USD' | 'DJF';
  rates: { USD: number; DJF: number };
  formatMoney: (amountInETB: number) => string;
  onNavigateTab: (tab: string) => void;
}

export default function OverviewTab({
  currency,
  rates,
  formatMoney,
  onNavigateTab
}: OverviewTabProps) {
  const { t } = useTranslation();
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('500000');
  const [paymentChannel, setPaymentChannel] = useState<'telebirr' | 'cbe' | 'awash'>('telebirr');
  const [telebirrPhone, setTelebirrPhone] = useState('0911223344');
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState(false);

  // Balances in base ETB
  const [escrowLocked, setEscrowLocked] = useState(1850000);
  const [availableBalance, setAvailableBalance] = useState(600000);
  const [settledLifetime, setSettledLifetime] = useState(14280000);

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingTopUp(true);
    setTimeout(() => {
      setIsProcessingTopUp(false);
      setTopUpSuccess(true);
      const added = parseFloat(topUpAmount) || 0;
      setAvailableBalance(prev => prev + added);
      setTimeout(() => {
        setTopUpSuccess(false);
        setShowTopUpModal(false);
      }, 1200);
    }, 800);
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards: Simple, Normal Containers, No Gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Escrow Locked */}
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-1 hover:border-slate-300 transition-colors">
          <div className="text-xs text-slate-500 font-medium">Total Escrow Locked</div>
          <div className="text-xl font-bold font-mono text-slate-900 tracking-tight">
            {formatMoney(escrowLocked)}
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            4 in-transit corridor loads
          </div>
        </div>

        {/* Available Balance */}
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">Available Balance</span>
            <button 
              onClick={() => setShowTopUpModal(true)}
              className="text-[11px] font-semibold text-slate-900 hover:underline"
            >
              + Top Up
            </button>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-800 tracking-tight">
            {formatMoney(availableBalance)}
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            Ready for load booking
          </div>
        </div>

        {/* Settled Volume */}
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-1">
          <div className="text-xs text-slate-500 font-medium">Settled Volume (GTV)</div>
          <div className="text-xl font-bold font-mono text-slate-900 tracking-tight">
            {formatMoney(settledLifetime)}
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            84 completed shipments
          </div>
        </div>

        {/* TeleBirr Payout Queue */}
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">Pending Payouts</span>
            <button 
              onClick={() => onNavigateTab('settlements')}
              className="text-[11px] font-semibold text-slate-900 hover:underline"
            >
              Release →
            </button>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tracking-tight">
            {formatMoney(580000)}
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            2 verified PoD waybills
          </div>
        </div>
      </div>

      {/* Main Section: Corridor Stages & Quick Releases */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 cols: Corridor Escrow Status */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Corridor Transit Escrow Breakdown</h2>
                <p className="text-xs text-slate-500">Funds locked along Djibouti Port → Galafi → Modjo Dry Port</p>
              </div>
              <span className="text-xs font-mono text-slate-500">780 km N1</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-md bg-slate-50/50 text-xs hover:border-slate-300 transition-colors">
                <div>
                  <div className="font-semibold text-slate-900">1. Port Departure (Djibouti)</div>
                  <div className="text-slate-500 text-[11px]">Doraleh Container Terminal</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-slate-900">{formatMoney(650000)}</div>
                  <div className="text-[11px] text-slate-500">Locked at origin</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-md bg-slate-50/50 text-xs">
                <div>
                  <div className="font-semibold text-slate-900">2. Customs Bond (Galafi Border)</div>
                  <div className="text-slate-500 text-[11px]">Under customs transit inspection</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-slate-900">{formatMoney(620000)}</div>
                  <div className="text-[11px] text-slate-500">In customs transit</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-md bg-slate-50/50 text-xs">
                <div>
                  <div className="font-semibold text-slate-900">3. Delivery & PoD (Modjo Dry Port)</div>
                  <div className="text-slate-500 text-[11px]">Consignee signed delivery canvas</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-emerald-800">{formatMoney(580000)}</div>
                  <div className="text-[11px] text-emerald-700 font-medium">Eligible for release</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 cols: TeleBirr Actions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-slate-900">Pending TeleBirr Releases</h2>
              <span className="text-xs font-mono text-slate-500">2 queues</span>
            </div>

            <div className="space-y-2">
              <div className="p-3 border border-slate-200 rounded-md text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-semibold text-slate-900">WB-902-A</span>
                  <span className="font-mono font-bold text-slate-900">{formatMoney(340000)}</span>
                </div>
                <div className="text-slate-600 text-[11px]">Abyssinia Heavy Logistics • 0911-238-892</div>
              </div>

              <div className="p-3 border border-slate-200 rounded-md text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-semibold text-slate-900">WB-903-B</span>
                  <span className="font-mono font-bold text-slate-900">{formatMoney(240000)}</span>
                </div>
                <div className="text-slate-600 text-[11px]">TransHorn Logistics • 0920-114-550</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('settlements')}
              className="w-full py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium rounded-md transition-colors"
            >
              Go to Settlement Center
            </button>
          </div>
        </div>
      </div>

      {/* Normal, Uncodixfied Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-lg max-w-md w-full p-5 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Top Up Escrow Account</h3>
              <button 
                onClick={() => setShowTopUpModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {topUpSuccess ? (
              <div className="py-6 text-center text-xs space-y-1">
                <div className="font-semibold text-slate-900 text-sm">Top-Up Successful</div>
                <p className="text-slate-500">
                  ETB {parseFloat(topUpAmount).toLocaleString()} credited via {paymentChannel.toUpperCase()}
                </p>
              </div>
            ) : (
              <form onSubmit={handleTopUpSubmit} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Amount (ETB)
                  </label>
                  <input 
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    required
                    min="1000"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Payment Gateway
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['telebirr', 'cbe', 'awash'] as const).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setPaymentChannel(ch)}
                        className={`p-2 border rounded-md text-center transition-colors ${
                          paymentChannel === ch
                            ? 'border-slate-900 bg-slate-900 text-white font-medium'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {ch === 'telebirr' ? 'TeleBirr' : ch === 'cbe' ? 'CBE Birr' : 'AwashPay'}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentChannel === 'telebirr' && (
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      Phone Number
                    </label>
                    <input 
                      type="tel"
                      value={telebirrPhone}
                      onChange={(e) => setTelebirrPhone(e.target.value)}
                      placeholder="0911..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-slate-800 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTopUpModal(false)}
                    className="flex-1 py-1.5 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingTopUp}
                    className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium"
                  >
                    {isProcessingTopUp ? 'Processing...' : 'Confirm Deposit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
