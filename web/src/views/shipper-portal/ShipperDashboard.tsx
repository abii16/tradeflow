import React, { useState, useEffect } from 'react';
import FreightOrderForm from './components/FreightOrderForm';
import ActiveShipment from './components/ActiveShipment';
import { useAuth } from '../../hooks/useAuth';
import { getVerificationStatus } from '../../lib/apiClient';
import { ShieldCheck, ShieldAlert, AlertTriangle, Clock, RefreshCw, Building2, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShipperDashboard() {
  const { user, refreshUser } = useAuth();
  const [verificationData, setVerificationData] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchStatus = async (showToast = false) => {
    try {
      setLoadingStatus(true);
      const res = await getVerificationStatus();
      setVerificationData(res);
      await refreshUser();
      if (showToast) {
        toast.success(`Verification status updated: ${res.status}`);
      }
    } catch (err) {
      console.error('Failed to fetch verification status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const currentStatus = verificationData?.status || user?.verificationStatus || (user?.isVerified ? 'VERIFIED' : 'PENDING');
  const isVerified = currentStatus === 'VERIFIED' || user?.isVerified === true;
  const companyName = verificationData?.companyName || user?.companyName || 'Registered Enterprise';
  const tinNumber = verificationData?.tinNumber || user?.tinNumber || 'TIN-Pending';
  const tradeLicense = verificationData?.tradeLicense || user?.tradeLicense || 'MTI-Pending';
  const rejectionReason = verificationData?.verificationDetails?.rejectionReason;

  return (
    <div className="max-w-[1320px] mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#2E2E2E] gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight">
            Operations & Dispatch
          </h1>
          <p className="text-xs text-[#8F8F8F] mt-0.5">
            Djibouti — Modjo Corridor
          </p>
        </div>

        {/* Verification Status Pill in Header */}
        <div className="flex items-center gap-2">
          {isVerified ? (
            <div className="inline-flex items-center gap-2 bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-[#3ECF8E] px-3.5 py-1.5 rounded-xl text-xs font-semibold">
              <CheckCircle2 size={15} />
              <span>Verified Shipper • Approved by Administration</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3.5 py-1.5 rounded-xl text-xs font-semibold">
              <Clock size={15} />
              <span>Compliance Status: {currentStatus}</span>
            </div>
          )}
          <button
            onClick={() => fetchStatus(true)}
            disabled={loadingStatus}
            className="p-1.5 rounded-lg bg-[#232323] border border-[#2E2E2E] hover:border-[#8F8F8F] text-[#8F8F8F] hover:text-[#EDEDED] transition-all disabled:opacity-50"
            title="Refresh Verification Status"
          >
            <RefreshCw size={14} className={loadingStatus ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Verification Alert Banner (SRS Section 3.1 FR-01) */}
      {!isVerified && (
        <div className="animate-in fade-in slide-in-from-top-3 duration-300">
          {currentStatus === 'PENDING' && (
            <div className="bg-gradient-to-r from-amber-500/10 via-[#232323] to-[#1C1C1C] border border-amber-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-amber-500/5 blur-2xl pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert size={22} className="animate-pulse" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      SRS FR-01: Commercial Entity Verification In Progress
                    </h3>
                    <span className="text-[10px] font-mono uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30">
                      Pending Admin Review
                    </span>
                  </div>

                  <p className="text-xs text-[#EDEDED]/90 leading-relaxed">
                    Your business credentials for <strong className="text-amber-200">{companyName}</strong> (TIN: <span className="font-mono text-[#EDEDED]">{tinNumber}</span>, License: <span className="font-mono text-[#EDEDED]">{tradeLicense}</span>) have been received and placed in the <strong>Platform Administrator Verification Queue</strong>.
                  </p>

                  <div className="bg-[#141414]/70 border border-amber-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-amber-200/80">
                      <span className="font-bold text-amber-400">🔒 Policy Notice:</span>
                      <span>Per SRS Section 3.1 Acceptance Criteria, freight load posting and marketplace broadcast are locked until your legal registration is approved.</span>
                    </div>
                    <button
                      onClick={() => fetchStatus(true)}
                      disabled={loadingStatus}
                      className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <RefreshCw size={12} className={loadingStatus ? 'animate-spin' : ''} />
                      Check Approval
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStatus === 'REJECTED' && (
            <div className="bg-gradient-to-r from-rose-500/10 via-[#232323] to-[#1C1C1C] border border-rose-500/30 rounded-2xl p-5 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={22} />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-bold text-rose-400">
                    Verification Application Requires Rectification
                  </h3>
                  <p className="text-xs text-[#EDEDED]/90">
                    Your submitted trade credentials could not be verified by the administrator.
                    {rejectionReason && (
                      <span className="block mt-1 text-rose-300 font-mono bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                        Reason: {rejectionReason}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[#8F8F8F]">
                    Please contact platform compliance or update your registration details to enable load posting.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStatus === 'SUSPENDED' && (
            <div className="bg-[#232323] border border-rose-500/40 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle size={20} />
                <h3 className="text-sm font-bold">Account Access Suspended</h3>
              </div>
              <p className="text-xs text-[#8F8F8F] mt-1">
                Your account is currently suspended by system administration. Load posting and carrier booking actions are disabled.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Order Form + Active Shipment */}
      <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-5 items-start">
        <div className="w-full">
          <FreightOrderForm
            verificationStatus={currentStatus}
            isVerified={isVerified}
            onRefreshVerification={() => fetchStatus(true)}
          />
        </div>
        <div className="w-full">
          <ActiveShipment />
        </div>
      </div>
    </div>
  );
}
