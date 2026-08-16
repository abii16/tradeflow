import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DisputeResolutionProps {
  currency: 'ETB' | 'USD' | 'DJF';
  formatMoney: (amountInETB: number) => string;
}

interface DisputeItem {
  id: string;
  waybillId: string;
  shipmentRef: string;
  shipper: string;
  transporter: string;
  disputedAmountETB: number;
  reason: string;
  evidence: string;
  status: 'Open' | 'In Review' | 'Resolved';
  resolutionOutcome?: string;
}

const INITIAL_DISPUTES: DisputeItem[] = [
  {
    id: 'disp-1',
    waybillId: 'WB-875-D',
    shipmentRef: 'TF-LOAD-8755',
    shipper: 'Ethio-Trading PLC',
    transporter: 'Abyssinia Heavy Logistics',
    disputedAmountETB: 45000,
    reason: 'Demurrage Surcharge: 48h Terminal Delay at Modjo Dry Port Gate 3',
    evidence: 'Port Entry Timestamp Slip + GPS Geofence log (48.2h idle)',
    status: 'In Review'
  },
  {
    id: 'disp-2',
    waybillId: 'WB-862-K',
    shipmentRef: 'TF-LOAD-8712',
    shipper: 'Dire Dawa Textiles Corp',
    transporter: 'TransHorn Logistics PLC',
    disputedAmountETB: 28000,
    reason: 'Unplanned Semera Security Detour Fuel Spike (+120km)',
    evidence: 'ERA Highway Advisory Notice #402 + Telematics Reroute Record',
    status: 'Open'
  },
  {
    id: 'disp-3',
    waybillId: 'WB-840-A',
    shipmentRef: 'TF-LOAD-8680',
    shipper: 'Horizon Agritech Ethiopia',
    transporter: 'BlueNile Freighters',
    disputedAmountETB: 35000,
    reason: 'Fertilizer Bag Rain Damage Claim (Partial Cargo Wetness)',
    evidence: 'Galafi Checkpoint Inspection Photo + Surveyor Report',
    status: 'Resolved',
    resolutionOutcome: 'Shipper refunded 35,000 ETB; Transporter cleared remaining 320,000 ETB.'
  }
];

export default function DisputeResolution({
  currency,
  formatMoney
}: DisputeResolutionProps) {
  const [disputes, setDisputes] = useState<DisputeItem[]>(INITIAL_DISPUTES);

  const handleResolve = (id: string, outcome: string) => {
    setDisputes(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: 'Resolved',
          resolutionOutcome: outcome
        };
      }
      return d;
    }));
  };

  const totalDisputed = disputes
    .filter(d => d.status !== 'Resolved')
    .reduce((acc, curr) => acc + curr.disputedAmountETB, 0);

  return (
    <div className="space-y-4">
      {/* Summary Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-md">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Dispute & Demurrage Mediation (FR-10.3)</h2>
          <p className="text-xs text-slate-500">Resolution queue for terminal demurrage and unplanned route claims</p>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
          <span className="text-slate-500 text-[11px] font-medium">Disputed Sum:</span>
          <span className="font-mono font-semibold text-slate-900">{formatMoney(totalDisputed)}</span>
        </div>
      </div>

      {/* Clean Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 text-[11px] font-semibold text-slate-600">
            <TableRow>
              <TableHead>Waybill & Parties</TableHead>
              <TableHead>Dispute Grounds & Evidence</TableHead>
              <TableHead className="text-right">Sum</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {disputes.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50/50">
                <TableCell className="align-top">
                  <div className="font-mono font-medium text-slate-900">{item.waybillId}</div>
                  <div className="text-[11px] text-slate-500">{item.shipmentRef}</div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    <div>{item.shipper}</div>
                    <div className="text-slate-500">→ {item.transporter}</div>
                  </div>
                </TableCell>

                <TableCell className="align-top max-w-md space-y-1">
                  <div className="font-medium text-slate-900">{item.reason}</div>
                  <div className="text-[11px] text-slate-500">{item.evidence}</div>
                  {item.resolutionOutcome && (
                    <div className="text-[11px] text-slate-700 font-medium pt-1">
                      Resolution: {item.resolutionOutcome}
                    </div>
                  )}
                </TableCell>

                <TableCell className="align-top text-right font-mono font-semibold text-slate-900">
                  {formatMoney(item.disputedAmountETB)}
                </TableCell>

                <TableCell className="align-top text-center">
                  <span className={`text-[11px] ${
                    item.status === 'Resolved' ? 'text-slate-500' :
                    item.status === 'In Review' ? 'text-amber-800 font-medium' : 'text-red-700 font-medium'
                  }`}>
                    {item.status}
                  </span>
                </TableCell>

                <TableCell className="align-top text-center">
                  {item.status !== 'Resolved' ? (
                    <div className="flex gap-1.5 justify-center">
                      <button
                        type="button"
                        onClick={() => handleResolve(item.id, `Surcharge approved (${formatMoney(item.disputedAmountETB)})`)}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium rounded transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolve(item.id, `Refunded to Shipper (${formatMoney(item.disputedAmountETB)})`)}
                        className="px-2 py-1 border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-medium rounded transition-colors"
                      >
                        Refund
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">Closed</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
