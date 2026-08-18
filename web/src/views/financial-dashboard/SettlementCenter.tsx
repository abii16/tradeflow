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
import DisputeFormModal from '../../components/DisputeFormModal';

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

const INITIAL_RELEASES: EscrowReleaseItem[] = [
  {
    id: 'rel-1',
    waybillId: 'WB-902-A',
    shipmentRef: 'TF-LOAD-8821',
    carrierName: 'Abyssinia Heavy Logistics',
    driverName: 'Kassahun Bekele (ETH-4592)',
    telebirrPhone: '0911-238-892',
    cargo: 'Fertilizer (Urea) • 40.5 MT',
    grossAmount: 340000,
    platformFee: 10200,
    netPayout: 329800,
    podSigned: true,
    podSignatureTime: '2026-08-16 11:32 AM',
    customsCleared: true,
    status: 'eligible',
  },
  {
    id: 'rel-2',
    waybillId: 'WB-903-B',
    shipmentRef: 'TF-LOAD-8815',
    carrierName: 'TransHorn Logistics PLC',
    driverName: 'Mohammed Seid (ETH-1104)',
    telebirrPhone: '0920-114-550',
    cargo: 'Steel Billets • 38.0 MT',
    grossAmount: 240000,
    platformFee: 7200,
    netPayout: 232800,
    podSigned: true,
    podSignatureTime: '2026-08-16 12:15 PM',
    customsCleared: true,
    status: 'eligible',
  },
  {
    id: 'rel-3',
    waybillId: 'WB-899-C',
    shipmentRef: 'TF-LOAD-8809',
    carrierName: 'BlueNile Freighters',
    driverName: 'Tewodros Haile (ETH-9921)',
    telebirrPhone: '0933-771-002',
    cargo: 'Containers (2x20ft) • 44.0 MT',
    grossAmount: 580000,
    platformFee: 17400,
    netPayout: 562600,
    podSigned: true,
    podSignatureTime: '2026-08-16 09:40 AM',
    customsCleared: true,
    status: 'released',
    telebirrTxId: 'TB-20260816-89912',
  },
  {
    id: 'rel-4',
    waybillId: 'WB-910-D',
    shipmentRef: 'TF-LOAD-8840',
    carrierName: 'Ethio-Djibouti Haulers',
    driverName: 'Abdi Ahmed (ETH-3032)',
    telebirrPhone: '0912-990-112',
    cargo: 'Industrial Machinery • 28.5 MT',
    grossAmount: 420000,
    platformFee: 12600,
    netPayout: 407400,
    podSigned: false,
    customsCleared: true,
    status: 'in_transit',
  }
];

export default function SettlementCenter({
  currency,
  formatMoney
}: SettlementCenterProps) {
  const [releases, setReleases] = useState<EscrowReleaseItem[]>(INITIAL_RELEASES);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [inspectItem, setInspectItem] = useState<EscrowReleaseItem | null>(null);
  const [disputeItem, setDisputeItem] = useState<EscrowReleaseItem | null>(null);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-md">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Carrier Payout & Settlement Queue</h2>
          <p className="text-xs text-slate-500">Milestone-triggered releases to TeleBirr / CBE accounts</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
            <span className="text-slate-500 text-[11px] font-medium">Eligible:</span>
            <span className="font-mono font-semibold text-slate-900">{formatMoney(totalEligibleAmount)}</span>
            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-mono font-medium">
              {eligibleCount}
            </span>
          </div>

          <button
            type="button"
            disabled={eligibleCount === 0}
            onClick={handleBatchRelease}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-medium rounded transition-colors"
          >
            Release All Eligible ({eligibleCount})
          </button>
        </div>
      </div>

      {/* High-Density Clean Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 text-[11px] font-semibold text-slate-600">
            <TableRow>
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
              <TableRow key={item.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <div className="font-mono font-semibold text-slate-900">{item.waybillId}</div>
                  <div className="text-[11px] text-slate-500">{item.cargo}</div>
                </TableCell>

                <TableCell>
                  <div className="font-medium text-slate-900">{item.carrierName}</div>
                  <div className="text-[11px] font-mono text-slate-500">{item.telebirrPhone}</div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] ${item.customsCleared ? 'text-slate-700' : 'text-slate-400'}`}>
                      {item.customsCleared ? 'Customs ✓' : 'Customs ⏳'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInspectItem(item)}
                      className={`text-[11px] underline ${item.podSigned ? 'text-slate-900 font-medium' : 'text-slate-400'}`}
                    >
                      {item.podSigned ? 'PoD Signed' : 'In Transit'}
                    </button>
                  </div>
                </TableCell>

                <TableCell className="text-right font-mono text-slate-700">
                  {formatMoney(item.grossAmount)}
                </TableCell>

                <TableCell className="text-right font-mono font-semibold text-slate-900">
                  {formatMoney(item.netPayout)}
                </TableCell>

                <TableCell className="text-center">
                  {item.status === 'released' ? (
                    <span className="text-[11px] text-slate-500 font-mono">
                      Settled ({item.telebirrTxId})
                    </span>
                  ) : item.status === 'eligible' ? (
                    <div className="flex justify-center gap-1.5">
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => handleReleaseSingle(item.id)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium rounded transition-colors"
                      >
                        {processingId === item.id ? 'Releasing...' : 'Release'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisputeItem(item)}
                        className="px-2.5 py-1 border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-medium rounded transition-colors"
                      >
                        Dispute
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">In Transit</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Clean PoD Inspection Modal */}
      {inspectItem && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-lg max-w-md w-full p-5 border border-slate-200 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">
                Proof-of-Delivery Inspection: {inspectItem.waybillId}
              </h3>
              <button 
                onClick={() => setInspectItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <div><span className="text-slate-500">Carrier:</span> <strong className="text-slate-900">{inspectItem.carrierName}</strong></div>
                <div><span className="text-slate-500">Driver:</span> <strong className="text-slate-900">{inspectItem.driverName}</strong></div>
                <div><span className="text-slate-500">Cargo:</span> <strong className="text-slate-900">{inspectItem.cargo}</strong></div>
                <div><span className="text-slate-500">Destination:</span> <strong className="text-slate-900">Modjo Dry Port Gate 2</strong></div>
              </div>

              <div className="space-y-1">
                <span className="font-medium text-slate-700 block">Consignee Touch Signature</span>
                <div className="h-20 bg-slate-50 border border-slate-300 rounded p-2 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">TIMESTAMP: {inspectItem.podSignatureTime || '2026-08-16 11:32'}</span>
                  <div className="font-serif italic text-lg text-slate-800">Kassahun Bekele ✓</div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setInspectItem(null)}
                  className="flex-1 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium"
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
                    className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium"
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
