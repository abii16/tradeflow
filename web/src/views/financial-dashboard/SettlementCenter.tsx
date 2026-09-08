import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  PhoneCall, 
  CheckCircle2, 
  Eye, 
  FileCheck2, 
  Zap,
  AlertCircle
} from 'lucide-react';
import DisputeFormModal from '@/components/modals/DisputeFormModal';

interface SettlementCenterProps {
  currency: 'ETB' | 'USD' | 'DJF';
  formatMoney: (amountInETB: number) => string;
}

interface EscrowReleaseItem {
  id: string;
  waybillId: string;
  shipmentRef: string;
  carrierName: string;
  driverName: string;
  telebirrPhone: string;
  cargo: string;
  grossAmount: number;
  platformFee: number;
  netPayout: number;
  podSigned: boolean;
  podSignatureTime?: string;
  customsCleared: boolean;
  status: 'eligible' | 'released' | 'in_transit';
  telebirrTxId?: string;
}



export default function SettlementCenter({
  currency,
  formatMoney
}: SettlementCenterProps) {
  const [releases, setReleases] = useState<EscrowReleaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [inspectItem, setInspectItem] = useState<EscrowReleaseItem | null>(null);
  const [disputeItem, setDisputeItem] = useState<EscrowReleaseItem | null>(null);

  React.useEffect(() => {
    async function loadSettlements() {
      try {
        setLoading(true);
        const { fetchPayments } = await import('@/lib/apiClient');
        const res = await fetchPayments();
        
        const mapped: EscrowReleaseItem[] = (res.data || []).map((p: any) => ({
          id: p.id,
          waybillId: p.shipmentId || 'N/A',
          shipmentRef: p.shipmentId || 'N/A',
          carrierName: p.payeeId || 'Unknown',
          driverName: 'Driver (Assigned)',
          telebirrPhone: '09xx-xxx-xxx',
          cargo: 'General Cargo',
          grossAmount: Number(p.amount) || 0,
          platformFee: (Number(p.amount) || 0) * 0.03,
          netPayout: (Number(p.amount) || 0) * 0.97,
          podSigned: p.status === 'PAID' || p.status === 'ESCROW_HELD',
          podSignatureTime: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
          customsCleared: true,
          status: p.status === 'PAID' ? 'released' : p.status === 'ESCROW_HELD' ? 'eligible' : 'in_transit',
          telebirrTxId: p.transactionRef
        }));
        
        setReleases(mapped);
      } catch (err) {
        console.error('Failed to load settlements:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettlements();
  }, []);

  const eligibleCount = releases.filter(r => r.status === 'eligible').length;
  const totalEligibleAmount = releases
    .filter(r => r.status === 'eligible')
    .reduce((acc, curr) => acc + curr.netPayout, 0);

  const handleReleaseSingle = (id: string) => {
    setProcessingId(id);
    setTimeout(() => {
      const txCode = `TB-20260816-${Math.floor(10000 + Math.random() * 90000)}`;
      setReleases(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: 'released',
            telebirrTxId: txCode,
          };
        }
        return item;
      }));
      setProcessingId(null);
    }, 700);
  };

  const handleBatchRelease = () => {
    setReleases(prev => prev.map(item => {
      if (item.status === 'eligible') {
        return {
          ...item,
          status: 'released',
          telebirrTxId: `TB-20260816-${Math.floor(10000 + Math.random() * 90000)}`,
        };
      }
      return item;
    }));
  };

  return (
    <div className="space-y-4">
      {/* Top Action & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#232323] p-4 border border-[#2E2E2E] rounded-md shadow-black/20">
        <div>
          <h2 className="text-sm font-semibold text-[#EDEDED]">Carrier Payout & Settlement Queue</h2>
          <p className="text-xs text-[#8F8F8F]">Milestone-triggered releases to TeleBirr / CBE accounts</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#181818] border border-[#2E2E2E] rounded text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] shrink-0"></span>
            <span className="text-[#8F8F8F] text-[11px] font-medium">Eligible:</span>
            <span className="font-mono font-semibold text-[#EDEDED]">{formatMoney(totalEligibleAmount)}</span>
            <span className="px-1.5 py-0.5 bg-[#2E2E2E] text-[#EDEDED] rounded text-[10px] font-mono font-medium">
              {eligibleCount}
            </span>
          </div>

          <button
            type="button"
            disabled={eligibleCount === 0}
            onClick={handleBatchRelease}
            className="px-3 py-1.5 bg-[#3ECF8E] hover:bg-[#34b27b] disabled:bg-[#2E2E2E] disabled:text-[#8F8F8F] text-[#1C1C1C] text-xs font-bold rounded transition-colors shadow-sm"
          >
            Release All Eligible ({eligibleCount})
          </button>
        </div>
      </div>

      {/* High-Density Clean Table */}
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-md overflow-hidden shadow-black/20">
        <Table>
          <TableHeader className="bg-[#181818] text-[11px] font-semibold text-[#8F8F8F] border-b border-[#2E2E2E]">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead>Waybill / Cargo</TableHead>
              <TableHead>Carrier / Beneficiary</TableHead>
              <TableHead>Milestone Status</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Net Payout</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {releases.map((item) => (
              <TableRow key={item.id} className="hover:bg-[#2A2A2A] border-[#2E2E2E]">
                <TableCell>
                  <div className="font-mono font-semibold text-[#EDEDED]">{item.waybillId}</div>
                  <div className="text-[11px] text-[#8F8F8F]">{item.cargo}</div>
                </TableCell>

                <TableCell>
                  <div className="font-medium text-[#EDEDED]">{item.carrierName}</div>
                  <div className="text-[11px] font-mono text-[#8F8F8F]">{item.telebirrPhone}</div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] ${item.customsCleared ? 'text-[#3ECF8E]' : 'text-[#8F8F8F]'}`}>
                      {item.customsCleared ? 'Customs ✓' : 'Customs ⏳'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInspectItem(item)}
                      className={`text-[11px] underline ${item.podSigned ? 'text-[#3ECF8E] font-medium hover:text-[#34b27b]' : 'text-[#8F8F8F]'}`}
                    >
                      {item.podSigned ? 'PoD Signed' : 'In Transit'}
                    </button>
                  </div>
                </TableCell>

                <TableCell className="text-right font-mono text-[#8F8F8F]">
                  {formatMoney(item.grossAmount)}
                </TableCell>

                <TableCell className="text-right font-mono font-semibold text-[#EDEDED]">
                  {formatMoney(item.netPayout)}
                </TableCell>

                <TableCell className="text-center">
                  {item.status === 'released' ? (
                    <span className="text-[11px] text-[#8F8F8F] font-mono">
                      Settled ({item.telebirrTxId})
                    </span>
                  ) : item.status === 'eligible' ? (
                    <div className="flex justify-center gap-1.5">
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => handleReleaseSingle(item.id)}
                        className="px-2.5 py-1 bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] text-[11px] font-bold rounded transition-colors"
                      >
                        {processingId === item.id ? 'Releasing...' : 'Release'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisputeItem(item)}
                        className="px-2.5 py-1 border border-[#2E2E2E] text-[#8F8F8F] hover:text-[#EDEDED] hover:bg-[#2A2A2A] text-[11px] font-medium rounded transition-colors"
                      >
                        Dispute
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#8F8F8F]">In Transit</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Clean PoD Inspection Modal */}
      {inspectItem && (
        <div className="fixed inset-0 bg-[#1C1C1C]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#232323] rounded-md shadow-xl max-w-md w-full p-5 border border-[#2E2E2E] text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-[#2E2E2E]">
              <h3 className="font-semibold text-[#EDEDED] text-sm">
                Proof-of-Delivery Inspection: {inspectItem.waybillId}
              </h3>
              <button 
                onClick={() => setInspectItem(null)}
                className="text-[#8F8F8F] hover:text-[#EDEDED] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="p-3 bg-[#181818] rounded border border-[#2E2E2E] space-y-1">
                <div><span className="text-[#8F8F8F]">Carrier:</span> <strong className="text-[#EDEDED]">{inspectItem.carrierName}</strong></div>
                <div><span className="text-[#8F8F8F]">Driver:</span> <strong className="text-[#EDEDED]">{inspectItem.driverName}</strong></div>
                <div><span className="text-[#8F8F8F]">Cargo:</span> <strong className="text-[#EDEDED]">{inspectItem.cargo}</strong></div>
                <div><span className="text-[#8F8F8F]">Destination:</span> <strong className="text-[#EDEDED]">Modjo Dry Port Gate 2</strong></div>
              </div>

              <div className="space-y-1">
                <span className="font-medium text-[#EDEDED] block">Consignee Touch Signature</span>
                <div className="h-20 bg-[#181818] border border-[#2E2E2E] rounded p-2 flex flex-col justify-between">
                  <span className="text-[10px] text-[#8F8F8F] font-mono">TIMESTAMP: {inspectItem.podSignatureTime || '2026-08-16 11:32'}</span>
                  <div className="font-serif italic text-lg text-[#3ECF8E]">Kassahun Bekele ✓</div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setInspectItem(null)}
                  className="flex-1 py-1.5 border border-[#2E2E2E] bg-[#181818] text-[#EDEDED] hover:bg-[#2A2A2A] rounded font-medium transition-colors"
                >
                  Close
                </button>
                {inspectItem.status === 'eligible' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleReleaseSingle(inspectItem.id);
                      setInspectItem(null);
                    }}
                    className="flex-1 py-1.5 bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] rounded font-bold shadow-md transition-colors"
                  >
                    Confirm Release
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {disputeItem && (
        <DisputeFormModal
          transactionId={disputeItem.waybillId}
          onClose={() => setDisputeItem(null)}
        />
      )}
    </div>
  );
}
