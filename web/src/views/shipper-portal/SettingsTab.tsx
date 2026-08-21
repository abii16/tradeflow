import React, { useState, useEffect } from 'react';
import { submitVerification, getShipperOrganization, updateShipperOrganization } from '../../lib/apiClient';
import toast from 'react-hot-toast';

export default function SettingsTab() {
  const [tradeLicense, setTradeLicense] = useState('');
  const [taxId, setTaxId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    async function loadOrg() {
      try {
        const data = await getShipperOrganization();
        if (data.organization) {
          setCompanyName(data.organization.companyName || '');
          setPhone(data.organization.phone || '');
          setTaxId(data.organization.tinNumber || '');
          setTradeLicense(data.organization.tradeLicense || '');
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
      await updateShipperOrganization({ companyName, phone, tinNumber: taxId, tradeLicense });
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
      setTradeLicense('');
      setTaxId('');
    } catch (err: any) {
      toast.error('Failed to submit verification: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto space-y-5">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Shipper Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage preferences, company profile, and notification settings.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-6 max-w-2xl space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Verification Request</h2>
          <p className="text-xs text-slate-500 mt-0.5">Submit your company details for platform verification.</p>
        </div>

        <form onSubmit={handleOrgSubmit} className="space-y-4 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
              <input 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trade License Number</label>
            <input 
              type="text" 
              value={tradeLicense}
              onChange={(e) => setTradeLicense(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none" 
              placeholder="e.g. TRD-12345" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tax ID (TIN)</label>
            <input 
              type="text" 
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none" 
              placeholder="e.g. TIN-ET-9942" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Organization Profile'}
          </button>
        </form>
        <div className="pt-4 mt-4 border-t border-slate-100">
           <button onClick={handleVerificationSubmit} disabled={loading} className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded border border-emerald-200">
             Submit to Admin for Verification
           </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-6 max-w-2xl space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Notification Preferences</h2>
          <p className="text-xs text-slate-500 mt-0.5">Choose which alerts you want to receive across the corridor.</p>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
            <span>Notify on new carrier bids and price quotes</span>
          </label>
          <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
            <span>Notify on border checkpoint status changes (Galafi, Awash)</span>
          </label>
          <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
            <span>Escrow milestone release confirmations</span>
          </label>
        </div>
      </div>
    </div>
  );
}
