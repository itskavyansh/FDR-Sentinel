import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { computeRisk, getRiskBand } from '../lib/fraud';
import { formatDate, formatINR, maskInstrumentNo, daysToMaturity } from '../lib/dates';
import { StatusPill, RiskBadge, TrustBadge } from '../components/Badges';
import { Toast, useToast } from '../components/Toast';
import type { TrustLevel } from '../types';
import { ArrowLeft, Send, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const ACTOR = 'officer.kumar@aicte.gov.in';

// Modal component
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Mock scanned FDR document
function MockFdrDocument({ isFlagged, bankMismatch }: { isFlagged: boolean; bankMismatch: boolean }) {
  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 font-mono text-xs relative overflow-hidden select-none">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
        <div className="text-6xl font-black text-gray-400 rotate-45">SPECIMEN</div>
      </div>

      {/* Document header */}
      <div className="text-center mb-4 border-b border-amber-300 pb-3">
        <div className="font-bold text-base text-gray-800 mb-0.5">STATE BANK OF INDIA</div>
        <div className="text-gray-500">Main Branch, Connaught Place, New Delhi – 110001</div>
        <div className="text-gray-500">IFSC: SBIN0001203</div>
        <div className="mt-2 text-xs uppercase tracking-widest font-bold text-gray-700">
          FIXED DEPOSIT RECEIPT
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="text-gray-500">FDR No.:</span>
          <span className="font-bold text-gray-800">xxxx4471</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Depositor:</span>
          <span className="text-gray-800">Delhi Institute of Technology & Mgmt.</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Amount (₹):</span>
          <span className="font-bold text-gray-800">25,00,000/-</span>
        </div>
        {/* Date field - flagged if issue */}
        <div className={`flex justify-between relative ${isFlagged ? 'ring-2 ring-red-400 bg-red-50 rounded px-1' : ''}`}>
          <span className="text-gray-500">Issue Date:</span>
          <span className={`font-bold ${isFlagged ? 'text-red-700' : 'text-gray-800'}`}>
            {isFlagged ? '15-JAN-2024' : '15-JAN-2024'}
          </span>
          {isFlagged && (
            <span className="absolute -top-3 right-0 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-sm">date mismatch</span>
          )}
        </div>
        <div className={`flex justify-between relative ${bankMismatch ? 'ring-2 ring-amber-400 bg-amber-50 rounded px-1' : ''}`}>
          <span className="text-gray-500">Maturity Date:</span>
          <span className={`font-bold ${bankMismatch ? 'text-amber-700' : 'text-gray-800'}`}>15-DEC-2026</span>
          {bankMismatch && (
            <span className="absolute -top-3 right-0 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-sm">font differs</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Rate of Interest:</span>
          <span className="font-bold text-gray-800">7.00% p.a.</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Period:</span>
          <span className="text-gray-800">3 Years</span>
        </div>

        {/* Lien clause */}
        <div className="mt-3 pt-3 border-t border-amber-200">
          <div className="text-gray-600 leading-relaxed">
            <span className="font-bold">LIEN NOTE:</span> This FDR is pledged in favour of{' '}
            <span className="text-blue-700 font-bold">All India Council for Technical Education (AICTE)</span>,
            New Delhi and shall not be encashed/renewed without written consent of AICTE.
          </div>
        </div>

        {/* Signature area */}
        <div className="mt-4 flex justify-between items-end">
          <div className="text-gray-400">
            <div className="italic mb-1">Authorised Signatory</div>
            <div className="w-20 border-b border-gray-400" />
          </div>
          <div className="text-right text-gray-400">
            <div>Branch Stamp</div>
            <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-full mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InstrumentReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    instruments,
    institutions,
    role,
    officerRegion,
    updateInstrumentStatus,
    upgradeFieldTrust,
    addScrutinyNote,
    addAuditEvent,
    currentDate,
  } = useStore();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [showNoteModal, setShowNoteModal] = React.useState(false);
  const [noteText, setNoteText] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const instrument = instruments.find(i => i.id === id);
  const institution = instrument ? institutions.find(i => i.id === instrument.institutionId) : null;

  // Regional Access Control Enforcement
  const isOfficerRole =
    role === 'Officer' ||
    role === 'Officer-Maker' ||
    role === 'Officer-Checker' ||
    role === 'Officer-Approver';

  const hasRegionalAccess =
    !isOfficerRole ||
    officerRegion === 'All' ||
    institution?.region === officerRegion;

  React.useEffect(() => {
    if (instrument && institution && !hasRegionalAccess) {
      addAuditEvent(
        `officer-${officerRegion.toLowerCase()}@aicte.gov.in`,
        'ACCESS_DENIED_OUT_OF_REGION',
        'instrument',
        instrument.id,
        {
          attemptedRegion: institution.region,
          officerAssignedRegion: officerRegion,
          institution: institution.name,
        }
      );
    }
  }, [instrument?.id, institution?.region, officerRegion, hasRegionalAccess]);

  if (!instrument || !institution) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">🔍</div>
          <div>Instrument not found.</div>
          <button className="mt-3 text-blue-600 text-sm" onClick={() => navigate('/instruments')}>← Back to instruments</button>
        </div>
      </div>
    );
  }

  // Access Denied Screen
  if (!hasRegionalAccess) {
    return (
      <div className="bg-white rounded-2xl border-2 border-red-300 p-8 max-w-lg mx-auto my-12 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl font-black">⛔</span>
        </div>
        <h1 className="text-lg font-bold text-gray-900">Access Denied: Jurisdictional Boundary</h1>
        <p className="text-xs text-gray-600 leading-relaxed">
          You are currently assigned to the <strong>{officerRegion} Regional Office</strong>.
          This security deposit belongs to <strong>{institution.name}</strong> located in the{' '}
          <strong className="text-red-700">{institution.region} Region</strong>.
        </p>
        <div className="p-3 bg-red-50 text-red-800 rounded-xl text-[11px] font-mono border border-red-200">
          Security Event Logged: ACCESS_DENIED_OUT_OF_REGION
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => navigate('/instruments')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
          >
            ← Back to Instruments
          </button>
          <button
            onClick={() => useStore.getState().setOfficerRegion('All')}
            className="px-4 py-2 bg-[#0072c6] hover:bg-blue-600 text-white text-xs font-bold rounded-lg"
          >
            Switch Officer Region to &ldquo;All&rdquo;
          </button>
        </div>
      </div>
    );
  }

  const { score, signals } = computeRisk(instrument, instruments);
  const band = getRiskBand(score);
  const days = daysToMaturity(instrument.maturityDate, currentDate);
  const isFlagged = instrument.status === 'Flagged';
  const hasBankMismatch = signals.some(s => s.label.includes('bank') && s.triggered) ||
    signals.some(s => s.label.includes('IFSC') && s.triggered);

  // Masking Rule: Instrument numbers show only last 4 digits everywhere except the review screen for Officer role
  const displayedInstrumentNo = isOfficerRole
    ? instrument.instrumentNo // Unmasked for Officer!
    : maskInstrumentNo(instrument.instrumentNo);

  const fieldRows: Array<{ key: keyof typeof instrument.fieldTrust; label: string; value: string }> = [
    { key: 'bank', label: 'Bank Name', value: instrument.bankName },
    { key: 'instrumentNo', label: 'Instrument No.', value: displayedInstrumentNo },
    { key: 'amount', label: 'Amount', value: formatINR(instrument.amount) },
    { key: 'issueDate', label: 'Issue Date', value: formatDate(instrument.issueDate) },
    { key: 'maturityDate', label: 'Maturity Date', value: formatDate(instrument.maturityDate) },
    { key: 'lien', label: 'AICTE Lien', value: instrument.lienInFavourAicte ? 'Marked' : 'NOT marked' },
  ];

  const handleSendBankLink = async () => {
    setSubmitting(true);
    await updateInstrumentStatus(instrument.id, 'Under verification', ACTOR, 'Bank confirmation link sent');
    const token = await useStore.getState().createBankToken(instrument.id, ACTOR);
    const linkUrl = `${window.location.origin}/bank/${token}`;
    showToast(`Bank confirmation link created! ${linkUrl}`, 'info');
    setSubmitting(false);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSubmitting(true);
    await addScrutinyNote(instrument.id, noteText, ACTOR);
    setShowNoteModal(false);
    setNoteText('');
    showToast('Scrutiny note recorded in audit trail.', 'success');
    setSubmitting(false);
  };

  const handleApprove = async () => {
    if (!confirm('Upgrade all fields to L3 and mark instrument as Active?')) return;
    setSubmitting(true);
    const fields: Array<keyof typeof instrument.fieldTrust> = ['bank', 'instrumentNo', 'amount', 'issueDate', 'maturityDate', 'lien'];
    for (const field of fields) {
      await upgradeFieldTrust(instrument.id, field, 'L3', ACTOR);
    }
    await updateInstrumentStatus(instrument.id, 'Active', ACTOR, 'Officer L3 approval');
    showToast('Instrument approved (L3). Status set to Active.', 'success');
    setSubmitting(false);
  };

  const handleReject = async () => {
    if (!confirm('Flag this instrument as Flagged with high-risk annotation?')) return;
    setSubmitting(true);
    await updateInstrumentStatus(instrument.id, 'Flagged', ACTOR, 'Officer rejection — requires re-submission');
    showToast('Instrument flagged. Institution notified.', 'error');
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900 font-mono">{displayedInstrumentNo}</h1>
            <StatusPill status={instrument.status} />
            <RiskBadge score={score} band={band} />
            {days >= 0 && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${days <= 30 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                {days}d to maturity
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">{institution.name} · {institution.state}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Mock scanned FDR document */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-gray-400" />
              <span className="text-sm font-bold text-gray-800">Scanned FDR Document</span>
              {isFlagged && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold ml-2">
                  ⚠ Anomalies detected
                </span>
              )}
            </div>
            <MockFdrDocument isFlagged={isFlagged} bankMismatch={hasBankMismatch} />
          </div>

          {/* Action buttons */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Officer Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                id="send-bank-link-btn"
                disabled={submitting}
                onClick={handleSendBankLink}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Send size={14} />
                Send Bank Confirmation Link
              </button>
              <button
                id="record-note-btn"
                disabled={submitting}
                onClick={() => setShowNoteModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <FileText size={14} />
                Record Scrutiny Note
              </button>
              <div className="flex gap-2">
                <button
                  id="approve-btn"
                  disabled={submitting}
                  onClick={handleApprove}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={14} />
                  Approve (L3)
                </button>
                <button
                  id="reject-btn"
                  disabled={submitting}
                  onClick={handleReject}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <XCircle size={14} />
                  Reject / Flag
                </button>
              </div>
            </div>
            {instrument.notes && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                <strong>Scrutiny note:</strong> {instrument.notes}
              </div>
            )}
          </div>
        </div>

        {/* Right: Field analysis + Fraud Guard */}
        <div className="space-y-4">
          {/* Extracted fields with Trust Ladder */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Extracted Fields — Trust Ladder</h3>
            <div className="space-y-2">
              {fieldRows.map(row => {
                const level = instrument.fieldTrust[row.key] as TrustLevel;
                const isProblematic = (row.key === 'lien' && !instrument.lienInFavourAicte) ||
                  (row.key === 'maturityDate' && new Date(instrument.maturityDate) <= new Date(instrument.issueDate));
                return (
                  <div
                    key={row.key}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-lg ${isProblematic ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-gray-600">{row.label}</div>
                      <div className={`text-sm font-medium ${isProblematic ? 'text-red-700' : 'text-gray-800'}`}>
                        {row.value}
                        {isProblematic && <span className="ml-2 text-red-500">⚠</span>}
                      </div>
                    </div>
                    <TrustBadge level={level} />
                  </div>
                );
              })}
            </div>
            <div className="mt-3 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-xs text-blue-600 font-semibold mb-1">Trust Ladder Legend</div>
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                <div><span className="inline-block w-2 h-2 rounded-sm bg-gray-400 mr-1" />L0 = Declared (grey)</div>
                <div><span className="inline-block w-2 h-2 rounded-sm bg-blue-500 mr-1" />L1 = Doc-checked (blue)</div>
                <div><span className="inline-block w-2 h-2 rounded-sm bg-green-500 mr-1" />L2 = Bank-confirmed (green)</div>
                <div><span className="inline-block w-2 h-2 rounded-sm bg-[#0b2e4f] mr-1" />L3 = Officer-approved (navy)</div>
              </div>
            </div>
          </div>

          {/* Fraud Guard */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800">Fraud Guard — Risk Analysis</h3>
              <RiskBadge score={score} band={band} />
            </div>

            {/* Risk score bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Risk Score</span>
                <span className={`font-bold ${band === 'high' ? 'text-red-600' : band === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>
                  {score}/100 — {band.toUpperCase()} risk
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${band === 'high' ? 'bg-red-500' : band === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-300 mt-1">
                <span>0</span>
                <span>30</span>
                <span>60</span>
                <span>100</span>
              </div>
            </div>

            {/* Signals */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Signal Breakdown</div>
              {signals.map((sig, sidx) => (
                <div
                  key={`${sig.label}-${sidx}`}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                    sig.triggered
                      ? 'bg-red-50 border border-red-100 text-red-700'
                      : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{sig.triggered ? '⚠' : '✓'}</span>
                    <span className={sig.triggered ? 'font-semibold' : ''}>{sig.label}</span>
                  </div>
                  <span className={`font-bold ${sig.triggered ? 'text-red-700' : 'text-gray-300'}`}>
                    +{sig.weight}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 p-2.5 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700">
              <AlertTriangle size={12} className="inline mr-1" />
              Fraud Guard never auto-rejects. High scores trigger review queue.
            </div>
          </div>

          {/* Instrument metadata */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Instrument Details</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <dt className="text-gray-400">IFSC</dt><dd className="font-mono font-semibold text-gray-700">{instrument.ifsc}</dd>
              <dt className="text-gray-400">Full No. (masked)</dt><dd className="font-mono font-semibold">{maskInstrumentNo(instrument.instrumentNo)}</dd>
              <dt className="text-gray-400">Issue Date</dt><dd>{formatDate(instrument.issueDate)}</dd>
              <dt className="text-gray-400">Maturity Date</dt><dd className={days <= 30 && days >= 0 ? 'text-red-600 font-semibold' : ''}>{formatDate(instrument.maturityDate)}</dd>
              <dt className="text-gray-400">Coverage Required</dt><dd>{instrument.coverageRequired ? formatINR(instrument.coverageRequired) : '—'}</dd>
              <dt className="text-gray-400">Lien in favour AICTE</dt>
              <dd className={instrument.lienInFavourAicte ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {instrument.lienInFavourAicte ? '✓ Yes' : '✗ No'}
              </dd>
              <dt className="text-gray-400">State</dt><dd>{institution.state} ({institution.region})</dd>
              <dt className="text-gray-400">AICTE Approval No.</dt><dd className="font-mono text-gray-600">{institution.approvalNo}</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Note modal */}
      {showNoteModal && (
        <Modal title="Record Scrutiny Note" onClose={() => setShowNoteModal(false)}>
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 h-32 resize-none outline-none focus:border-blue-400"
            placeholder="Enter scrutiny observations, discrepancies found, or next steps…"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAddNote}
              disabled={submitting || !noteText.trim()}
              className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Save Note
            </button>
            <button
              onClick={() => setShowNoteModal(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
