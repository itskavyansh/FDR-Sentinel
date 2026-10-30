import React from 'react';
import { useStore } from '../store/useStore';
import { Toast, useToast } from '../components/Toast';
import { verifyAuditChain } from '../lib/audit';
import {
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Filter,
} from 'lucide-react';

export default function AuditTrail() {
  const { auditEvents, role, simulateTampering, repairAuditChain } = useStore();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [filterAction, setFilterAction] = React.useState('all');
  const [filterEntity, setFilterEntity] = React.useState('all');
  const [verifying, setVerifying] = React.useState(false);
  const [verificationResult, setVerificationResult] = React.useState<{
    checked: boolean;
    valid: boolean;
    count: number;
    brokenEventId?: string | number;
    reason?: string;
  } | null>(null);

  const isAuditorRole = role === 'Auditor';

  // Actions and entities for filter
  const actions = [...new Set(auditEvents.map(e => e.action))].sort();
  const entities = [...new Set(auditEvents.map(e => e.entity))].sort();

  const filteredEvents = [...auditEvents].reverse().filter(e => {
    if (filterAction !== 'all' && e.action !== filterAction) return false;
    if (filterEntity !== 'all' && e.entity !== filterEntity) return false;
    return true;
  });

  const handleVerifyChain = async () => {
    setVerifying(true);
    const result = await verifyAuditChain(auditEvents);
    setVerifying(false);
    if (result.valid) {
      setVerificationResult({
        checked: true,
        valid: true,
        count: auditEvents.length,
      });
      showToast(`Chain intact! All ${auditEvents.length} cryptographic hashes verified.`, 'success');
    } else {
      setVerificationResult({
        checked: true,
        valid: false,
        count: auditEvents.length,
        brokenEventId: result.brokenEventId,
        reason: result.reason,
      });
      showToast(`Chain verification failed at event #${result.brokenEventId}!`, 'error');
    }
  };

  const handleSimulateTampering = async () => {
    const tamperedId = await simulateTampering();
    if (tamperedId) {
      setVerificationResult(null);
      showToast(
        `[Demo] Event ${tamperedId} payload was secretly altered in memory without updating hashes. Now click 'Verify Chain'!`,
        'info'
      );
    }
  };

  const handleRepairChain = async () => {
    await repairAuditChain();
    setVerificationResult(null);
    showToast('Demo audit chain successfully repaired and re-hashed.', 'success');
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Cryptographic Audit Trail</h1>
            <span className="bg-blue-100 text-[#0072c6] text-xs px-2 py-0.5 rounded-full font-bold">
              SHA-256 Merkle-Style Chain
            </span>
            {isAuditorRole && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Auditor Read-Only
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Immutable log of every state change, document upload, OCR extraction, and approval.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="verify-chain-btn"
            disabled={verifying}
            onClick={handleVerifyChain}
            className="px-4 py-2 bg-[#0072c6] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5 disabled:opacity-50"
          >
            <ShieldCheck size={14} />
            {verifying ? 'Verifying...' : 'Verify Chain'}
          </button>

          {!isAuditorRole && (
            <>
              <button
                id="simulate-tamper-btn"
                onClick={handleSimulateTampering}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                title="Silently edits an old event payload to prove hash chain integrity"
              >
                <AlertTriangle size={13} className="text-amber-600" />
                Simulate Tampering (Demo)
              </button>

              <button
                id="repair-chain-btn"
                onClick={handleRepairChain}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                title="Re-computes correct hashes for all events"
              >
                <RotateCcw size={13} />
                Repair Demo Chain
              </button>
            </>
          )}
        </div>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && verificationResult.checked && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
            verificationResult.valid
              ? 'bg-green-50 border-green-300 text-green-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          {verificationResult.valid ? (
            <CheckCircle2 size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="font-bold text-sm">
              {verificationResult.valid
                ? `Chain intact, ${verificationResult.count} events verified`
                : `Chain broken at event #${verificationResult.brokenEventId}`}
            </div>
            <div className="text-xs leading-relaxed opacity-90">
              {verificationResult.valid
                ? 'Every payload hash and inter-block pointer matches the cryptographic SHA-256 digest from genesis. No records have been modified or deleted.'
                : verificationResult.reason}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-xs">
        <span className="font-bold text-gray-500 uppercase flex items-center gap-1">
          <Filter size={12} /> Filter Events:
        </span>
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="border border-gray-300 rounded-lg px-2.5 py-1 text-gray-700 font-medium"
        >
          <option value="all">All Actions ({actions.length})</option>
          {actions.map(act => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>

        <select
          value={filterEntity}
          onChange={e => setFilterEntity(e.target.value)}
          className="border border-gray-300 rounded-lg px-2.5 py-1 text-gray-700 font-medium"
        >
          <option value="all">All Entities ({entities.length})</option>
          {entities.map(ent => (
            <option key={ent} value={ent}>
              {ent}
            </option>
          ))}
        </select>

        <span className="text-gray-400 ml-auto font-medium">
          Showing {filteredEvents.length} of {auditEvents.length} events
        </span>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200 font-bold">
              <tr>
                <th className="px-4 py-3">Event ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Payload Hash</th>
                <th className="px-4 py-3">Previous Hash</th>
                <th className="px-4 py-3">Block Hash (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEvents.map(e => {
                const isBrokenRow =
                  verificationResult &&
                  !verificationResult.valid &&
                  verificationResult.brokenEventId === e.id;

                return (
                  <tr
                    key={e.id}
                    className={`transition-colors ${
                      isBrokenRow
                        ? 'bg-red-100/80 border-2 border-red-500 font-semibold text-red-900'
                        : 'hover:bg-blue-50/40 text-gray-800'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-gray-700">
                      {e.id}
                      {isBrokenRow && (
                        <span className="ml-1 bg-red-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold">
                          TAMPERED
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {new Date(e.timestamp).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="px-4 py-3 max-w-36 truncate font-medium text-gray-700">
                      {e.actor}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-[#0072c6] px-2 py-0.5 rounded font-mono font-semibold text-[11px]">
                        {e.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500">
                      {e.entity}: <strong className="text-gray-800">{e.entityId}</strong>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-400" title={e.payloadHash}>
                      {e.payloadHash.slice(0, 10)}…
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-400" title={e.prevHash}>
                      {e.prevHash.slice(0, 10)}…
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-gray-900" title={e.hash}>
                      {e.hash.slice(0, 12)}…
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
