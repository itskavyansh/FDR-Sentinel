import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useStore } from '../store/useStore';
import { daysToMaturity, formatINR, maskInstrumentNo, formatDate } from '../lib/dates';
import { getRiskBand } from '../lib/fraud';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  Archive,
  Unlock,
  Search,
  Sparkles,
  X,
  Code2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { parseQueryToFilter, buildChips, applyAskFilter, type AskFilter } from '../lib/ask';
import { StatusPill, RiskBadge } from '../components/Badges';

function KpiCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function buildMaturityPipeline(instruments: import('../types').Instrument[], currentDate: string) {
  const months: string[] = [];
  const base = new Date(currentDate);
  for (let i = 0; i < 6; i++) {
    const m = new Date(base.getFullYear(), base.getMonth() + i, 1);
    months.push(`${m.toLocaleString('en-IN', { month: 'short' })} '${m.getFullYear().toString().slice(2)}`);
  }
  return months.map((month, i) => {
    const start = new Date(base.getFullYear(), base.getMonth() + i, 1);
    const end = new Date(base.getFullYear(), base.getMonth() + i + 1, 0);
    const count = instruments.filter(inst => {
      const md = new Date(inst.maturityDate);
      return md >= start && md <= end && inst.status !== 'Released';
    }).length;
    const amount = instruments
      .filter(inst => {
        const md = new Date(inst.maturityDate);
        return md >= start && md <= end && inst.status !== 'Released';
      })
      .reduce((s, inst) => s + inst.amount, 0);
    return { month, count, amount };
  });
}

export default function Dashboard() {
  const { instruments, institutions, auditEvents, currentDate, role, selectedInstitutionId } = useStore();
  const navigate = useNavigate();

  // Ask Sentinel state
  const [askQuery, setAskQuery] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<AskFilter | null>(null);
  const [showJson, setShowJson] = React.useState(false);
  const [parseError, setParseError] = React.useState(false);

  const isInstRole = role === 'Institution';
  const roleInstScope = isInstRole ? selectedInstitutionId : undefined;

  const handleAskSubmit = (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const q = customQ !== undefined ? customQ : askQuery;
    if (!q.trim()) {
      setActiveFilter(null);
      setParseError(false);
      return;
    }
    const parsed = parseQueryToFilter(q);
    if (parsed) {
      setActiveFilter(parsed);
      setParseError(false);
    } else {
      setActiveFilter(null);
      setParseError(true);
    }
  };

  const removeChip = (key: keyof AskFilter) => {
    if (!activeFilter) return;
    const copy = { ...activeFilter };
    delete copy[key];
    if (Object.keys(copy).filter(k => k !== 'querySummary').length === 0) {
      setActiveFilter(null);
    } else {
      setActiveFilter(copy);
    }
  };

  const askResults = activeFilter
    ? applyAskFilter(instruments, institutions, activeFilter, currentDate, roleInstScope)
    : [];

  const active = instruments.filter(i => i.status === 'Active').length;
  const expiring30 = instruments.filter(
    i => daysToMaturity(i.maturityDate, currentDate) <= 30 && daysToMaturity(i.maturityDate, currentDate) >= 0 && i.status !== 'Released'
  ).length;
  const matured = instruments.filter(i => i.status === 'Matured').length;
  const toVerify = instruments.filter(i => i.status === 'Flagged' || i.status === 'Under verification').length;
  const gapRisk = instruments.filter(i => i.coverageRequired && i.amount < i.coverageRequired && i.status !== 'Released').length;
  const released = instruments.filter(i => i.status === 'Released').length;

  const pipeline = buildMaturityPipeline(instruments, currentDate);

  // Needs action today queue
  const needsAction: Array<{ id: string; label: string; sub: string; route: string; urgency: 'red' | 'amber' }> = [];

  // Flagged instruments
  instruments.filter(i => i.status === 'Flagged').forEach(i => {
    needsAction.push({
      id: i.id,
      label: `Flagged: ${i.instrumentNo.slice(-4)}`,
      sub: `Risk score ${i.riskScore} — Anomaly detected`,
      route: `/instruments/${i.id}`,
      urgency: 'red',
    });
  });

  // Matures in 7 days
  instruments
    .filter(i => {
      const d = daysToMaturity(i.maturityDate, currentDate);
      return d >= 0 && d <= 7 && i.status !== 'Released' && i.status !== 'Matured';
    })
    .forEach(i => {
      needsAction.push({
        id: i.id + '-7d',
        label: `Matures in ${daysToMaturity(i.maturityDate, currentDate)}d: ••••${i.instrumentNo.slice(-4)}`,
        sub: `${i.bankName} · ${formatINR(i.amount)}`,
        route: `/instruments/${i.id}`,
        urgency: 'amber',
      });
    });

  // Coverage gap
  instruments
    .filter(i => i.coverageRequired && i.amount < i.coverageRequired && i.status !== 'Released')
    .forEach(i => {
      needsAction.push({
        id: i.id + '-gap',
        label: `Coverage gap: ••••${i.instrumentNo.slice(-4)}`,
        sub: `Has ${formatINR(i.amount)}, needs ${formatINR(i.coverageRequired!)}`,
        route: `/instruments/${i.id}`,
        urgency: 'amber',
      });
    });

  // Release requested
  instruments.filter(i => i.status === 'Release requested').forEach(i => {
    needsAction.push({
      id: i.id + '-rel',
      label: `Release pending: ••••${i.instrumentNo.slice(-4)}`,
      sub: `Awaiting 3-tier officer approval`,
      route: '/releases',
      urgency: 'amber',
    });
  });

  const recentAudit = [...auditEvents].reverse().slice(0, 5);
  const chips = activeFilter ? buildChips(activeFilter) : [];

  const exampleQueries = [
    'FDRs maturing in the next 30 days above 10 lakh in Delhi',
    'High risk flagged instruments',
    'State Bank of India FDRs above 25 lakhs',
    'Coverage gap instruments below 20 lakh',
  ];

  return (
    <div className="space-y-6">
      {/* Ask Sentinel Search Section */}
      <div className="bg-gradient-to-r from-[#0b2e4f] to-[#0072c6] rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} className="text-amber-300" />
          <h2 className="text-base font-bold tracking-wide">Ask Sentinel Intelligence Search</h2>
          <span className="bg-white/20 text-blue-100 text-[10px] px-2 py-0.5 rounded-full font-mono">
            Zero-Leak Local Rule Parser
          </span>
        </div>
        <p className="text-xs text-blue-100 mb-4">
          Query FDR portfolio using natural language. Questions are strictly parsed into client-side filters;{' '}
          <strong className="text-white">records are never sent to a language model.</strong>
        </p>

        <form onSubmit={handleAskSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={askQuery}
              onChange={e => setAskQuery(e.target.value)}
              placeholder="e.g. 'FDRs maturing in the next 30 days above 10 lakh in Delhi' or 'High risk flagged'..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-gray-900 text-xs font-medium placeholder-gray-400 outline-none shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold rounded-xl text-xs transition-colors shadow flex items-center gap-1.5"
          >
            Ask Sentinel
          </button>
          {activeFilter && (
            <button
              type="button"
              onClick={() => {
                setActiveFilter(null);
                setAskQuery('');
              }}
              className="px-3 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold"
            >
              Clear
            </button>
          )}
        </form>

        {/* Clickable Example Queries */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-blue-200 text-[11px] font-semibold">Try queries:</span>
          {exampleQueries.map(q => (
            <button
              key={q}
              onClick={() => {
                setAskQuery(q);
                handleAskSubmit(undefined, q);
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[11px] px-2.5 py-1 rounded-lg border border-white/15 transition-all text-left"
            >
              &ldquo;{q}&rdquo;
            </button>
          ))}
        </div>

        {/* Parse failure message */}
        {parseError && (
          <div className="mt-3 p-3 bg-amber-500/20 border border-amber-300/40 rounded-xl text-xs text-amber-200">
            Could not parse filter conditions from that query. Try mentioning a state (e.g. Delhi), status (e.g. flagged),
            tenure (e.g. next 30 days), bank name (SBI, HDFC), or amount (above 10 lakh).
          </div>
        )}

        {/* Results Panel */}
        {activeFilter && (
          <div className="mt-4 bg-white rounded-xl p-4 text-gray-900 shadow-lg space-y-3">
            {/* Chip row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Active Filter Chips:
              </span>
              {chips.map(chip => (
                <span
                  key={chip.id}
                  className="bg-blue-50 text-[#0072c6] border border-blue-200 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1"
                >
                  {chip.label}
                  <button
                    onClick={() => removeChip(chip.key)}
                    className="hover:text-red-600 ml-0.5 text-xs font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              <span className="text-xs text-gray-500 font-semibold ml-auto">
                {askResults.length} matches found
              </span>
            </div>

            {/* Collapsible raw JSON */}
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowJson(s => !s)}
                className="w-full px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-left text-[11px] font-mono text-gray-600 flex items-center justify-between"
              >
                <span className="flex items-center gap-1 font-bold">
                  <Code2 size={12} /> Applied JSON Filter (Role Scope:{' '}
                  {isInstRole ? `Inst: ${selectedInstitutionId}` : 'All Institutions'})
                </span>
                {showJson ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showJson && (
                <pre className="p-3 bg-gray-900 text-green-400 text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(activeFilter, null, 2)}
                </pre>
              )}
            </div>

            {/* Results Table */}
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2">FDR Number</th>
                    <th className="px-3 py-2">Institution & State</th>
                    <th className="px-3 py-2">Bank</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Maturity Date</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Risk</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {askResults.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                        No instruments match these exact query parameters.
                      </td>
                    </tr>
                  ) : (
                    askResults.map(inst => {
                      const college = institutions.find(i => i.id === inst.institutionId);
                      const band = getRiskBand(inst.riskScore);
                      return (
                        <tr key={inst.id} className="hover:bg-blue-50/40">
                          <td className="px-3 py-2 font-mono font-bold">{maskInstrumentNo(inst.instrumentNo)}</td>
                          <td className="px-3 py-2">
                            <div className="font-semibold text-gray-800">{college?.name}</div>
                            <div className="text-[10px] text-gray-400">{college?.state}</div>
                          </td>
                          <td className="px-3 py-2 text-gray-700">{inst.bankName}</td>
                          <td className="px-3 py-2 font-bold text-gray-900">{formatINR(inst.amount)}</td>
                          <td className="px-3 py-2 text-gray-700">{formatDate(inst.maturityDate)}</td>
                          <td className="px-3 py-2">
                            <StatusPill status={inst.status} />
                          </td>
                          <td className="px-3 py-2">
                            <RiskBadge score={inst.riskScore} band={band} />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => navigate(`/instruments/${inst.id}`)}
                              className="text-[#0072c6] font-semibold hover:underline"
                            >
                              Review →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label="Active FDRs"
          value={active}
          sub="Compliant & locked"
          color="bg-green-50 text-green-700"
          icon={<CheckCircle size={20} />}
        />
        <KpiCard
          label="Expiring ≤30d"
          value={expiring30}
          sub="Requires renewal notice"
          color="bg-amber-50 text-amber-700"
          icon={<Clock size={20} />}
        />
        <KpiCard
          label="Matured"
          value={matured}
          sub="Awaiting action"
          color="bg-gray-100 text-gray-700"
          icon={<Archive size={20} />}
        />
        <KpiCard
          label="Verification Queue"
          value={toVerify}
          sub="Flagged + Under verification"
          color="bg-red-50 text-red-700"
          icon={<AlertTriangle size={20} />}
        />
        <KpiCard
          label="Coverage Gap Risk"
          value={gapRisk}
          sub="Institutions with deficit"
          color="bg-orange-50 text-orange-700"
          icon={<TrendingDown size={20} />}
        />
        <KpiCard
          label="Released"
          value={released}
          sub="Lien officially removed"
          color="bg-blue-50 text-blue-700"
          icon={<Unlock size={20} />}
        />
      </div>

      {/* Charts & queues */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Maturity Pipeline Bar Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Maturity Pipeline (Next 6 Months)</h2>
          <p className="text-xs text-gray-400 mb-4">
            Security deposit maturity distribution deriving live from clock ({currentDate})
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipeline} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
                      <div className="font-semibold text-gray-800 mb-1">{label}</div>
                      <div>{payload[0]?.value} instruments</div>
                      <div className="text-gray-400">₹{payload[0]?.payload?.amount}L total</div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" fill="#0072c6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Needs action */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Needs Action Today</h2>
          <p className="text-xs text-gray-400 mb-3">{needsAction.length} urgent items pending resolution</p>
          <div className="space-y-2 overflow-y-auto max-h-64">
            {needsAction.length === 0 && (
              <div className="text-xs text-gray-400 text-center py-4">No urgent items pending 🎉</div>
            )}
            {needsAction.slice(0, 6).map(item => (
              <div
                key={item.id}
                className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                  item.urgency === 'red' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    item.urgency === 'red' ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.sub}</div>
                </div>
                <button
                  onClick={() => navigate(item.route)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold whitespace-nowrap"
                >
                  Review →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity / audit strip */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800">Recent Activity — Tamper-evident Audit Strip</h2>
          <button
            onClick={() => navigate('/audit')}
            className="text-xs text-[#0072c6] font-semibold hover:underline"
          >
            Open Complete Audit Ledger →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2 pr-4 font-semibold">Timestamp</th>
                <th className="text-left pb-2 pr-4 font-semibold">Actor</th>
                <th className="text-left pb-2 pr-4 font-semibold">Action</th>
                <th className="text-left pb-2 pr-4 font-semibold">Entity</th>
                <th className="text-left pb-2 font-semibold">Hash (SHA-256 truncated)</th>
              </tr>
            </thead>
            <tbody>
              {recentAudit.map(ev => (
                <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">
                    {new Date(ev.timestamp).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-2 pr-4 text-gray-700 max-w-32 truncate">{ev.actor}</td>
                  <td className="py-2 pr-4">
                    <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">{ev.action}</span>
                  </td>
                  <td className="py-2 pr-4 text-gray-500 font-mono">{ev.entityId}</td>
                  <td className="py-2 font-mono text-gray-400">{ev.hash.slice(0, 16)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
