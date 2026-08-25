import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Download } from 'lucide-react';

interface TransactionLedgerProps {
  currency: 'ETB' | 'USD' | 'DJF';
  rates: { USD: number; DJF: number };
  formatMoney: (amountInETB: number) => string;
}

interface LedgerEntry {
  id: string;
  txHash: string;
  date: string;
  shipmentRef: string;
  waybillId: string;
  party: string;
  category: 'Carrier Payout' | 'Escrow Lock' | 'Demurrage Surcharge';
  grossAmountETB: number;
  platformFeeETB: number;
  netDisbursedETB: number;
  channel: 'TeleBirr' | 'CBE Birr' | 'Internal Escrow';
  status: 'Released' | 'Locked' | 'Disputed';
}



export default function TransactionLedger({
  currency,
  rates,
  formatMoney
}: TransactionLedgerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Released' | 'Locked' | 'Disputed'>('All');
  const [selectedTx, setSelectedTx] = useState<LedgerEntry | null>(null);
  
  const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        // We import fetchPayments dynamically or we should import it at the top. Let me import it.
        // I will add the import in a separate replace_file_content call.
        // For now, use any fetched data mapped to LedgerEntry.
        const { fetchPayments } = await import('@/lib/apiClient');
        const res = await fetchPayments();
        
        // Map backend payment data to LedgerEntry
        const mapped: LedgerEntry[] = (res.data || []).map((p: any) => ({
          id: p.id,
          txHash: p.transactionRef || 'N/A',
          date: new Date(p.createdAt).toISOString().replace('T', ' ').substring(0, 16),
          shipmentRef: p.shipmentId || 'N/A',
          waybillId: p.shipmentId || 'N/A',
          party: p.payeeId || 'Unknown',
          category: p.status === 'ESCROW_HELD' ? 'Escrow Lock' : 'Carrier Payout',
          grossAmountETB: Number(p.amount) || 0,
          platformFeeETB: (Number(p.amount) || 0) * 0.03, // 3% fee
          netDisbursedETB: (Number(p.amount) || 0) * 0.97,
          channel: p.provider || 'Internal Escrow',
          status: p.status === 'PAID' ? 'Released' : p.status === 'ESCROW_HELD' ? 'Locked' : 'Disputed'
        }));
        
        setLedgerData(mapped);
      } catch (err) {
        console.error('Failed to load payments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  const filteredEntries = useMemo(() => {
    return ledgerData.filter((entry) => {
      const matchesStatus = statusFilter === 'All' || entry.status === statusFilter;
      const matchesSearch = 
        entry.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.shipmentRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.waybillId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.party.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [searchTerm, statusFilter, ledgerData]);

  const handleExportCSV = () => {
    const headers = ['Date', 'TxHash', 'Waybill', 'Party', 'Category', 'Gross_ETB', 'Net_ETB', 'Status'];
    const rows = filteredEntries.map(e => [
      e.date,
      e.txHash,
      e.waybillId,
      `"${e.party}"`,
      e.category,
      e.grossAmountETB,
      e.netDisbursedETB,
      e.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `tradeflow_ledger_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-md text-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter waybill, tx, carrier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex items-center gap-1">
            {(['All', 'Released', 'Locked', 'Disputed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-1.5"
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Dense, Clean Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 text-[11px] font-semibold text-slate-600">
            <TableRow>
              <TableHead>Date / Tx Hash</TableHead>
              <TableHead>Waybill & Load</TableHead>
              <TableHead>Transporter</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Fee (3%)</TableHead>
              <TableHead className="text-right">Net Payout</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {filteredEntries.map((row) => (
              <TableRow 
                key={row.id} 
                onClick={() => setSelectedTx(row)}
                className="hover:bg-slate-50/50 cursor-pointer"
              >
                <TableCell>
                  <div className="text-slate-800">{row.date}</div>
                  <div className="text-[10px] font-mono text-slate-400">{row.txHash}</div>
                </TableCell>

                <TableCell>
                  <div className="font-mono font-medium text-slate-900">{row.waybillId}</div>
                  <div className="text-[11px] text-slate-500">{row.shipmentRef}</div>
                </TableCell>

                <TableCell className="font-medium text-slate-900">
                  {row.party}
                </TableCell>

                <TableCell className="text-slate-600">
                  {row.channel}
                </TableCell>

                <TableCell className="text-right font-mono text-slate-700">
                  {formatMoney(row.grossAmountETB)}
                </TableCell>

                <TableCell className="text-right font-mono text-slate-500">
                  -{formatMoney(row.platformFeeETB)}
                </TableCell>

                <TableCell className="text-right font-mono font-semibold text-slate-900">
                  {formatMoney(row.netDisbursedETB)}
                </TableCell>

                <TableCell className="text-center">
                  <span className={`text-[11px] ${
                    row.status === 'Released' ? 'text-slate-900 font-medium' :
                    row.status === 'Locked' ? 'text-amber-800 font-medium' : 'text-red-700 font-medium'
                  }`}>
                    {row.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-lg max-w-sm w-full p-5 border border-slate-200 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Ledger Audit Record</h3>
              <button 
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-2 font-mono">
              <div className="flex justify-between"><span className="text-slate-500 font-sans">Tx Hash:</span> <strong>{selectedTx.txHash}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500 font-sans">Waybill:</span> <strong>{selectedTx.waybillId}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500 font-sans">Transporter:</span> <strong className="font-sans">{selectedTx.party}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500 font-sans">Gross:</span> <strong>{formatMoney(selectedTx.grossAmountETB)}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500 font-sans">Platform Fee:</span> <strong>{formatMoney(selectedTx.platformFeeETB)}</strong></div>
              <div className="flex justify-between pt-1 border-t border-slate-100"><span className="text-slate-700 font-sans font-medium">Net Disbursed:</span> <strong className="text-emerald-800">{formatMoney(selectedTx.netDisbursedETB)}</strong></div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="w-full mt-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
