import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getRiskBand } from '../lib/fraud';
import { formatINR, maskInstrumentNo, daysToMaturity } from '../lib/dates';
import { StatusPill, RiskBadge } from '../components/Badges';

export default function VerificationQueue() {
  const { instruments, institutions, currentDate } = useStore();
  const navigate = useNavigate();

  const queue = instruments
    .filter(i => i.status === 'Flagged' || i.status === 'Under verification')
    .sort((a, b) => b.riskScore - a.riskScore);

  const getInstitution = (id: string) => institutions.find(i => i.id === id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Verification Queue</h1>
        <p className="text-sm text-gray-500">{queue.length} instruments pending — sorted by risk score (highest first)</p>
      </div>

      <div className="space-y-3">
        {queue.map((inst, idx) => {
          const institution = getInstitution(inst.institutionId);
          const band = getRiskBand(inst.riskScore);
          const days = daysToMaturity(inst.maturityDate, currentDate);
          const triggeredSignals = inst.riskSignals.filter(s => s.triggered);

          return (
            <div
              key={inst.id}
              className={`bg-white rounded-xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow ${
                band === 'high' ? 'border-red-200' : 'border-amber-200'
              }`}
              onClick={() => navigate(`/instruments/${inst.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Rank badge */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                  band === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  #{idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="font-mono text-sm font-bold text-gray-800">{maskInstrumentNo(inst.instrumentNo)}</span>
                    <StatusPill status={inst.status} />
                    <RiskBadge score={inst.riskScore} band={band} />
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {institution?.name} · {inst.bankName} · {formatINR(inst.amount)}
                    {days >= 0 && <span className={` ml-2 font-semibold ${days <= 30 ? 'text-red-600' : 'text-gray-500'}`}>· Matures in {days}d</span>}
                    {days < 0 && <span className="ml-2 text-gray-400">· Matured</span>}
                  </div>
                  {/* Risk signals */}
                  <div className="flex flex-wrap gap-1.5">
                    {triggeredSignals.map(sig => (
                      <span key={sig.label} className="bg-red-50 text-red-700 border border-red-100 text-xs px-2 py-0.5 rounded-full font-medium">
                        ⚠ {sig.label} (+{sig.weight})
                      </span>
                    ))}
                    {triggeredSignals.length === 0 && (
                      <span className="text-xs text-gray-400">No signals stored — computed dynamically</span>
                    )}
                  </div>
                </div>

                <button
                  className="text-sm font-semibold text-white px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors whitespace-nowrap flex-shrink-0"
                  onClick={e => { e.stopPropagation(); navigate(`/instruments/${inst.id}`); }}
                >
                  Open Review
                </button>
              </div>
            </div>
          );
        })}
        {queue.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-sm">Verification queue is clear.</div>
          </div>
        )}
      </div>
    </div>
  );
}
