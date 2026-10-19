import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Truck, 
  Plus, 
  ShieldCheck, 
  FileText, 
  Trash2, 
  UserCheck, 
  Fuel, 
  Scale, 
  X, 
  Loader2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { getCarrierVehicles, addCarrierVehicle, deleteCarrierVehicle, getCarrierDrivers } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface VehicleItem {
  id: string;
  ownerId: string;
  vehicleType: string;
  plateNumber?: string | null;
  capacityTons: string;
  fuelType: string | null;
  insuranceDocUrl: string | null;
  roadworthinessDocUrl: string | null;
  isVerified: boolean;
  createdAt: string;
}

interface DriverItem {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  companyName: string | null;
  isVerified: boolean;
}

export default function FleetManagementTab() {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Add Truck Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [vehicleType, setVehicleType] = useState<string>('');
  const [plateNumber, setPlateNumber] = useState<string>('');
  const [capacityTons, setCapacityTons] = useState<string>('40');
  const [fuelType, setFuelType] = useState<string>('Diesel');
  const [insuranceDocUrl, setInsuranceDocUrl] = useState<string>('https://tradeflow.et/docs/insurance_sample.pdf');
  const [roadworthinessDocUrl, setRoadworthinessDocUrl] = useState<string>('https://tradeflow.et/docs/roadworthy_sample.pdf');
  const [savingTruck, setSavingTruck] = useState<boolean>(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [vRes, dRes] = await Promise.all([
        getCarrierVehicles(),
        getCarrierDrivers(),
      ]);

      if (vRes?.vehicles) setVehicles(vRes.vehicles);
      if (dRes?.drivers) setDrivers(dRes.drivers);
    } catch (err: any) {
      console.error('Failed to fetch fleet data:', err);
      toast.error('Could not load fleet assets');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleType.trim() || !capacityTons) {
      toast.error('Vehicle model and capacity are required');
      return;
    }

    setSavingTruck(true);
    try {
      await addCarrierVehicle({
        vehicleType,
        plateNumber: plateNumber.trim() || undefined,
        capacityTons: parseFloat(capacityTons),
        fuelType,
        insuranceDocUrl,
        roadworthinessDocUrl,
      });

      toast.success('Truck registered and added to fleet!');
      setShowAddModal(false);
      setVehicleType('');
      setPlateNumber('');
      await fetchData(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add vehicle');
    } finally {
      setSavingTruck(false);
    }
  };

  const handleDeleteTruck = async (vehicleId: string) => {
    if (!window.confirm('Are you sure you want to remove this vehicle from your active fleet?')) return;
    try {
      await deleteCarrierVehicle(vehicleId);
      toast.success('Vehicle removed from fleet');
      await fetchData(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove vehicle');
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-[#8F8F8F] gap-3">
        <Loader2 size={32} className="animate-spin text-[#3ECF8E]" />
        <span className="text-xs font-mono">Fetching fleet assets & driver rosters from database...</span>
      </div>
    );
  }

  const totalCapacity = vehicles.reduce((acc, v) => acc + parseFloat(v.capacityTons || '0'), 0);
  const verifiedCount = vehicles.filter((v) => v.isVerified).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2E2E2E]">
        <div>
          <h2 className="text-xl font-bold text-[#EDEDED] tracking-tight flex items-center gap-2">
            <Layers size={22} className="text-[#3ECF8E]" />
            Fleet Management & Driver Verification
          </h2>
          <p className="text-xs text-[#8F8F8F] mt-0.5">
            SRS FR-01.2 Vehicle Registration, Roadworthiness Compliance, Capacity Tonnage & Driver Assignments
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-bold px-4 py-2 rounded-xl transition shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={15} /> Register New Heavy Truck
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#232323] border border-[#2E2E2E] space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#8F8F8F]">Total Active Fleet</span>
          <div className="text-2xl font-mono font-bold text-[#EDEDED]">{vehicles.length} Trucks</div>
          <span className="text-[10px] text-[#3ECF8E] font-mono">Corridor certified heavy haulers</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#232323] border border-[#2E2E2E] space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#8F8F8F]">Total Fleet Capacity</span>
          <div className="text-2xl font-mono font-bold text-[#EDEDED]">{totalCapacity.toFixed(1)} Tons</div>
          <span className="text-[10px] text-[#8F8F8F] font-mono">Payload capacity on principal corridor</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#232323] border border-[#2E2E2E] space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#8F8F8F]">Inspection Compliance</span>
          <div className="text-2xl font-mono font-bold text-emerald-400">
            {verifiedCount}/{vehicles.length} Verified
          </div>
          <span className="text-[10px] text-[#8F8F8F] font-mono">Federal Transport Authority certified</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#232323] border border-[#2E2E2E] space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#8F8F8F]">Assigned Drivers</span>
          <div className="text-2xl font-mono font-bold text-[#EDEDED]">{drivers.length} Drivers</div>
          <span className="text-[10px] text-[#3ECF8E] font-mono">Active on Djibouti-Modjo artery</span>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[#2E2E2E] flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase text-[#8F8F8F]">
            Registered Heavy Vehicle Inventory ({vehicles.length})
          </h3>
          <span className="text-[10px] font-mono text-[#3ECF8E]">
            DB Persisted • Drizzle Schema
          </span>
        </div>

        {vehicles.length === 0 ? (
          <div className="p-8 text-center text-[#8F8F8F]">
            <Truck size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs">No vehicles registered yet. Click &quot;Register New Heavy Truck&quot; above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#1C1C1C] border-b border-[#2E2E2E] text-[10px] text-[#8F8F8F] uppercase">
                <tr>
                  <th className="py-3 px-4">Vehicle Model / Fleet Asset</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Fuel Type</th>
                  <th className="py-3 px-4">Compliance Certificates</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E] text-[#EDEDED]">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-[#282828] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <Truck size={15} className="text-[#3ECF8E] shrink-0" />
                      <div>
                        <span>{v.vehicleType}</span>
                        {v.plateNumber && (
                          <span className="ml-2 text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold tracking-wider">
                            {v.plateNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#3ECF8E] font-bold">
                      {v.capacityTons} Metric Tons
                    </td>
                    <td className="py-3.5 px-4 text-[#8F8F8F]">
                      {v.fuelType || 'Diesel'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 text-[11px]">
                        {v.insuranceDocUrl && (
                          <a
                            href={v.insuranceDocUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#3ECF8E] hover:underline flex items-center gap-1"
                          >
                            <FileText size={12} /> Insurance
                          </a>
                        )}
                        {v.roadworthinessDocUrl && (
                          <a
                            href={v.roadworthinessDocUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#3ECF8E] hover:underline flex items-center gap-1"
                          >
                            <ShieldCheck size={12} /> Roadworthy
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {v.isVerified ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteTruck(v.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition"
                        title="Delete Vehicle"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Driver Roster Panel */}
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-2xl p-5 shadow-lg">
        <h3 className="text-xs font-mono font-bold uppercase text-[#8F8F8F] mb-3 flex items-center gap-2">
          <UserCheck size={15} className="text-[#3ECF8E]" />
          Corridor Driver Roster & Telematics Sync
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {drivers.map((d) => (
            <div
              key={d.id}
              className="p-3.5 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-[#EDEDED]">{d.fullName}</div>
                <div className="text-[11px] font-mono text-[#8F8F8F]">{d.phone || '+251 911 000 000'}</div>
                <div className="text-[10px] text-[#8F8F8F] truncate">{d.companyName || 'Independent Driver'}</div>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                ACTIVE
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          MODAL: REGISTER NEW TRUCK
          ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#232323] border border-[#2E2E2E] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#2E2E2E] flex items-center justify-between bg-[#1C1C1C]">
              <div>
                <h3 className="font-bold text-sm text-[#EDEDED] flex items-center gap-2">
                  <Truck size={16} className="text-[#3ECF8E]" />
                  SRS FR-01.2 Register Fleet Vehicle
                </h3>
                <p className="text-[10px] font-mono text-[#8F8F8F] mt-0.5">
                  Submit heavy asset details for corridor dispatch activation
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#8F8F8F] hover:text-[#EDEDED]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTruck} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                  Vehicle Make & Model / Configuration *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scania R500 Flatbed Trailer"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs text-[#EDEDED] focus:border-[#3ECF8E] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                  License Plate Number (የመኪና ታርጋ ቁጥር)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3-AA-98214 or 3-ET-74192"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#3ECF8E] uppercase focus:border-[#3ECF8E] outline-none placeholder:text-[#555]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                    Capacity (Tons) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    step="0.5"
                    value={capacityTons}
                    onChange={(e) => setCapacityTons(e.target.value)}
                    className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs text-[#EDEDED] font-mono focus:border-[#3ECF8E] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                    Fuel Type
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3 py-2.5 text-xs text-[#EDEDED] font-mono focus:border-[#3ECF8E] outline-none"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Heavy Fuel Oil">Heavy Fuel Oil</option>
                    <option value="Hybrid / Electric">Hybrid / Electric</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                  Insurance Policy Document URL
                </label>
                <input
                  type="text"
                  value={insuranceDocUrl}
                  onChange={(e) => setInsuranceDocUrl(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs text-[#EDEDED] font-mono focus:border-[#3ECF8E] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8F8F8F] mb-1.5">
                  Roadworthiness Certificate Document URL
                </label>
                <input
                  type="text"
                  value={roadworthinessDocUrl}
                  onChange={(e) => setRoadworthinessDocUrl(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs text-[#EDEDED] font-mono focus:border-[#3ECF8E] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#2E2E2E] text-xs font-semibold text-[#8F8F8F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTruck}
                  className="px-5 py-2 rounded-xl bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-bold transition flex items-center gap-2"
                >
                  {savingTruck ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Persisting Asset...
                    </>
                  ) : (
                    'Add Truck to Active Fleet'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
