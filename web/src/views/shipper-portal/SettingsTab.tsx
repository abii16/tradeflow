import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { submitVerification, getShipperOrganization, updateShipperOrganization } from '../../lib/apiClient';
import { Building2, ShieldCheck, Bell, Save, CheckCircle2, AlertCircle, Clock, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsTab() {
  const { t } = useTranslation();
  const [tradeLicense, setTradeLicense] = useState('');
  const [taxId, setTaxId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('UNVERIFIED');
  const [notifications, setNotifications] = useState({
    app: true,
    sms: false,
    email: true
  });
  
  useEffect(() => {
    async function loadOrg() {
      try {
        const data = await getShipperOrganization();
        if (data.organization) {
          setCompanyName(data.organization.companyName || '');
          setPhone(data.organization.phone || '');
          setTaxId(data.organization.tinNumber || '');
          setTradeLicense(data.organization.tradeLicense || '');
          setVerificationStatus(data.organization.verificationStatus || 'UNVERIFIED');
          if (data.organization.metadata?.notifications) {
            setNotifications(data.organization.metadata.notifications);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadOrg();
  }, []);

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateShipperOrganization({ 
        companyName, 
        phone, 
        tinNumber: taxId, 
        tradeLicense,
        metadata: { notifications }
      });
      toast.success('Organization profile synchronized successfully!');
    } catch (err: any) {
      toast.error('Failed to update organization: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeLicense || !taxId) {
      toast.error('Please specify both Trade License and TIN Number before requesting verification.');
      return;
    }
    setSubmittingVerification(true);
    try {
      await submitVerification({ tradeLicenseNumber: tradeLicense, taxId: taxId });
      toast.success('Credentials submitted to TradeFlow Admin Verification Queue!');
      setVerificationStatus('PENDING');
    } catch (err: any) {
      toast.error('Failed to submit verification: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingVerification(false);
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="pb-6 border-b border-[#2E2E2E]">
        <h1 className="text-2xl font-bold text-[#EDEDED] tracking-tight flex items-center gap-2.5">
          <Building2 size={24} className="text-[#3ECF8E]" />
          Shipper Organization & Compliance
        </h1>
        <p className="text-xs text-[#8F8F8F] mt-1">
          Manage legal entity profile, commercial trade licenses, and corridor alert subscriptions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Regulatory Credentials */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl p-6 shadow-lg shadow-black/40 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-[#2E2E2E]">
              <div>
                <h2 className="text-sm font-bold text-[#EDEDED] flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#3ECF8E]" />
                  Commercial Entity Registration
                </h2>
                <p className="text-xs text-[#8F8F8F] mt-0.5">Required for corridor freight dispatch under Ethiopian & Djibouti law.</p>
              </div>
              <div>
                {verificationStatus === 'VERIFIED' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/30 shadow-sm">
                    <CheckCircle2 size={13} /> VERIFIED ENTITY
                  </span>
                )}
                {verificationStatus === 'PENDING' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Clock size={13} /> PENDING ADMIN AUDIT
                  </span>
                )}
                {verificationStatus === 'SUSPENDED' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                    <AlertCircle size={13} /> SUSPENDED
                  </span>
                )}
                {verificationStatus === 'UNVERIFIED' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#181818] text-[#8F8F8F] border border-[#2E2E2E]">
                    <Lock size={13} /> UNVERIFIED
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleOrgSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] mb-1.5">Registered Enterprise Name</label>
                  <input 
                    type="text" 
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs border border-[#2E2E2E] bg-[#1C1C1C] text-[#EDEDED] rounded-lg px-3 py-2.5 focus:border-[#3ECF8E] focus:ring-2 focus:ring-[#3ECF8E]/20 outline-none transition-all font-medium" 
                    placeholder="e.g. Ethio-Djibouti Trading PLC"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] mb-1.5">Dispatch Contact Phone</label>
                  <input 
                    type="text" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs border border-[#2E2E2E] bg-[#1C1C1C] text-[#EDEDED] rounded-lg px-3 py-2.5 focus:border-[#3ECF8E] focus:ring-2 focus:ring-[#3ECF8E]/20 outline-none transition-all font-medium font-mono" 
                    placeholder="+251 911 234 567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] mb-1.5">Trade License Number (MOTI)</label>
                  <input 
                    type="text" 
                    value={tradeLicense}
                    onChange={(e) => setTradeLicense(e.target.value)}
                    className="w-full text-xs border border-[#2E2E2E] bg-[#1C1C1C] text-[#EDEDED] rounded-lg px-3 py-2.5 focus:border-[#3ECF8E] focus:ring-2 focus:ring-[#3ECF8E]/20 outline-none transition-all font-medium font-mono" 
                    placeholder="TRD-ETH-2026-9812" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] mb-1.5">Tax Identification Number (TIN)</label>
                  <input 
                    type="text" 
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full text-xs border border-[#2E2E2E] bg-[#1C1C1C] text-[#EDEDED] rounded-lg px-3 py-2.5 focus:border-[#3ECF8E] focus:ring-2 focus:ring-[#3ECF8E]/20 outline-none transition-all font-medium font-mono" 
                    placeholder="0048192041" 
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-[#3ECF8E] text-[#1C1C1C] hover:bg-[#34b27b] text-xs font-bold px-5 py-2.5 rounded-lg shadow-md hover:shadow-[0_0_15px_rgba(62,207,142,0.3)] transition-all hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{loading ? 'Saving Changes...' : 'Save Organization Details'}</span>
                </button>

                {verificationStatus !== 'VERIFIED' && (
                  <button 
                    type="button"
                    onClick={handleVerificationSubmit} 
                    disabled={submittingVerification || !tradeLicense || !taxId}
                    className="text-xs font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 hover:bg-[#3ECF8E]/20 px-4 py-2.5 rounded-lg border border-[#3ECF8E]/30 transition-all disabled:opacity-40"
                  >
                    {submittingVerification ? 'Submitting to Queue...' : 'Request Official Admin Verification'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Notification Preferences */}
        <div className="space-y-6">
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-xl p-6 shadow-lg shadow-black/40 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#EDEDED] flex items-center gap-2">
                <Bell size={16} className="text-[#3ECF8E]" />
                Corridor Telemetry Alerts
              </h2>
              <p className="text-xs text-[#8F8F8F] mt-1 leading-relaxed">
                Configure real-time notifications for milestone crossings, geofence breaches, and bid submissions.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3.5 border border-[#2E2E2E] bg-[#1C1C1C] rounded-lg cursor-pointer hover:border-[#3ECF8E]/40 transition-colors">
                <div className="pr-3">
                  <div className="text-xs font-bold text-[#EDEDED]">In-App Live Alerts</div>
                  <div className="text-[10px] text-[#8F8F8F] mt-0.5">Real-time alerts via WebSocket push notifications.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.app} 
                  onChange={e => {
                    const newSettings = { ...notifications, app: e.target.checked };
                    setNotifications(newSettings);
                    updateShipperOrganization({ companyName, phone, tinNumber: taxId, tradeLicense, metadata: { notifications: newSettings } }).catch(console.error);
                  }}
                  className="w-4 h-4 rounded border-[#2E2E2E] accent-[#3ECF8E] cursor-pointer" 
                />
              </label>

              <label className="flex items-center justify-between p-3.5 border border-[#2E2E2E] bg-[#1C1C1C] rounded-lg cursor-pointer hover:border-[#3ECF8E]/40 transition-colors">
                <div className="pr-3">
                  <div className="text-xs font-bold text-[#EDEDED]">SMS Milestone Dispatch</div>
                  <div className="text-[10px] text-[#8F8F8F] mt-0.5">Direct SMS when trucks cross Galafi border or Modjo port.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.sms} 
                  onChange={e => {
                    const newSettings = { ...notifications, sms: e.target.checked };
                    setNotifications(newSettings);
                    updateShipperOrganization({ companyName, phone, tinNumber: taxId, tradeLicense, metadata: { notifications: newSettings } }).catch(console.error);
                  }}
                  className="w-4 h-4 rounded border-[#2E2E2E] accent-[#3ECF8E] cursor-pointer" 
                />
              </label>

              <label className="flex items-center justify-between p-3.5 border border-[#2E2E2E] bg-[#1C1C1C] rounded-lg cursor-pointer hover:border-[#3ECF8E]/40 transition-colors">
                <div className="pr-3">
                  <div className="text-xs font-bold text-[#EDEDED]">Audit & Customs Digests</div>
                  <div className="text-[10px] text-[#8F8F8F] mt-0.5">Daily e-CMR waybill and customs seal clearance reports.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.email} 
                  onChange={e => {
                    const newSettings = { ...notifications, email: e.target.checked };
                    setNotifications(newSettings);
                    updateShipperOrganization({ companyName, phone, tinNumber: taxId, tradeLicense, metadata: { notifications: newSettings } }).catch(console.error);
                  }}
                  className="w-4 h-4 rounded border-[#2E2E2E] accent-[#3ECF8E] cursor-pointer" 
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
