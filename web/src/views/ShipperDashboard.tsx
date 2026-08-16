import React from 'react';
import FreightOrderForm from '../components/FreightOrderForm';
import ActiveShipment from '../components/ActiveShipment';

export default function ShipperDashboard() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-6 items-start">
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
