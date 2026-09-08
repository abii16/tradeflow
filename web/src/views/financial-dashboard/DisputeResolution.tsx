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

export default function DisputeResolution({
  currency,
  formatMoney
}: DisputeResolutionProps) {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);

  React.useEffect(() => {
    async function loadDisputes() {
      try {
        const { fetchDisputes } = await import('@/lib/apiClient');
        const res = await fetchDisputes();
        const data = res.data || [];
        
        // Map backend dispute format to frontend DisputeItem
        const formattedDisputes: DisputeItem[] = data.map((d: any) => ({
          id: d.id,
          waybillId: d.shipmentId || 'Unknown Waybill',
          shipmentRef: 'General Cargo',
          shipper: d.raisedByUser?.fullName || 'Unknown Shipper',
          transporter: 'Pending',
          disputedAmountETB: d.amount || 0, // Fallback to 0 if not joined with payment amount
          reason: d.reason || 'No reason provided',
          evidence: d.evidenceUrl || 'No evidence attached',
          status: d.status === 'OPEN' ? 'Open' : d.status === 'UNDER_REVIEW' ? 'In Review' : 'Resolved',
          resolutionOutcome: d.resolutionNotes
        }));
        
        setDisputes(formattedDisputes);
      } catch (err) {
        console.error('Failed to load disputes', err);
      }
    }
    loadDisputes();
  }, []);

  const handleResolve = async (id: string, outcome: string) => {
    try {
      const { resolveDispute } = await import('@/lib/apiClient');
      await resolveDispute(id, { outcome });
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
    } catch (err) {
      console.error('Failed to resolve dispute', err);
    }
  };

  const totalDisputed = disputes
    .filter(d => d.status !== 'Resolved')
    .reduce((acc, curr) => acc + (Number(curr.disputedAmountETB) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#232323] p-4 border border-[#2E2E2E] rounded-md shadow-black/20">
        <div>
          <h2 className="text-sm font-semibold text-[#EDEDED]">Dispute & Demurrage Mediation (FR-10.3)</h2>
          <p className="text-xs text-[#8F8F8F]">Resolution queue for terminal demurrage and unplanned route claims</p>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#181818] border border-[#2E2E2E] rounded text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
          <span className="text-[#8F8F8F] text-[11px] font-medium">Disputed Sum:</span>
          <span className="font-mono font-semibold text-[#EDEDED]">{formatMoney(totalDisputed)}</span>
        </div>
      </div>

      {/* Clean Table */}
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-md overflow-hidden shadow-black/20">
        <Table>
          <TableHeader className="bg-[#181818] text-[11px] font-semibold text-[#8F8F8F] border-b border-[#2E2E2E]">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead>Waybill & Parties</TableHead>
              <TableHead>Dispute Grounds & Evidence</TableHead>
              <TableHead className="text-right">Sum</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {disputes.map((item) => (
              <TableRow key={item.id} className="hover:bg-[#2A2A2A] border-[#2E2E2E]">
                <TableCell className="align-top">
                  <div className="font-mono font-medium text-[#EDEDED]">{item.waybillId}</div>
                  <div className="text-[11px] text-[#8F8F8F]">{item.shipmentRef}</div>
                  <div className="text-[11px] text-[#8F8F8F] mt-1">
                    <div>{item.shipper}</div>
                    <div className="text-[#8F8F8F]">→ {item.transporter}</div>
                  </div>
                </TableCell>

                <TableCell className="align-top max-w-md space-y-1">
                  <div className="font-medium text-[#EDEDED]">{item.reason}</div>
                  <div className="text-[11px] text-[#8F8F8F]">{item.evidence}</div>
                  {item.resolutionOutcome && (
                    <div className="text-[11px] text-[#8F8F8F] font-medium pt-1">
                      Resolution: {item.resolutionOutcome}
                    </div>
                  )}
                </TableCell>

                <TableCell className="align-top text-right font-mono font-semibold text-[#EDEDED]">
                  {formatMoney(item.disputedAmountETB)}
                </TableCell>

                <TableCell className="align-top text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    item.status === 'Resolved' ? 'bg-[#3ECF8E]/10 text-[#3ECF8E]' :
                    item.status === 'In Review' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
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
                        className="px-2 py-1 bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] text-[11px] font-bold rounded transition-colors shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolve(item.id, `Refunded to Shipper (${formatMoney(item.disputedAmountETB)})`)}
                        className="px-2 py-1 border border-[#2E2E2E] bg-[#181818] text-[#8F8F8F] hover:bg-[#2A2A2A] hover:text-[#EDEDED] text-[11px] font-medium rounded transition-colors"
                      >
                        Refund
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#8F8F8F]">Closed</span>
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
