import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  X, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { getCarrierPayouts, disputePayment as apiDisputePayment } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface PayoutRecord {
  id: string;
  shipmentId: string;
  amount: string;
  amountInETB: string;
  platformCommissionRate: string;
  platformCommissionAmount: string;
  netPayoutAmount: string;
  currency: string;
  paymentMethod: string;
  telebirrTxnId: string | null;
  outTradeNo: string;
  status: string;
  payoutStatus: string;
  payoutCompletedAt: string | null;
  createdAt: string;
}

export default function EarningsLedgerTab() {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Dispute Modal State
  const [showDisputeModal, setShowDisputeModal] = useState<boolean>(false);
  const [disputePayment, setDisputePayment] = useState<PayoutRecord | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>('');
  const [submittingDispute, setSubmittingDispute] = useState<boolean>(false);

  const fetchPayouts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getCarrierPayouts();
      if (res?.payouts) {
        setPayouts(res.payouts);
      }
    } catch (err: any) {
      console.error('Failed to fetch carrier payouts:', err);
      toast.error('Could not load settlement ledger');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleOpenDispute = (payment: PayoutRecord) => {
    setDisputePayment(payment);
    setDisputeReason('Escrow release delay or demurrage rate discrepancy at destination.');
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputePayment || !disputeReason) return;

    setSubmittingDispute(true);
    try {
      await apiDisputePayment(disputePayment.id, disputeReason);
      toast.success('Dispute ticket raised for mediation review');
      setShowDisputeModal(false);
      await fetchPayouts(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to raise payment dispute');
    } finally {
      setSubmittingDispute(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-[#8F8F8F] gap-3">
        <Loader2 size={32} className="animate-spin text-[#3ECF8E]" />
        <span className="text-xs font-mono">Loading settlement ledger &amp; escrow accounts...</span>
      </div>
    );
  }

  let totalSettledETB = 0;
  let totalEscrowETB = 0;
  let totalCommissionETB = 0;

  for (const p of payouts) {
    const gross = Number(p.amountInETB || p.amount || 0);
    const commRate = Number(p.platformCommissionRate || 0.05);
    const comm = Number(p.platformCommissionAmount) > 0 ? Number(p.platformCommissionAmount) : (gross * commRate);
    const net = Number(p.netPayoutAmount) > 0 ? Number(p.netPayoutAmount) : (gross - comm);

    const isCompleted = p.status === 'COMPLETED' || p.payoutStatus === 'COMPLETED';

    if (isCompleted) {
      totalSettledETB += net;
      totalCommissionETB += comm;
    } else {
      totalEscrowETB += net;
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#242424]">
        <div>
          <h2 className="text-xl font-bold text-[#EDEDED] tracking-tight">
            TeleBirr Settlements
          </h2>
        </div>

        <button
          onClick={() => fetchPayouts(false)}
          className="flex items-center gap-1.5 bg-[#171717] hover:bg-[#1C1C1C] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#242424] text-[#8F8F8F] hover:text-[#EDEDED] transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} /> Refresh Ledger
        </button>
      </div>

      {/* KPI Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Settled Net */}
        <div className="p-5 rounded-xl bg-[#171717] border border-[#242424] hover:border-[#333] transition-colors space-y-2">
          <div className="flex items-center justify-between text-[#8F8F8F] text-[10px] font-mono uppercase">
            <span>Total Settled</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]" />
          </div>
          <div className="text-3xl font-mono font-bold text-[#3ECF8E]">
            ETB {totalSettledETB.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-[#8F8F8F]">
            Disbursed to linked TeleBirr merchant account
          </p>
        </div>

        {/* Pending Escrow */}
        <div className="p-5 rounded-xl bg-[#171717] border border-[#242424] hover:border-[#333] transition-colors space-y-2">
          <div className="flex items-center justify-between text-[#8F8F8F] text-[10px] font-mono uppercase">
            <span>Locked in Escrow</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-[#EDEDED]">
            ETB {totalEscrowETB.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-[#8F8F8F]">
            Releases upon verified electronic proof-of-delivery
          </p>
        </div>

        {/* Platform Fee */}
        <div className="p-5 rounded-xl bg-[#171717] border border-[#242424] hover:border-[#333] transition-colors space-y-2">
          <div className="flex items-center justify-between text-[#8F8F8F] text-[10px] font-mono uppercase">
            <span>Platform Fee (5%)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#8F8F8F]" />
          </div>
          <div className="text-3xl font-mono font-bold text-[#EDEDED]">
            ETB {totalCommissionETB.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-[#8F8F8F]">
            TradeFlow cargo guarantee and dispute insurance
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#171717] border border-[#242424] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#242424] flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase text-[#8F8F8F]">
            Settlement Ledger ({payouts.length} Transactions)
          </h3>
          <span className="text-[10px] font-mono text-[#8F8F8F] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]" />
            Encrypted Multi-Sig Ledger
          </span>
        </div>

        {payouts.length === 0 ? (
          <div className="p-12 text-center text-[#8F8F8F] space-y-2">
            <Wallet size={28} className="mx-auto opacity-40 text-[#8F8F8F]" />
            <p className="text-xs">No payment records found. Completed hauls will automatically log here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#121212] border-b border-[#242424] text-[10px] text-[#8F8F8F] uppercase">
                <tr>
                  <th className="py-3 px-4 font-semibold">Transaction</th>
                  <th className="py-3 px-4 font-semibold">Method</th>
                  <th className="py-3 px-4 font-semibold">Gross Consignment</th>
                  <th className="py-3 px-4 font-semibold">Commission (5%)</th>
                  <th className="py-3 px-4 font-semibold">Net Carrier Payout</th>
                  <th className="py-3 px-4 font-semibold">Escrow Status</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424] text-[#EDEDED]">
                {payouts.map((p) => {
                  const gross = Number(p.amountInETB || p.amount || 0);
                  const commRate = Number(p.platformCommissionRate || 0.05);
                  const comm = Number(p.platformCommissionAmount) > 0 ? Number(p.platformCommissionAmount) : (gross * commRate);
                  const net = Number(p.netPayoutAmount) > 0 ? Number(p.netPayoutAmount) : (gross - comm);
                  const isCompleted = p.status === 'COMPLETED' || p.payoutStatus === 'COMPLETED';

                  return (
                    <tr key={p.id} className="hover:bg-[#141414] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#EDEDED] max-w-[200px] truncate">
                        <div className="truncate">{p.outTradeNo || p.id}</div>
                        {p.telebirrTxnId && (
                          <div className="text-[10px] text-[#8F8F8F] font-normal truncate">Txn: {p.telebirrTxnId}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#8F8F8F]">
                        <span className="px-2 py-0.5 rounded bg-[#121212] border border-[#242424] text-[10px]">
                          {p.paymentMethod || 'TELEBIRR'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#8F8F8F]">
                        ETB {gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-[#8F8F8F]">
                        -ETB {comm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-[#3ECF8E] font-bold">
                        ETB {net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-[#121212] border border-[#242424]">
                          <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-[#3ECF8E]' : 'bg-amber-400'}`} />
                          <span className={isCompleted ? 'text-[#3ECF8E]' : 'text-amber-400'}>
                            {isCompleted ? 'Settled' : 'Escrow Held'}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#8F8F8F] text-[10px]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDispute(p)}
                          className="text-[#8F8F8F] hover:text-amber-400 text-xs transition cursor-pointer"
                        >
                          Raise Dispute
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dispute Modal (SRS FR-10.3) */}
      {showDisputeModal && disputePayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#171717] border border-[#242424] rounded-xl w-full max-w-md overflow-hidden shadow-2xl space-y-0">
            <div className="p-4 border-b border-[#242424] flex items-center justify-between bg-[#121212]">
              <div>
                <h3 className="font-bold text-sm text-[#EDEDED] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Flag Payment Dispute
                </h3>
                <p className="text-[10px] font-mono text-[#8F8F8F] mt-0.5">
                  Routed to platform administrator mediation desk
                </p>
              </div>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-[#8F8F8F] hover:text-[#EDEDED] transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitDispute} className="p-5 space-y-4">
              <div className="p-3 rounded-lg bg-[#121212] border border-[#242424] text-xs font-mono space-y-1">
                <div className="text-[#8F8F8F]">Transaction: <span className="text-[#EDEDED] font-bold">{disputePayment.outTradeNo}</span></div>
                <div className="text-[#3ECF8E] font-bold">
                  Consignment: ETB {Number(disputePayment.amountInETB || disputePayment.amount).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                  Dispute Reason / Demurrage Claim *
                </label>
                <textarea
                  rows={4}
                  required
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full bg-[#121212] border border-[#242424] rounded-lg px-3 py-2 text-xs text-[#EDEDED] focus:border-[#3ECF8E] outline-none resize-none transition"
                />
              </div>

              <div className="p-3 rounded-lg bg-[#121212] border border-[#242424] text-xs text-[#8F8F8F] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>Raising a dispute holds escrow release pending administrator review.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#121212] hover:bg-[#1C1C1C] border border-[#242424] text-xs font-medium text-[#8F8F8F] hover:text-[#EDEDED] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingDispute ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit Dispute'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
