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
          } 
          if (p.status === 'COMPLETED') {
            settled += amt;
          } 
          if (p.payoutStatus === 'UNSCHEDULED' || p.payoutStatus === 'SCHEDULED') {
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
        <div className="bg-[#232323] border border-[#2E2E2E] rounded-md p-4 space-y-1 hover:border-[#3ECF8E]/50 transition-colors shadow-black/20">
          <div className="text-xs text-[#8F8F8F] font-medium">Total Escrow Locked</div>
          <div className="text-xl font-bold font-mono text-[#EDEDED] tracking-tight">
            {formatMoney(escrowLocked)}
          </div>
          <div className="text-[11px] text-[#8F8F8F] pt-1">
            --
          </div>
        </div>

        {/* Available Balance */}
        <div className="bg-[#232323] border border-[#2E2E2E] rounded-md p-4 space-y-1 shadow-black/20">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#8F8F8F] font-medium">Available Balance</span>
            <button 
              onClick={() => setShowTopUpModal(true)}
              className="text-[11px] font-semibold text-[#EDEDED] hover:text-[#3ECF8E] hover:underline transition-colors"
            >
              + Top Up
            </button>
          </div>
          <div className="text-xl font-bold font-mono text-[#3ECF8E] tracking-tight">
            {formatMoney(availableBalance)}
          </div>
          <div className="text-[11px] text-[#8F8F8F] pt-1">
            Ready for load booking
          </div>
        </div>

        {/* Settled Volume */}
        <div className="bg-[#232323] border border-[#2E2E2E] rounded-md p-4 space-y-1 shadow-black/20">
          <div className="text-xs text-[#8F8F8F] font-medium">Settled Volume (GTV)</div>
          <div className="text-xl font-bold font-mono text-[#EDEDED] tracking-tight">
            {formatMoney(settledLifetime)}
          </div>
          <div className="text-[11px] text-[#8F8F8F] pt-1">
            --
          </div>
        </div>

        {/* TeleBirr Payout Queue */}
        <div className="bg-[#232323] border border-[#2E2E2E] rounded-md p-4 space-y-1 shadow-black/20">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#8F8F8F] font-medium">Pending Payouts</span>
            <button 
              onClick={() => onNavigateTab('settlements')}
              className="text-[11px] font-semibold text-[#EDEDED] hover:text-[#3ECF8E] hover:underline transition-colors"
            >
              Release →
            </button>
          </div>
          <div className="text-xl font-bold font-mono text-[#EDEDED] tracking-tight">
            {formatMoney(pendingReleases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0))}
          </div>
          <div className="text-[11px] text-[#8F8F8F] pt-1">
            --
          </div>
        </div>
      </div>

      {/* Main Section: Corridor Stages & Quick Releases */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 cols: Corridor Escrow Status */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-md p-4 space-y-4 shadow-black/20">
            <div className="flex justify-between items-center border-b border-[#2E2E2E] pb-3">
              <div>
                <h2 className="text-sm font-semibold text-[#EDEDED]">Corridor Transit Escrow Breakdown</h2>
                <p className="text-xs text-[#8F8F8F]">Funds locked along Djibouti Port → Galafi → Modjo Dry Port</p>
              </div>
              <span className="text-xs font-mono text-[#8F8F8F]"></span>
            </div>

            <div className="space-y-2">
              <div className="p-4 text-center text-[#8F8F8F] text-xs">
                No active escrows
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 cols: TeleBirr Actions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-md p-4 space-y-3 shadow-black/20">
            <div className="flex justify-between items-center border-b border-[#2E2E2E] pb-3">
              <h2 className="text-sm font-semibold text-[#EDEDED]">Pending TeleBirr Releases</h2>
              <span className="text-xs font-mono text-[#8F8F8F]">{pendingReleases.length} queues</span>
            </div>

            <div className="space-y-2">
              {pendingReleases.length === 0 ? (
                <div className="p-4 text-center text-[#8F8F8F] text-xs border border-[#2E2E2E] rounded-md">
                  No pending releases
                </div>
              ) : (
                pendingReleases.map((p, idx) => (
                  <div key={idx} className="p-3 border border-[#2E2E2E] hover:border-[#3ECF8E]/50 transition-colors rounded-md text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-semibold text-[#EDEDED]">{p.transactionRef || 'Pending'}</span>
                      <span className="font-mono font-bold text-[#EDEDED]">{formatMoney(Number(p.amount) || 0)}</span>
                    </div>
                    <div className="text-[#8F8F8F] text-[11px]">{p.payeeId || 'Unknown'}</div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('settlements')}
              className="w-full py-2 bg-[#3ECF8E] text-[#1C1C1C] hover:bg-[#34b27b] shadow-md hover:-translate-y-0.5 text-xs font-bold rounded-md transition-all"
            >
              Go to Settlement Center
            </button>
          </div>
        </div>
      </div>

      {/* Normal, Uncodixfied Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-[#1C1C1C]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#232323] rounded-md shadow-xl max-w-md w-full p-5 border border-[#2E2E2E]">
            <div className="flex justify-between items-center pb-3 border-b border-[#2E2E2E]">
              <h3 className="font-semibold text-[#EDEDED] text-sm">Top Up Escrow Account</h3>
              <button 
                onClick={() => setShowTopUpModal(false)}
                className="text-[#8F8F8F] hover:text-[#EDEDED] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {topUpSuccess ? (
              <div className="py-6 text-center text-xs space-y-1">
                <div className="font-semibold text-[#3ECF8E] text-sm">Top-Up Successful</div>
                <p className="text-[#8F8F8F]">
                  ETB {parseFloat(topUpAmount).toLocaleString()} credited via {paymentChannel.toUpperCase()}
                </p>
              </div>
            ) : (
              <form onSubmit={handleTopUpSubmit} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="font-medium text-[#EDEDED] block mb-1">
                    Amount (ETB)
                  </label>
                  <input 
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    required
                    min="1000"
                    className="w-full px-3 py-1.5 border border-[#2E2E2E] bg-[#181818] rounded-md font-mono font-medium text-[#EDEDED] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#EDEDED] block mb-1">
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
                            ? 'border-[#3ECF8E]/50 bg-[#3ECF8E]/10 text-[#3ECF8E] font-medium shadow-sm'
                            : 'border-[#2E2E2E] bg-[#181818] text-[#8F8F8F] hover:bg-[#2A2A2A]'
                        }`}
                      >
                        {ch === 'telebirr' ? 'TeleBirr' : ch === 'cbe' ? 'CBE Birr' : 'AwashPay'}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentChannel === 'telebirr' && (
                  <div>
                    <label className="font-medium text-[#EDEDED] block mb-1">
                      Phone Number
                    </label>
                    <input 
                      type="tel"
                      value={telebirrPhone}
                      onChange={(e) => setTelebirrPhone(e.target.value)}
                      placeholder="0911..."
                      className="w-full px-3 py-1.5 border border-[#2E2E2E] bg-[#181818] rounded-md font-mono text-[#EDEDED] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/20 focus:border-[#3ECF8E]"
                    />
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTopUpModal(false)}
                    className="flex-1 py-1.5 border border-[#2E2E2E] bg-[#181818] rounded-md text-[#EDEDED] hover:bg-[#2A2A2A] transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingTopUp}
                    className="flex-1 py-1.5 bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] rounded-md shadow-md transition-colors font-bold"
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
