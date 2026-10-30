import React from 'react';
import { useStore } from '../store/useStore';
import { formatDate, formatINR, maskInstrumentNo, daysToMaturity } from '../lib/dates';
import { StatusPill } from '../components/Badges';
import { Toast, useToast } from '../components/Toast';
import type { Instrument } from '../types';
import {
  Calendar,
  AlertCircle,
  Clock,
  Building2,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MaturityRadar() {
  const {
    instruments,
    institutions,
    currentDate,
    alerts,
    schedulerConfig,
    updateSchedulerConfig,
    linkRenewal,
  } = useStore();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const navigate = useNavigate();

  const [selectedInstId, setSelectedInstId] = React.useState<string>('all');
  const [renewalModalInst, setRenewalModalInst] = React.useState<Instrument | null>(null);
  const [renewalNewNo, setRenewalNewNo] = React.useState('');
  const [renewalAmount, setRenewalAmount] = React.useState(35);
  const [renewalMaturity, setRenewalMaturity] = React.useState('2029-10-30');
  const [configOpen, setConfigOpen] = React.useState(false);

  // Filter instruments
  const filteredInstruments = instruments.filter(
    i => selectedInstId === 'all' || i.institutionId === selectedInstId
  );

  // Active / unreleased instruments sorted by maturity
  const pendingInstruments = filteredInstruments
    .filter(i => i.status !== 'Released' && i.status !== 'Renewed')
    .map(i => ({
      ...i,
      daysLeft: daysToMaturity(i.maturityDate, currentDate),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Group by maturity month for timeline
  const groupedByMonth: Record<string, typeof pendingInstruments> = {};
  pendingInstruments.forEach(inst => {
    const d = new Date(inst.maturityDate);
    const key = `${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}`;
    if (!groupedByMonth[key]) groupedByMonth[key] = [];
    groupedByMonth[key].push(inst);
  });

  // Calculate reminder stage
  const getStageBadge = (days: number) => {
    if (days < -7) return { label: 'Overdue+7', color: 'bg-red-800 text-white' };
    if (days <= 0) return { label: 'T-0 Matured', color: 'bg-red-600 text-white' };
    if (days <= 7) return { label: 'T-7 Section Head', color: 'bg-red-500 text-white' };
    if (days <= 15) return { label: 'T-15 Head Esc.', color: 'bg-orange-600 text-white' };
    if (days <= 30) return { label: 'T-30 Bureau Notice', color: 'bg-amber-500 text-white' };
    if (days <= 60) return { label: 'T-60 Reminder', color: 'bg-yellow-500 text-gray-900' };
    if (days <= 90) return { label: 'T-90 Initial', color: 'bg-blue-100 text-blue-800' };
    return { label: '>90d OK', color: 'bg-green-100 text-green-800' };
  };

  // Coverage Gap calculations per institution
  const institutionGaps = institutions
    .map(inst => {
      const instInstruments = instruments.filter(
        i => i.institutionId === inst.id && i.status !== 'Released'
      );
      // Valid at currentDate
      const validInstruments = instInstruments.filter(i => {
        const d = daysToMaturity(i.maturityDate, currentDate);
        return d >= 0 && i.status !== 'Matured';
      });
      const totalCovered = validInstruments.reduce((sum, i) => sum + i.amount, 0);
      const req = schedulerConfig.defaultCoverageRequired;
      const isGap = totalCovered < req;
      return {
        institution: inst,
        totalCovered,
        required: req,
        gapAmount: Math.max(0, req - totalCovered),
        isGap,
        validCount: validInstruments.length,
      };
    })
    .filter(g => selectedInstId === 'all' || g.institution.id === selectedInstId);

  const handleLinkRenewalSubmit = async () => {
    if (!renewalModalInst) return;
    if (!renewalNewNo.trim()) {
      showToast('Please enter the replacement FDR number', 'error');
      return;
    }

    const newInst: Instrument = {
      id: `fdr-ren-${Date.now().toString().slice(-4)}`,
      institutionId: renewalModalInst.institutionId,
      bankName: renewalModalInst.bankName,
      ifsc: renewalModalInst.ifsc,
      instrumentNo: renewalNewNo,
      amount: renewalAmount,
      issueDate: currentDate,
      maturityDate: renewalMaturity,
      lienInFavourAicte: true,
      status: 'Active',
      riskScore: 5,
      riskSignals: [],
      fieldTrust: {
        bank: 'L2',
        instrumentNo: 'L1',
        amount: 'L2',
        issueDate: 'L1',
        maturityDate: 'L1',
        lien: 'L2',
      },
      hasAicteWording: true,
      coverageRequired: schedulerConfig.defaultCoverageRequired,
    };

    await linkRenewal(renewalModalInst.id, newInst, 'Officer-Renewal-Desk');
    setRenewalModalInst(null);
    showToast(`Renewal linked! Old FDR #${renewalModalInst.instrumentNo.slice(-6)} renewed. Gap closed.`, 'success');
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Maturity Radar</h1>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-bold">
              Clock: {currentDate}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Automated calendar timeline, T-90 to Overdue+7 reminder escalation, and coverage gap detection.
          </p>
        </div>

        {/* Filter & Config controls */}
        <div className="flex items-center gap-2">
          <select
            value={selectedInstId}
            onChange={e => setSelectedInstId(e.target.value)}
            className="text-xs bg-white border border-gray-300 rounded-lg px-3 py-1.5 font-medium text-gray-700 shadow-sm"
          >
            <option value="all">All Institutions ({institutions.length})</option>
            {institutions.map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setConfigOpen(o => !o)}
            className="text-xs flex items-center gap-1 bg-white border border-gray-300 px-3 py-1.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <Sliders size={13} /> Schedule Config
          </button>
        </div>
      </div>

      {/* Config Drawer / Modal */}
      {configOpen && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              AICTE Statutory Reminder Schedule Rules (Store Configuration)
            </h3>
            <button onClick={() => setConfigOpen(false)} className="text-gray-400 hover:text-gray-700 text-sm">
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Default Statutory Deposit Requirement per Institution:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={schedulerConfig.defaultCoverageRequired}
                  onChange={e =>
                    updateSchedulerConfig({ defaultCoverageRequired: Number(e.target.value) })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-1.5 w-32 font-bold text-gray-800"
                />
                <span className="text-gray-500 font-semibold">₹ Lakhs</span>
              </div>
            </div>
            <div className="text-gray-500 text-[11px] leading-relaxed">
              When clock advances via Time Machine, reminders fire automatically based on remaining maturity days.
            </div>
          </div>

          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden text-xs">
            {schedulerConfig.stages.map(stg => (
              <div key={stg.stage} className="p-2.5 flex items-center justify-between bg-gray-50/50">
                <span className="font-bold font-mono text-gray-900 w-24">{stg.stage}</span>
                <span className="text-gray-600 flex-1">{stg.description}</span>
                <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                  {stg.recipientRole}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coverage Gap Alerts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingDown size={14} className="text-red-500" />
            Institution Security Deposit Coverage Gaps
          </h2>
          <span className="text-[11px] text-gray-500 font-medium">
            Required: ₹{schedulerConfig.defaultCoverageRequired} Lakhs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {institutionGaps.map(g => (
            <div
              key={g.institution.id}
              className={`p-4 rounded-xl border transition-all ${
                g.isGap ? 'bg-red-50/60 border-red-200' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <div className="font-bold text-xs text-gray-900 leading-snug">{g.institution.name}</div>
                  <div className="text-[10px] text-gray-500 font-mono">{g.institution.state}</div>
                </div>
                {g.isGap ? (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    GAP: ₹{g.gapAmount}L
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Adequate
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold text-gray-600">
                  <span>Covered: ₹{g.totalCovered}L</span>
                  <span>Target: ₹{g.required}L</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${g.isGap ? 'bg-red-500' : 'bg-green-600'}`}
                    style={{ width: `${Math.min(100, (g.totalCovered / g.required) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grouped Month Timeline */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar size={14} className="text-[#0072c6]" />
          Maturity Timeline by Month
        </h2>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {Object.entries(groupedByMonth).map(([month, list]) => (
            <div
              key={month}
              className="min-w-64 bg-white rounded-xl border border-gray-200 p-3 shadow-sm flex-shrink-0 space-y-2"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-bold text-xs text-gray-900">{month}</span>
                <span className="bg-blue-50 text-[#0072c6] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {list.length} FDRs (₹{list.reduce((s, i) => s + i.amount, 0)}L)
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {list.map(i => {
                  const stage = getStageBadge(i.daysLeft);
                  return (
                    <div
                      key={i.id}
                      onClick={() => navigate(`/instruments/${i.id}`)}
                      className="p-2 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors cursor-pointer text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono font-bold text-gray-800">{maskInstrumentNo(i.instrumentNo)}</div>
                        <div className="text-[10px] text-gray-500">{formatINR(i.amount)}</div>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${stage.color}`}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Master Radar Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            All Pending Instruments & Reminder Escalations ({pendingInstruments.length})
          </h2>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Instrument</th>
                <th className="px-4 py-3">Institution</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Maturity Date</th>
                <th className="px-4 py-3">Days Left</th>
                <th className="px-4 py-3">Reminder Stage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingInstruments.map(inst => {
                const institution = institutions.find(i => i.id === inst.institutionId);
                const stage = getStageBadge(inst.daysLeft);
                const isDueSoon = inst.daysLeft <= 30 && inst.daysLeft >= 0;

                return (
                  <tr
                    key={inst.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      inst.daysLeft < 0 ? 'bg-red-50/30' : isDueSoon ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-gray-900">{maskInstrumentNo(inst.instrumentNo)}</div>
                      <div className="text-[10px] text-gray-400">{inst.bankName}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium">
                      {institution?.name}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatINR(inst.amount)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(inst.maturityDate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${
                          inst.daysLeft < 0
                            ? 'text-red-700'
                            : inst.daysLeft <= 15
                            ? 'text-red-600'
                            : inst.daysLeft <= 30
                            ? 'text-amber-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {inst.daysLeft < 0 ? `${Math.abs(inst.daysLeft)}d overdue` : `${inst.daysLeft}d left`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${stage.color}`}>
                        {stage.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={inst.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setRenewalModalInst(inst)}
                          className="bg-blue-50 hover:bg-blue-100 text-[#0072c6] font-bold px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1"
                        >
                          <RefreshCw size={11} /> Link Renewal
                        </button>
                        <button
                          onClick={() => navigate(`/instruments/${inst.id}`)}
                          className="text-gray-400 hover:text-gray-700 font-semibold"
                        >
                          Review →
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal Linking Modal */}
      {renewalModalInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Link Replacement Renewal FDR</h3>
                <p className="text-xs text-gray-500">
                  Renewing expiring instrument #{renewalModalInst.instrumentNo.slice(-6)}
                </p>
              </div>
              <button
                onClick={() => setRenewalModalInst(null)}
                className="text-gray-400 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700">New FDR Instrument Number:</label>
                <input
                  type="text"
                  placeholder="e.g. SBI20269941"
                  value={renewalNewNo}
                  onChange={e => setRenewalNewNo(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700">Renewal Amount (₹ Lakhs):</label>
                <input
                  type="number"
                  value={renewalAmount}
                  onChange={e => setRenewalAmount(Number(e.target.value))}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700">New Maturity Date:</label>
                <input
                  type="date"
                  value={renewalMaturity}
                  onChange={e => setRenewalMaturity(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setRenewalModalInst(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkRenewalSubmit}
                className="px-4 py-2 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} /> Link Renewal & Close Gap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
