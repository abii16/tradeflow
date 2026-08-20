import React from 'react';

export default function SettingsTab() {
  return (
    <div className="max-w-[1320px] mx-auto space-y-5">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Shipper Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage preferences, company profile, and notification settings.</p>
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
