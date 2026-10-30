import type { InstrumentStatus, TrustLevel, RiskBand } from '../types';

export function StatusPill({ status }: { status: InstrumentStatus }) {
  const colorMap: Record<InstrumentStatus, string> = {
    'Draft': 'bg-gray-100 text-gray-600',
    'Submitted': 'bg-blue-100 text-blue-700',
    'Auto-checked': 'bg-cyan-100 text-cyan-700',
    'Under verification': 'bg-amber-100 text-amber-700',
    'Flagged': 'bg-red-100 text-red-700',
    'Active': 'bg-green-100 text-green-700',
    'Expiring': 'bg-orange-100 text-orange-700',
    'Matured': 'bg-gray-200 text-gray-600',
    'Renewal pending': 'bg-yellow-100 text-yellow-700',
    'Renewed': 'bg-emerald-100 text-emerald-700',
    'Release requested': 'bg-purple-100 text-purple-700',
    'Under review': 'bg-indigo-100 text-indigo-700',
    'Released': 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colorMap[status]}`}>
      {status}
    </span>
  );
}

export function RiskBadge({ score, band }: { score: number; band: RiskBand }) {
  const colorMap: Record<RiskBand, string> = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${colorMap[band]}`}>
      {band === 'high' ? '▲' : band === 'medium' ? '●' : '▼'} {score}
    </span>
  );
}

const TRUST_CONFIG: Record<TrustLevel, { label: string; color: string; tooltip: string }> = {
  L0: {
    label: 'L0 Declared',
    color: 'bg-gray-100 text-gray-500 border-gray-300',
    tooltip: 'L0 – Self-declared by institution. Not yet verified by any system or officer.',
  },
  L1: {
    label: 'L1 Doc-checked',
    color: 'bg-blue-100 text-blue-600 border-blue-300',
    tooltip: 'L1 – Document uploaded and auto-checked by system (OCR/format validation).',
  },
  L2: {
    label: 'L2 Bank-confirmed',
    color: 'bg-green-100 text-green-700 border-green-300',
    tooltip: 'L2 – Confirmed by bank nodal officer via secure portal link.',
  },
  L3: {
    label: 'L3 Officer-approved',
    color: 'bg-[#0b2e4f] text-white border-[#0b2e4f]',
    tooltip: 'L3 – Manually verified and approved by AICTE officer. Highest trust.',
  },
};

export function TrustBadge({ level }: { level: TrustLevel }) {
  const cfg = TRUST_CONFIG[level];
  return (
    <span
      title={cfg.tooltip}
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border cursor-help ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}
