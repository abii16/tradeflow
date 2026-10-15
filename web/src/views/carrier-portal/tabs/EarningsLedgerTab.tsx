import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ArrowUpRight, 
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
      toast.success('Dispute ticket raised! Payout frozen pending platform admin review.');
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
        <span className="text-xs font-mono">Loading TeleBirr transaction ledger & escrow accounts...</span>
      </div>
    );
  }

  let totalSettledETB = 0;
  let totalEscrowETB = 0;
  let totalCommissionETB = 0;

  for (const p of payouts) {
    const net = Number(p.netPayoutAmount || p.amountInETB || 0);
    const comm = Number(p.platformCommissionAmount || 0);
    if (p.status === 'COMPLETED' || p.payoutStatus === 'COMPLETED') {
      totalSettledETB += net;
      totalCommissionETB += comm;
    } else {
      totalEscrowETB += net;
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2E2E2E]">
        <div>
          <h2 className="text-xl font-bold text-[#EDEDED] tracking-tight flex items-center gap-2">
            <Wallet size={22} className="text-[#3ECF8E]" />
            TeleBirr Settlements &amp; Financial Escrow
          </h2>
          <p className="text-xs text-[#8F8F8F] mt-0.5">
            SRS FR-10 Automated Multi-Sig Escrow, Platform Commission Calculation &amp; Payout Audit Trail
          </p>
        </div>

        <button
          onClick={() => fetchPayouts(false)}
          className="flex items-center gap-1.5 bg-[#232323] hover:bg-[#2E2E2E] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2E2E2E] text-[#8F8F8F] hover:text-[#EDEDED] transition self-start sm:self-auto"
        >
          <RefreshCw size={13} /> Refresh Ledger
        </button>
      </div>

      {/* KPI Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Settled Net */}
        <div className="p-5 rounded-2xl bg-[#232323] border border-[#2E2E2E] space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#8F8F8F] flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-[#3ECF8E]" /> Total Settled Net Earnings
          </span>
          <div className="text-3xl font-mono font-bold text-[#3ECF8E]">
            ETB {totalSettledETB.toLocaleString()}
          </div>
          <span className="text-[10px] text-[#8F8F8F] font-mono">Disbursed to linked TeleBirr merchant account</span>
        </div>

        {/* Pending Escrow */}
        <div className="p-5 rounded-2xl bg-[#232323] border border-[#2E2E2E] space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#8F8F8F] flex items-center gap-1.5">
            <Clock size={13} className="text-amber-400" /> Locked in Transit Escrow
          </span>
          <div className="text-3xl font-mono font-bold text-amber-300">
            ETB {totalEscrowETB.toLocaleString()}
          </div>
          <span className="text-[10px] text-[#8F8F8F] font-mono">Releases instantly upon e-PoD submission</span>
        </div>

        {/* Platform Commission */}
        <div className="p-5 rounded-2xl bg-[#232323] border border-[#2E2E2E] space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#8F8F8F] flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-blue-400" /> Platform Fee (5% Standard)
          </span>
          <div className="text-3xl font-mono font-bold text-[#EDEDED]">
            ETB {totalCommissionETB.toLocaleString()}
          </div>
          <span className="text-[10px] text-[#8F8F8F] font-mono">TradeFlow corridor insurance &amp; mediation guarantee</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[#2E2E2E] flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase text-[#8F8F8F]">
            Settlement Audit Ledger ({payouts.length} Transactions)
          </h3>
          <span className="text-[10px] font-mono text-[#3ECF8E]">
            INSA AES-256 Encrypted Ledger
          </span>
        </div>

        {payouts.length === 0 ? (
          <div className="p-12 text-center text-[#8F8F8F]">
            <Wallet size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs">No payment records found. Completed hauls will automatically log here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#1C1C1C] border-b border-[#2E2E2E] text-[10px] text-[#8F8F8F] uppercase">
                <tr>
                  <th className="py-3 px-4">Transaction / OutTradeNo</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Gross Consignment</th>
                  <th className="py-3 px-4">Commission (5%)</th>
                  <th className="py-3 px-4">Net Carrier Payout</th>
                  <th className="py-3 px-4">Escrow Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E] text-[#EDEDED]">
                {payouts.map((p) => {
                  const isCompleted = p.status === 'COMPLETED' || p.payoutStatus === 'COMPLETED';

                  return (
                    <tr key={p.id} className="hover:bg-[#282828] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white max-w-[200px] truncate">
                        <div className="truncate">{p.outTradeNo || p.id}</div>
                        {p.telebirrTxnId && (
                          <div className="text-[10px] text-[#8F8F8F] truncate">Txn: {p.telebirrTxnId}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#8F8F8F]">
                        <span className="px-2 py-0.5 rounded bg-[#1C1C1C] border border-[#2E2E2E] text-[10px]">
                          {p.paymentMethod || 'TELEBIRR'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#8F8F8F]">
                        ETB {Number(p.amountInETB || p.amount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-red-400 font-bold">
                        -ETB {Number(p.platformCommissionAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-[#3ECF8E] font-bold">
                        ETB {Number(p.netPayoutAmount || p.amountInETB).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isCompleted ? 'SETTLED' : p.status || 'ESCROW_HELD'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#8F8F8F] text-[10px]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDispute(p)}
                          className="text-[#8F8F8F] hover:text-amber-400 text-[10px] hover:underline"
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

      {/* =========================================================================
          MODAL: RAISE PAYMENT DISPUTE (FR-10.3)
          ========================================================================= */}
      {showDisputeModal && disputePayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#2E2E2E] flex items-center justify-between bg-[#1C1C1C]">
              <div>
                <h3 className="font-bold text-sm text-[#EDEDED] flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-400" />
                  SRS FR-10.3 Flag Payment Dispute
                </h3>
                <p className="text-[10px] font-mono text-[#8F8F8F] mt-0.5">
                  Routed to Platform Administrator mediation desk
                </p>
              </div>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-[#8F8F8F] hover:text-[#EDEDED]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitDispute} className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] text-xs font-mono space-y-1">
                <div className="text-[#8F8F8F]">Transaction OutTradeNo:</div>
                <div className="text-white font-bold">{disputePayment.outTradeNo}</div>
                <div className="text-[#3ECF8E] font-bold">
                  Consignment Value: ETB {Number(disputePayment.amountInETB || disputePayment.amount).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                  Dispute Reason / Demurrage Claim Details *
                </label>
                <textarea
                  rows={4}
                  required
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs text-[#EDEDED] focus:border-[#3ECF8E] outline-none resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                Notice: Raising a dispute freezes automatic escrow release until administrator audit is concluded.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#2E2E2E] text-xs font-semibold text-[#8F8F8F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition flex items-center gap-2"
                >
                  {submittingDispute ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Submitting Ticket...
                    </>
                  ) : (
                    'Transmit Dispute to Administrator'
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
