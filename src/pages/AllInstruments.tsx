import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { daysToMaturity, formatINR, maskInstrumentNo, formatDate } from '../lib/dates';
import { getRiskBand } from '../lib/fraud';
import { StatusPill, RiskBadge } from '../components/Badges';
import type { InstrumentStatus } from '../types';
import { Search, Filter } from 'lucide-react';

type RiskFilter = 'all' | 'low' | 'medium' | 'high';

export default function AllInstruments() {
  const { instruments, institutions, currentDate } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<InstrumentStatus | 'all'>('all');
  const [riskFilter, setRiskFilter] = React.useState<RiskFilter>('all');
  const [instFilter, setInstFilter] = React.useState<string>('all');
  const [stateFilter, setStateFilter] = React.useState<string>('all');

  const statuses: InstrumentStatus[] = [
    'Draft', 'Submitted', 'Auto-checked', 'Under verification', 'Flagged', 'Active',
    'Expiring', 'Matured', 'Renewal pending', 'Renewed', 'Release requested', 'Under review', 'Released',
  ];

  const states = [...new Set(institutions.map(i => i.state))].sort();

  const getInstitution = (id: string) => institutions.find(i => i.id === id);

  const filtered = instruments.filter(inst => {
    const institution = getInstitution(inst.institutionId);
    const band = getRiskBand(inst.riskScore);
    const searchLower = search.toLowerCase();

    if (search && !inst.instrumentNo.toLowerCase().includes(searchLower) &&
      !institution?.name.toLowerCase().includes(searchLower) &&
      !inst.bankName.toLowerCase().includes(searchLower)) return false;
    if (statusFilter !== 'all' && inst.status !== statusFilter) return false;
    if (riskFilter !== 'all' && band !== riskFilter) return false;
    if (instFilter !== 'all' && inst.institutionId !== instFilter) return false;
    if (stateFilter !== 'all' && institution?.state !== stateFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Instruments</h1>
          <p className="text-sm text-gray-500">{filtered.length} of {instruments.length} FDRs</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 flex-1 min-w-48">
            <Search size={14} className="text-gray-400" />
            <input
              className="bg-transparent text-sm outline-none flex-1 text-gray-700 placeholder-gray-400"
              placeholder="Search instrument no, institution, bank…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 outline-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as InstrumentStatus | 'all')}
          >
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 outline-none"
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value as RiskFilter)}
          >
            <option value="all">All Risk Bands</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 outline-none"
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
          >
            <option value="all">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 outline-none max-w-48"
            value={instFilter}
            onChange={e => setInstFilter(e.target.value)}
          >
            <option value="all">All Institutions</option>
            {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">Instrument No.</th>
                <th className="text-left px-4 py-3 font-semibold">Institution</th>
                <th className="text-left px-4 py-3 font-semibold">Bank</th>
                <th className="text-left px-4 py-3 font-semibold">Amount</th>
                <th className="text-left px-4 py-3 font-semibold">Maturity</th>
                <th className="text-left px-4 py-3 font-semibold">Days Left</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Risk</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((inst, idx) => {
                const institution = getInstitution(inst.institutionId);
                const band = getRiskBand(inst.riskScore);
                const days = daysToMaturity(inst.maturityDate, currentDate);
                return (
                  <tr
                    key={inst.id}
                    className={`border-b border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                    onClick={() => navigate(`/instruments/${inst.id}`)}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-gray-800 text-xs">{maskInstrumentNo(inst.instrumentNo)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 text-xs max-w-40 truncate">{institution?.name}</div>
                      <div className="text-gray-400 text-xs">{institution?.state}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{inst.bankName}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatINR(inst.amount)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(inst.maturityDate)}</td>
                    <td className="px-4 py-3">
                      {days < 0 ? (
                        <span className="text-gray-400 text-xs">Matured</span>
                      ) : (
                        <span className={`font-semibold text-xs ${days <= 7 ? 'text-red-600' : days <= 30 ? 'text-amber-600' : 'text-gray-600'}`}>
                          {days}d
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusPill status={inst.status} /></td>
                    <td className="px-4 py-3"><RiskBadge score={inst.riskScore} band={band} /></td>
                    <td className="px-4 py-3">
                      <button
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold whitespace-nowrap"
                        onClick={e => { e.stopPropagation(); navigate(`/instruments/${inst.id}`); }}
                      >
                        Review →
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400 text-sm">No instruments match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
