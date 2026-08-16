import React from 'react';
import FreightOrderForm from '../components/FreightOrderForm';
import ActiveShipment from '../components/ActiveShipment';

export default function ShipperDashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FreightOrderForm />
        </div>
        <div className="lg:col-span-1">
          <ActiveShipment />
        </div>
      </div>
    </div>
  );
}
