import React from 'react';
import FreightOrderForm from '../components/FreightOrderForm';
import ActiveShipment from '../components/ActiveShipment';

export default function ShipperDashboard() {
  return (
    <div className="max-w-[1320px] mx-auto space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Shipper Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Post loads, match transporters, and track active corridor shipments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-5 items-start">
        <div className="w-full">
          <FreightOrderForm />
        </div>
        <div className="w-full">
          <ActiveShipment />
        </div>
      </div>
    </div>
  );
}
