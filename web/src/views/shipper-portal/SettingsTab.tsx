import React, { useState, useEffect } from 'react';
import { submitVerification, getShipperOrganization, updateShipperOrganization } from '../../lib/apiClient';
import toast from 'react-hot-toast';

export default function SettingsTab() {
  const [tradeLicense, setTradeLicense] = useState('');
  const [taxId, setTaxId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
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
      toast.success('Organization updated successfully!');
    } catch (err: any) {
      toast.error('Failed to update organization: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeLicense || !taxId) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await submitVerification({ tradeLicenseNumber: tradeLicense, taxId: taxId });
      toast.success('Verification request submitted successfully!');
      setVerificationStatus('PENDING');
    } catch (err: any) {
      toast.error('Failed to submit verification: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto space-y-5">
      <div className="pb-4 border-b border-[#2E2E2E]">
        <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">Shipper Settings</h1>
        <p className="text-xs text-[#8F8F8F] mt-0.5">Manage preferences, company profile, and notification settings.</p>
      </div>

      <div className="bg-[#232323] border border-[#2E2E2E] rounded-md p-6 max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#EDEDED]">Verification Request</h2>
            <p className="text-xs text-[#8F8F8F] mt-0.5">Submit your company details for platform verification.</p>
          </div>
          {verificationStatus === 'VERIFIED' && <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">VERIFIED</span>}
          {verificationStatus === 'PENDING' && <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">PENDING REVIEW</span>}
          {verificationStatus === 'SUSPENDED' && <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200">SUSPENDED</span>}
          {verificationStatus === 'UNVERIFIED' && <span className="bg-[#181818] text-[#EDEDED] text-[10px] font-bold px-2 py-0.5 rounded border border-[#2E2E2E]">UNVERIFIED</span>}
        </div>

        <form onSubmit={handleOrgSubmit} className="space-y-4 pt-2 border-t border-[#2E2E2E]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#EDEDED] mb-1">Company Name</label>
              <input 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full text-sm border border-[#2E2E2E] rounded px-3 py-2 focus:ring-1 focus:ring-[#3ECF8E] outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#EDEDED] mb-1">Phone</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm border border-[#2E2E2E] rounded px-3 py-2 focus:ring-1 focus:ring-[#3ECF8E] outline-none" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#EDEDED] mb-1">Trade License Number</label>
            <input 
              type="text" 
              value={tradeLicense}
              onChange={(e) => setTradeLicense(e.target.value)}
              className="w-full text-sm border border-[#2E2E2E] rounded px-3 py-2 focus:ring-1 focus:ring-[#3ECF8E] outline-none" 
              placeholder="e.g. TRD-12345" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#EDEDED] mb-1">Tax ID (TIN)</label>
            <input 
              type="text" 
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full text-sm border border-[#2E2E2E] rounded px-3 py-2 focus:ring-1 focus:ring-[#3ECF8E] outline-none" 
              placeholder="e.g. TIN-ET-9942" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#3ECF8E] text-white text-xs font-semibold px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Organization Profile'}
          </button>
        </form>
        <div className="pt-4 mt-4 border-t border-[#2E2E2E]">
           <button onClick={handleVerificationSubmit} disabled={loading} className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded border border-emerald-200">
             Submit to Admin for Verification
           </button>
        </div>
      </div>

      <div className="bg-[#232323] border border-[#2E2E2E] rounded-md p-6 max-w-2xl space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#EDEDED]">Notification Preferences</h2>
          <p className="text-xs text-[#8F8F8F] mt-0.5">Choose which alerts you want to receive across the corridor.</p>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between p-3 border border-[#2E2E2E] rounded cursor-pointer hover:bg-[#1C1C1C] transition-colors">
            <div>
              <div className="text-xs font-bold text-[#EDEDED]">In-App Notifications</div>
              <div className="text-[10px] text-[#8F8F8F]">Receive real-time alerts while using the web or mobile app.</div>
            </div>
            <input 
              type="checkbox" 
              checked={notifications.app} 
              onChange={e => {
                const newSettings = { ...notifications, app: e.target.checked };
                setNotifications(newSettings);
                updateShipperOrganization({ companyName, phone, tinNumber: taxId, tradeLicense, metadata: { notifications: newSettings } }).catch(console.error);
              }}
              className="rounded border-[#2E2E2E] text-[#3ECF8E] focus:ring-blue-600" 
            />
          </label>
          <label className="flex items-center justify-between p-3 border border-[#2E2E2E] rounded cursor-pointer hover:bg-[#1C1C1C] transition-colors">
            <div>
              <div className="text-xs font-bold text-[#EDEDED]">SMS Alerts</div>
              <div className="text-[10px] text-[#8F8F8F]">Get critical milestone alerts via SMS on your registered phone.</div>
            </div>
            <input 
              type="checkbox" 
              checked={notifications.sms} 
              onChange={e => {
                const newSettings = { ...notifications, sms: e.target.checked };
                setNotifications(newSettings);
                updateShipperOrganization({ companyName, phone, tinNumber: taxId, tradeLicense, metadata: { notifications: newSettings } }).catch(console.error);
              }}
              className="rounded border-[#2E2E2E] text-[#3ECF8E] focus:ring-blue-600" 
            />
          </label>
          <label className="flex items-center justify-between p-3 border border-[#2E2E2E] rounded cursor-pointer hover:bg-[#1C1C1C] transition-colors">
            <div>
              <div className="text-xs font-bold text-[#EDEDED]">Email Updates</div>
              <div className="text-[10px] text-[#8F8F8F]">Receive detailed daily summaries and important alerts via email.</div>
            </div>
            <input 
              type="checkbox" 
              checked={notifications.email} 
              onChange={e => {
                const newSettings = { ...notifications, email: e.target.checked };
                setNotifications(newSettings);
                updateShipperOrganization({ companyName, phone, tinNumber: taxId, tradeLicense, metadata: { notifications: newSettings } }).catch(console.error);
              }}
              className="rounded border-[#2E2E2E] text-[#3ECF8E] focus:ring-blue-600" 
            />
          </label>
        </div>
      </div>
    </div>
  );
}
