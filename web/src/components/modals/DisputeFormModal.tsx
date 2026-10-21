import React, { useState } from 'react';
import { Scale, AlertCircle, X, ShieldAlert, CheckCircle2, Loader2, FileWarning } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { raiseShipmentDispute } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface DisputeFormModalProps {
  shipmentId?: string;
  transactionId?: string;
  trackingNumber?: string;
  carrierName?: string;
  amountETB?: string | number;
  onClose: () => void;
  onSuccess?: () => void;
}

const DISPUTE_REASONS = [
  { value: 'Cargo Shortage / Missing Units', labelEn: 'Cargo Shortage / Missing Units', labelAm: 'የጭነት ጉድለት ወይም የጎደሉ እቃዎች' },
  { value: 'Physical Cargo Damage', labelEn: 'Physical Cargo Damage / Tampered Seal', labelAm: 'የጭነት ጉዳት ወይም ማህተም መበላሸት' },
  { value: 'Severe Unjustified Delay', labelEn: 'Severe Unjustified Transit Delay', labelAm: 'ያልተገባ የጊዜ መዘግየት' },
  { value: 'Unauthorized Route Detour', labelEn: 'Unauthorized Corridor Detour', labelAm: 'ያልተፈቀደ መንገድ መቀየር' },
  { value: 'Tariff / Fuel Surcharge Discrepancy', labelEn: 'Tariff / Escrow Calculation Discrepancy', labelAm: 'የክፍያ ወይም የታሪፍ ልዩነት' },
  { value: 'Other Operational Breach', labelEn: 'Other Carrier SLA Breach', labelAm: 'ሌላ የአሰራር ጥሰት' },
];

export default function DisputeFormModal({
  shipmentId,
  transactionId,
  trackingNumber,
  carrierName,
  amountETB,
  onClose,
  onSuccess,
}: DisputeFormModalProps) {
  const { t, i18n } = useTranslation();
  const isAm = i18n.language === 'am';

  const effectiveId = shipmentId || transactionId || 'SHP-ACTIVE';
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [disputeResult, setDisputeResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      toast.error(isAm ? 'እባክዎ የቅሬታውን ምክንያት ይምረጡ' : 'Please select a dispute reason');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      toast.error(isAm ? 'እባክዎ ዝርዝር ማብራሪያ (ቢያንስ 5 ፊደላት) ያስገቡ' : 'Please provide detailed description (minimum 5 chars)');
      return;
    }

    try {
      setSubmitting(true);
      const fullReason = `${selectedReason}: ${description.trim()}`;
      const res = await raiseShipmentDispute(effectiveId, {
        reason: fullReason,
      });

      toast.success(
        isAm 
          ? 'ቅሬታው ተመዝግቧል! የቴሌብር ኤስክሮው ክፍያ ታግዷል (SRS FR-10.3)' 
          : 'Dispute recorded! Escrow payout has been frozen for mediation (SRS FR-10.3)'
      );

      setDisputeResult(res?.dispute || { id: 'DISP-NEW', ticketNo: 'TICK-' + effectiveId.slice(0, 6).toUpperCase() });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Failed to submit dispute:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to submit dispute ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#141414] rounded-2xl w-full max-w-lg shadow-2xl border border-[#282828] flex flex-col overflow-hidden text-[#EDEDED]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#242424] bg-[#181818] flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Scale size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#EDEDED] tracking-tight">
                {isAm ? 'የክፍያ እና የአገልግሎት ቅሬታ ማቅረቢያ (SRS FR-10.3)' : 'Raise Payment Dispute (SRS FR-10.3)'}
              </h3>
              <p className="text-[11px] text-[#8F8F8F] font-mono">
                {trackingNumber || `SHP-${effectiveId.slice(0, 8).toUpperCase()}-DJM`}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-[#8F8F8F] hover:text-[#EDEDED] p-1.5 rounded-lg hover:bg-[#242424] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {!disputeResult ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Escrow Freeze Warning Banner */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200/90 flex items-start gap-3">
                <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-300 block">
                    {isAm ? 'የቴሌብር ኤስክሮው እገዳ ማስጠንቀቂያ' : 'Escrow Fund Freezing Notice'}
                  </span>
                  <p className="text-[11px] text-[#EDEDED]/80 leading-relaxed">
                    {isAm 
                      ? 'ይህንን ቅሬታ ሲያስገቡ የተመደበው የኤስክሮው ክፍያ ወዲያውኑ ይታገዳል (Frozen)። የኮሪደር ኦፕሬሽንስ አስተዳዳሪ የጂፒኤስ እና የቴሌማቲክስ መረጃዎችን በመመርመር ውሳኔ ይሰጣል።' 
                      : 'Submitting this dispute immediately locks the TeleBirr escrow payout to the carrier. Platform administrators will audit GPS and telematics records for mediation.'}
                  </p>
                </div>
              </div>

              {/* Carrier & Shipment Reference Chip */}
              <div className="bg-[#181818] border border-[#242424] rounded-xl p-3 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[#8F8F8F] block uppercase tracking-wider">{isAm ? 'አጓጓዥ' : 'Carrier'}</span>
                  <span className="text-[#EDEDED] font-semibold truncate block">{carrierName || 'Assigned Transporter'}</span>
                </div>
                {amountETB && (
                  <div>
                    <span className="text-[10px] text-[#8F8F8F] block uppercase tracking-wider">{isAm ? 'የኤስክሮው መጠን' : 'Escrow Amount'}</span>
                    <span className="text-[#3ECF8E] font-bold block">{Number(amountETB).toLocaleString()} ETB</span>
                  </div>
                )}
              </div>

              {/* Reason Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#EDEDED]">
                  {isAm ? 'የቅሬታው ዋና ምክንያት' : 'Dispute Classification'} <span className="text-amber-400">*</span>
                </label>
                <select 
                  value={selectedReason} 
                  onChange={(e) => setSelectedReason(e.target.value)} 
                  required
                  className="w-full bg-[#181818] border border-[#282828] focus:border-amber-500/50 rounded-xl px-3 py-2.5 text-xs text-[#EDEDED] outline-none transition-colors"
                >
                  <option value="" disabled className="text-[#707070]">
                    {isAm ? '-- የቅሬታ አይነት ይምረጡ --' : '-- Select a dispute category --'}
                  </option>
                  {DISPUTE_REASONS.map((r, i) => (
                    <option key={i} value={r.value} className="bg-[#181818] text-[#EDEDED]">
                      {isAm ? r.labelAm : r.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#EDEDED]">
                  {isAm ? 'ዝርዝር ማብራሪያ እና ማስረጃ' : 'Detailed Evidence & Notes'} <span className="text-amber-400">*</span>
                </label>
                <textarea 
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#181818] border border-[#282828] focus:border-amber-500/50 rounded-xl p-3 text-xs text-[#EDEDED] placeholder-[#666] outline-none resize-none transition-colors"
                  placeholder={
                    isAm 
                      ? 'ለምሳሌ፡ የተሰበረ ካርቶን፣ የጎደሉ እቃዎች፣ ወይም የተዘገየበትን የሰዓት ልዩነት ይግለጹ...' 
                      : 'Provide incident details, seal discrepancy, timestamped notes, or cargo quantity shortfalls...'
                  }
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#242424]">
                <button 
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium text-[#8F8F8F] hover:text-[#EDEDED] hover:bg-[#242424] border border-[#282828] rounded-xl transition-colors cursor-pointer"
                >
                  {isAm ? 'ተመለስ' : 'Cancel'}
                </button>
                <button 
                  type="submit"
                  disabled={submitting || !selectedReason || !description.trim()}
                  className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting && <Loader2 size={13} className="animate-spin text-black" />}
                  <span>{isAm ? 'ቅሬታውን መዝግብና ክፍያውን እገድ' : 'Submit Dispute & Freeze Escrow'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Dispute Submitted Success Screen */
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <FileWarning size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#EDEDED]">
                  {isAm ? 'ቅሬታው በተሳካ ሁኔታ ተመዝግቧል' : 'Escrow Dispute Successfully Filed'}
                </h3>
                <p className="text-xs text-[#8F8F8F] max-w-sm mx-auto">
                  {isAm
                    ? 'ጉዳዩ በቀጥታ ወደ አስተዳዳሪ የግልግል ዳሽቦርድ (Dispute Mediation) ተመርቷል።'
                    : 'Ticket has been routed to the Platform Administration & Mediation Control Tower.'}
                </p>
              </div>

              <div className="bg-[#181818] border border-[#282828] rounded-xl p-3 inline-block font-mono text-xs text-amber-400">
                <span>{isAm ? 'የቲኬት ቁጥር፡ ' : 'Ticket Ref: '}</span>
                <strong>{disputeResult.ticketNo || disputeResult.id || 'DISP-ESCR-2026'}</strong>
              </div>

              <div>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#242424] hover:bg-[#2C2C2C] text-[#EDEDED] border border-[#333] px-5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  {isAm ? 'ዝጋ' : 'Close'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
