import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, ShieldAlert, CheckCircle2, Clock, 
  Search, Filter, MoreVertical, Eye, ArrowUpRight, 
  Building2, Truck, Briefcase, RefreshCw, AlertTriangle, 
  X, Check, Lock, Shield, UserCheck, UserX, Copy, FileText
} from 'lucide-react';
import { getAllCorridorUsers, updateUserStatus, updateUserRole, getUserDossier } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export default function ActorManagement() {
  const [actors, setActors] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Selected actor for dossier inspection or actions
  const [inspectActor, setInspectActor] = useState<any | null>(null);
  const [detailedDossier, setDetailedDossier] = useState<any | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  
  // Promotion modal
  const [promoteConfirmActor, setPromoteConfirmActor] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchActors = async () => {
    try {
      setLoading(true);
      const res = await getAllCorridorUsers({
        role: selectedRole !== 'ALL' ? selectedRole : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        search: search.trim() || undefined,
      });
      setActors(res.data || []);
      if (res.metrics) setMetrics(res.metrics);
    } catch (err: any) {
      toast.error('Failed to load corridor actors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActors();
  }, [selectedRole, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchActors();
  };

  const handleStatusChange = async (userId: string, newStatus: string, reason?: string) => {
    try {
      setActionLoading(true);
      await updateUserStatus(userId, newStatus, reason);
      toast.success(`Actor status updated to ${newStatus}`);
      if (inspectActor?.id === userId) {
        setInspectActor((prev: any) => ({ ...prev, verificationStatus: newStatus, isVerified: newStatus === 'VERIFIED' }));
      }
      fetchActors();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update actor status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setActionLoading(true);
      await updateUserRole(userId, newRole);
      toast.success(`Actor role updated to ${newRole}`);
      setPromoteConfirmActor(null);
      if (inspectActor?.id === userId) {
        setInspectActor((prev: any) => ({ ...prev, role: newRole }));
      }
      fetchActors();
    } catch (err: any) {
      toast.error(err.message || 'Failed to change role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDossier = async (actor: any) => {
    setInspectActor(actor);
    setLoadingDossier(true);
    try {
      const res = await getUserDossier(actor.id);
      setDetailedDossier(res.data);
    } catch (err) {
      setDetailedDossier(actor);
    } finally {
      setLoadingDossier(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono">ADMIN</span>;
      case 'SHIPPER':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono">SHIPPER</span>;
      case 'TRANSPORTER':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono">TRANSPORTER</span>;
      case 'FORWARDER':
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono">FORWARDER</span>;
      case 'CUSTOMS_OFFICER':
        return <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono">ECC CUSTOMS</span>;
      default:
        return <span className="bg-[#2E2E2E] text-[#8F8F8F] px-2 py-0.5 rounded-full text-[10px] font-mono">{role}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <CheckCircle2 size={12} className="text-emerald-400" /> Verified
          </span>
        );
      case 'PENDING':
        return (
          <span className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full animate-pulse">
            <Clock size={12} className="text-amber-400" /> Pending Review
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-full">
            <ShieldAlert size={12} className="text-rose-400" /> Suspended
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-slate-400 text-xs font-medium bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
            Unverified
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#232323] p-6 rounded-2xl border border-[#2E2E2E] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-[#3ECF8E]/10 text-[#3ECF8E]">
              <Users size={16} />
            </span>
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#3ECF8E] font-bold">
              SRS Section 2.3 & FR-01.4 Governance
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight">
            Corridor Actor Directory & Access Governance
          </h1>
          <p className="text-xs text-[#8F8F8F] mt-1 max-w-2xl">
            Monitor, inspect dossiers, verify credentials, suspend violations, and administer platform roles for all freight operators along the Djibouti–Modjo corridor.
          </p>
        </div>

        <button
          onClick={fetchActors}
          className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-[#282828] text-[#EDEDED] border border-[#2E2E2E] px-3.5 py-2 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[#3ECF8E]" : "text-[#8F8F8F]"} />
          Sync Directory
        </button>
      </div>

      {/* Corridor Summary Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-[#232323] border border-[#2E2E2E] p-4 rounded-xl">
            <div className="text-[11px] font-mono uppercase text-[#8F8F8F]">Total Actors</div>
            <div className="text-2xl font-bold text-[#EDEDED] mt-1">{metrics.total}</div>
            <div className="text-[10px] text-[#8F8F8F] mt-1">Registered corridor users</div>
          </div>
          <div className="bg-[#232323] border border-[#2E2E2E] p-4 rounded-xl">
            <div className="text-[11px] font-mono uppercase text-emerald-400">Verified Operators</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{metrics.verified}</div>
            <div className="text-[10px] text-[#8F8F8F] mt-1">Full marketplace rights</div>
          </div>
          <div className="bg-[#232323] border border-[#2E2E2E] p-4 rounded-xl">
            <div className="text-[11px] font-mono uppercase text-amber-400">Pending Review</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{metrics.pending}</div>
            <div className="text-[10px] text-[#8F8F8F] mt-1">Dossiers awaiting audit</div>
          </div>
          <div className="bg-[#232323] border border-[#2E2E2E] p-4 rounded-xl">
            <div className="text-[11px] font-mono uppercase text-rose-400">Suspended</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">{metrics.suspended}</div>
            <div className="text-[10px] text-[#8F8F8F] mt-1">Corridor lock active</div>
          </div>
          <div className="bg-[#232323] border border-[#2E2E2E] p-4 rounded-xl">
            <div className="text-[11px] font-mono uppercase text-[#3ECF8E]">Admins</div>
            <div className="text-2xl font-bold text-[#3ECF8E] mt-1">{metrics.roles.admins}</div>
            <div className="text-[10px] text-[#8F8F8F] mt-1">Platform Control Tower</div>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-[#232323] border border-[#2E2E2E] p-4 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'All Roles' },
              { id: 'SHIPPER', label: 'Shippers' },
              { id: 'TRANSPORTER', label: 'Transporters' },
              { id: 'FORWARDER', label: 'Forwarders' },
              { id: 'CUSTOMS_OFFICER', label: 'Customs' },
              { id: 'ADMIN', label: 'Admins' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedRole(tab.id)}
                className={`px-3 py-1.5 text-xs rounded-xl transition font-medium whitespace-nowrap ${
                  selectedRole === tab.id
                    ? 'bg-[#3ECF8E] text-black font-bold shadow-sm'
                    : 'text-[#8F8F8F] hover:text-[#EDEDED] hover:bg-[#1C1C1C]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input & Status Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#3ECF8E]"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="UNVERIFIED">Unverified</option>
            </select>

            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8F8F]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, TIN..."
                className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-[#3ECF8E]"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Actors Table */}
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1C1C1C] text-[#8F8F8F] uppercase font-mono tracking-wider text-[10px] border-b border-[#2E2E2E]">
              <tr>
                <th className="py-3 px-4">Actor / Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Entity & Contact</th>
                <th className="py-3 px-4">TIN & Trade License</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E] text-[#EDEDED]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#8F8F8F]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-[#3ECF8E]" />
                      <span>Loading corridor actors...</span>
                    </div>
                  </td>
                </tr>
              ) : actors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#8F8F8F]">
                    No corridor actors match the selected criteria.
                  </td>
                </tr>
              ) : (
                actors.map((actor) => (
                  <tr key={actor.id} className="hover:bg-[#282828] transition-colors">
                    {/* Name & Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1C1C1C] border border-[#2E2E2E] flex items-center justify-center font-bold text-xs text-[#3ECF8E]">
                          {actor.fullName ? actor.fullName[0].toUpperCase() : actor.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#EDEDED]">{actor.fullName || 'Corridor User'}</div>
                          <div className="text-[11px] text-[#8F8F8F] font-mono flex items-center gap-1.5">
                            {actor.email}
                            {actor.metadata?.authProvider === 'google' && (
                              <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1 py-0.2 rounded font-sans">Google</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {getRoleBadge(actor.role)}
                    </td>

                    {/* Organization & Phone */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#EDEDED]">{actor.companyName || 'Individual Entity'}</div>
                      <div className="text-[11px] text-[#8F8F8F] font-mono">{actor.phone || 'N/A'}</div>
                    </td>

                    {/* TIN & Trade License */}
                    <td className="py-3.5 px-4">
                      {actor.tinNumber ? (
                        <div className="font-mono text-[11px]">
                          <div className="text-white flex items-center gap-1">
                            <span className="text-[#8F8F8F]">TIN:</span> {actor.tinNumber}
                          </div>
                          <div className="text-[#8F8F8F] text-[10px]">
                            <span>LIC:</span> {actor.tradeLicense || 'Pending Doc'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#8F8F8F] italic text-[11px]">No TIN on file</span>
                      )}
                    </td>

                    {/* Compliance Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(actor.verificationStatus)}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDossier(actor)}
                          title="View Full Dossier"
                          className="p-1.5 rounded-lg bg-[#1C1C1C] hover:bg-[#333333] text-[#EDEDED] border border-[#2E2E2E] transition"
                        >
                          <Eye size={14} />
                        </button>

                        {actor.verificationStatus !== 'VERIFIED' && (
                          <button
                            onClick={() => handleStatusChange(actor.id, 'VERIFIED')}
                            title="Verify Actor"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                          >
                            <UserCheck size={14} />
                          </button>
                        )}

                        {actor.verificationStatus === 'VERIFIED' && (
                          <button
                            onClick={() => handleStatusChange(actor.id, 'SUSPENDED', 'Administrative compliance lock')}
                            title="Suspend Corridor Access"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                          >
                            <UserX size={14} />
                          </button>
                        )}

                        {actor.role !== 'ADMIN' && (
                          <button
                            onClick={() => setPromoteConfirmActor(actor)}
                            title="Promote to Platform Administrator"
                            className="px-2 py-1 rounded-lg bg-[#3ECF8E]/10 hover:bg-[#3ECF8E]/20 text-[#3ECF8E] border border-[#3ECF8E]/30 font-mono text-[10px] font-bold transition"
                          >
                            + Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOSSIER SLIDE-OVER DRAWER */}
      {inspectActor && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="bg-[#1C1C1C] w-full max-w-lg h-full border-l border-[#2E2E2E] p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#2E2E2E]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getRoleBadge(inspectActor.role)}
                    {getStatusBadge(inspectActor.verificationStatus)}
                  </div>
                  <h3 className="text-lg font-bold text-[#EDEDED]">{inspectActor.fullName || inspectActor.email}</h3>
                  <p className="text-xs text-[#8F8F8F] font-mono">{inspectActor.id}</p>
                </div>
                <button
                  onClick={() => setInspectActor(null)}
                  className="p-1 text-[#8F8F8F] hover:text-[#EDEDED] rounded-lg hover:bg-[#2E2E2E]"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Dossier Content */}
              <div className="space-y-5 pt-4">
                {/* Identity Card */}
                <div className="bg-[#232323] p-4 rounded-xl border border-[#2E2E2E] space-y-2.5">
                  <div className="text-[10px] font-mono uppercase text-[#3ECF8E] tracking-wider font-bold">
                    Profile & Contact
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#8F8F8F] block text-[10px]">Email:</span>
                      <span className="font-mono text-white break-all">{inspectActor.email}</span>
                    </div>
                    <div>
                      <span className="text-[#8F8F8F] block text-[10px]">Phone:</span>
                      <span className="font-mono text-white">{inspectActor.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[#8F8F8F] block text-[10px]">Company / Organization:</span>
                      <span className="font-medium text-white">{inspectActor.companyName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[#8F8F8F] block text-[10px]">Registered On:</span>
                      <span className="font-mono text-white">
                        {new Date(inspectActor.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Regulatory License Card */}
                <div className="bg-[#232323] p-4 rounded-xl border border-[#2E2E2E] space-y-2.5">
                  <div className="text-[10px] font-mono uppercase text-[#3ECF8E] tracking-wider font-bold flex items-center justify-between">
                    <span>SRS FR-01 Regulatory Dossier</span>
                    <ShieldCheck size={14} className="text-[#3ECF8E]" />
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-[#1C1C1C] rounded-lg border border-[#2E2E2E] flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-[#8F8F8F] block">TIN (Tax Identification Number)</span>
                        <span className="font-mono font-bold text-white text-sm">
                          {inspectActor.tinNumber || 'None Provided'}
                        </span>
                      </div>
                      {inspectActor.tinNumber && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(inspectActor.tinNumber);
                            toast.success('TIN copied to clipboard');
                          }}
                          className="p-1 text-[#8F8F8F] hover:text-[#EDEDED]"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>

                    <div className="p-2.5 bg-[#1C1C1C] rounded-lg border border-[#2E2E2E] flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-[#8F8F8F] block">Trade License (MOTRI)</span>
                        <span className="font-mono font-bold text-white text-sm">
                          {inspectActor.tradeLicense || 'None Provided'}
                        </span>
                      </div>
                      {inspectActor.tradeLicense && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(inspectActor.tradeLicense);
                            toast.success('Trade License copied');
                          }}
                          className="p-1 text-[#8F8F8F] hover:text-[#EDEDED]"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Transporter Fleet or Customs Station (if applicable) */}
                {inspectActor.role === 'TRANSPORTER' && (
                  <div className="bg-[#232323] p-4 rounded-xl border border-[#2E2E2E] space-y-2">
                    <div className="text-[10px] font-mono uppercase text-amber-400 tracking-wider font-bold">
                      Fleet Haulage Profile
                    </div>
                    <div className="text-xs space-y-1 text-[#8F8F8F]">
                      <div>Capacity: <strong className="text-white">{inspectActor.vehicleCapacity || '40 Metric Tons'}</strong></div>
                      <div>Fleet Identifier: <strong className="text-white">{inspectActor.fleetName || 'Active Fleet'}</strong></div>
                    </div>
                  </div>
                )}

                {inspectActor.badgeId && (
                  <div className="bg-[#232323] p-4 rounded-xl border border-[#2E2E2E] space-y-2">
                    <div className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider font-bold">
                      Customs Accreditation
                    </div>
                    <div className="text-xs text-[#8F8F8F]">
                      Official Badge ID: <strong className="text-white font-mono">{inspectActor.badgeId}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="pt-4 border-t border-[#2E2E2E] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {inspectActor.verificationStatus !== 'VERIFIED' ? (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusChange(inspectActor.id, 'VERIFIED')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <UserCheck size={14} /> Approve & Verify
                  </button>
                ) : (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusChange(inspectActor.id, 'SUSPENDED', 'Administrative lock')}
                    className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <UserX size={14} /> Suspend Operator
                  </button>
                )}

                {inspectActor.role !== 'ADMIN' ? (
                  <button
                    onClick={() => setPromoteConfirmActor(inspectActor)}
                    className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Shield size={14} /> Promote To Admin
                  </button>
                ) : (
                  <button
                    onClick={() => handleRoleChange(inspectActor.id, 'SHIPPER')}
                    className="bg-[#2E2E2E] hover:bg-[#3A3A3A] text-[#EDEDED] font-bold text-xs py-2.5 rounded-xl transition"
                  >
                    Demote to Shipper
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROMOTION CONFIRMATION MODAL */}
      {promoteConfirmActor && (
        <div className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1C1C1C] rounded-2xl w-full max-w-md border border-[#2E2E2E] p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 flex items-center justify-center text-[#3ECF8E]">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#EDEDED]">Grant Administrator Privilege</h3>
                <p className="text-xs text-[#8F8F8F]">Platform Control Tower Governance</p>
              </div>
            </div>

            <p className="text-xs text-[#EDEDED] leading-relaxed bg-[#232323] p-3.5 rounded-xl border border-[#2E2E2E]">
              Are you sure you want to promote <strong className="text-[#3ECF8E]">{promoteConfirmActor.fullName || promoteConfirmActor.email}</strong> to a <strong className="text-white">Platform Administrator</strong>? They will gain full authority over the Operations Control Tower, verification queues, pricing bounds, and corridor actor governance.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPromoteConfirmActor(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8F8F8F] hover:text-white hover:bg-[#232323] transition"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleRoleChange(promoteConfirmActor.id, 'ADMIN')}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#3ECF8E] hover:bg-[#34b27b] text-black transition shadow-md disabled:opacity-50"
              >
                Confirm Admin Promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
