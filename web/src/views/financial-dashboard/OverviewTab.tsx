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
  const [escrowLocked, setEscrowLocked] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [settledLifetime, setSettledLifetime] = useState(0);
  const [pendingReleases, setPendingReleases] = useState<any[]>([]);

  React.useEffect(() => {
    async function loadData() {
      try {
        const { fetchPayments } = await import('@/lib/apiClient');
        const res = await fetchPayments();
        const payments = res.data || [];
        
        let locked = 0;
        let settled = 0;
        let pending: any[] = [];
        
        payments.forEach((p: any) => {
          const amt = Number(p.amount) || 0;
          if (p.status === 'ESCROW_HELD') {
            locked += amt;
          } else if (p.status === 'COMPLETED') {
            settled += amt;
          } else if (p.payoutStatus === 'UNSCHEDULED' || p.payoutStatus === 'SCHEDULED') {
            pending.push(p);
          }
        });
        
        setEscrowLocked(locked);
        setSettledLifetime(settled);
        setPendingReleases(pending);
      } catch (err) {
        console.error('Failed to load overview data', err);
      }
    }
    loadData();
  }, []);

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
            --
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
            --
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
            {formatMoney(0)}
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            --
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
              <span className="text-xs font-mono text-slate-500"></span>
            </div>

            <div className="space-y-2">
              <div className="p-4 text-center text-slate-500 text-xs">
                No active escrows
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 cols: TeleBirr Actions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-slate-900">Pending TeleBirr Releases</h2>
              <span className="text-xs font-mono text-slate-500">{pendingReleases.length} queues</span>
            </div>

            <div className="space-y-2">
              {pendingReleases.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs border border-slate-200 rounded-md">
                  No pending releases
                </div>
              ) : (
                pendingReleases.map((p, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-md text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-semibold text-slate-900">{p.transactionRef || 'Pending'}</span>
                      <span className="font-mono font-bold text-slate-900">{formatMoney(Number(p.amount) || 0)}</span>
                    </div>
                    <div className="text-slate-600 text-[11px]">{p.payeeId || 'Unknown'}</div>
                  </div>
                ))
              )}
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
