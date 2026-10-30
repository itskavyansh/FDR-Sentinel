import React from 'react';
import { useStore } from '../store/useStore';
import { formatDate, formatINR, maskInstrumentNo } from '../lib/dates';
import { Toast, useToast } from '../components/Toast';
import type { ReleaseRequest } from '../types';
import {
  Download,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Building2,
  ShieldCheck,
  Printer,
  ChevronRight,
  ExternalLink,
  Plus,
} from 'lucide-react';

export default function ReleaseRequests() {
  const {
    releaseRequests,
    instruments,
    institutions,
    role,
    currentDate,
    updateReleaseStage,
    requestRelease,
  } = useStore();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [activeTab, setActiveTab] = React.useState<'requests' | 'new'>('requests');
  const [selectedReq, setSelectedReq] = React.useState<ReleaseRequest | null>(null);
  const [showLetterModal, setShowLetterModal] = React.useState<ReleaseRequest | null>(null);

  // Notes state
  const [actionNotes, setActionNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  // New release form state (for Institution role or testing)
  const [newInstId, setNewInstId] = React.useState(
    instruments.find(i => i.status === 'Active' || i.status === 'Matured')?.id || ''
  );
  const [newReason, setNewReason] = React.useState(
    'Completion of 10-year statutory deposit period as per Approval Process Handbook'
  );

  const isMakerRole = role === 'Officer' || role === 'Officer-Maker' || role === 'Admin';
  const isCheckerRole = role === 'Officer' || role === 'Officer-Checker' || role === 'Admin';
  const isApproverRole = role === 'Officer' || role === 'Officer-Approver' || role === 'Admin';

  const handleStageAction = async (
    req: ReleaseRequest,
    nextStage: 'Checker' | 'Approver' | 'Approved' | 'Rejected',
    concurred: boolean
  ) => {
    setSubmitting(true);
    const actorLabel = `${role} (${role === 'Officer-Maker' ? 'Maker' : role === 'Officer-Checker' ? 'Checker' : 'Competent Authority'})`;
    await updateReleaseStage(req.id, nextStage, actionNotes || 'Stage reviewed and processed.', actorLabel, concurred);
    setActionNotes('');
    setSelectedReq(null);
    setSubmitting(false);

    if (nextStage === 'Approved') {
      showToast('Release Approved! Cryptographic e-signed letter generated and bank lien-release dispatched.', 'success');
    } else if (nextStage === 'Rejected') {
      showToast('Release rejected and returned to institution.', 'error');
    } else {
      showToast(`Stage escalated to ${nextStage}.`, 'info');
    }
  };

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstId) return;
    setSubmitting(true);
    const actor = 'Institution Principal';
    const reqId = await requestRelease(newInstId, newReason, 'Statutory_Compliance_Affidavit.pdf', actor);
    setSubmitting(false);
    setActiveTab('requests');
    showToast(`Release request ${reqId} created and sent to Officer Maker stage.`, 'success');
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Security Deposit Release Requests</h1>
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded font-bold">
              Active Stage: {role}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            3-Tier AICTE Governance: Maker Scrutiny → Section Head Checker → Competent Authority Approver.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'requests' ? 'bg-[#0072c6] text-white' : 'bg-white border text-gray-700'
            }`}
          >
            All Requests ({releaseRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              activeTab === 'new' ? 'bg-[#0072c6] text-white' : 'bg-white border text-gray-700'
            }`}
          >
            <Plus size={13} /> Request Release (Institution)
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h2 className="text-base font-bold text-gray-900">Submit Security Deposit Release Application</h2>
          <form onSubmit={handleCreateRelease} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-gray-700">Select FDR to Release:</label>
              <select
                value={newInstId}
                onChange={e => setNewInstId(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg font-mono font-medium"
              >
                {instruments
                  .filter(i => i.status !== 'Released' && i.status !== 'Release requested')
                  .map(i => {
                    const inst = institutions.find(inst => inst.id === i.institutionId);
                    return (
                      <option key={i.id} value={i.id}>
                        {i.instrumentNo} — {inst?.name} ({formatINR(i.amount)}, {i.status})
                      </option>
                    );
                  })}
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-700">Reason for Statutory Release:</label>
              <textarea
                rows={3}
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700">Supporting Order / Compliance Document:</label>
              <div className="mt-1 border border-dashed border-gray-300 rounded-lg p-3 text-center bg-gray-50 text-gray-500">
                Statutory_Compliance_Affidavit.pdf (Mock Attached)
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className="px-4 py-2 border rounded-lg text-gray-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#0072c6] text-white rounded-lg font-bold disabled:opacity-50"
              >
                Submit Release Request
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Requests List */
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {releaseRequests.map(req => {
              const inst = instruments.find(i => i.id === req.instrumentId);
              const institution = institutions.find(i => i.id === req.institutionId);
              const checklistPass =
                req.checklist.approvalCycleComplete &&
                req.checklist.noPendingCompliance &&
                req.checklist.noLegalHold &&
                req.checklist.instrumentStatusValid;

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4"
                >
                  {/* Top row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold font-mono text-xs">
                        {req.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">
                            {institution?.name || 'Institution'}
                          </span>
                          <span className="font-mono text-xs text-gray-500 font-semibold">
                            FDR: {inst?.instrumentNo}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Amount: <strong>{inst ? formatINR(inst.amount) : '₹0'}</strong> · Requested on:{' '}
                          {req.requestedDate}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          req.stage === 'Approved'
                            ? 'bg-green-100 text-green-800'
                            : req.stage === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        Stage: {req.stage}
                      </span>
                      {req.stage === 'Approved' && req.esignStamp && (
                        <button
                          onClick={() => setShowLetterModal(req)}
                          className="bg-[#0b2e4f] text-white hover:bg-blue-900 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 shadow-sm"
                        >
                          <FileCheck2 size={13} /> View E-Signed Letter
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3-Tier Workflow Stepper */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-100 text-xs">
                    {/* Stage 1: Maker */}
                    <div
                      className={`p-2.5 rounded-lg border ${
                        req.stage === 'Maker'
                          ? 'bg-blue-50 border-blue-300'
                          : req.makerRecommended
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className="font-bold text-gray-800 flex items-center justify-between">
                        <span>1. Maker (Scrutiny Officer)</span>
                        {req.makerRecommended ? (
                          <span className="text-green-700 font-bold">✓ Recommends</span>
                        ) : req.stage === 'Maker' ? (
                          <span className="text-blue-700 font-bold animate-pulse">● In Review</span>
                        ) : (
                          <span className="text-gray-400">Pending</span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1">
                        {req.makerNotes || 'Reviewing compliance & legal holds.'}
                      </div>
                    </div>

                    {/* Stage 2: Checker */}
                    <div
                      className={`p-2.5 rounded-lg border ${
                        req.stage === 'Checker'
                          ? 'bg-blue-50 border-blue-300'
                          : req.checkerConcurred
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className="font-bold text-gray-800 flex items-center justify-between">
                        <span>2. Checker (Section Head)</span>
                        {req.checkerConcurred ? (
                          <span className="text-green-700 font-bold">✓ Concurs</span>
                        ) : req.stage === 'Checker' ? (
                          <span className="text-blue-700 font-bold animate-pulse">● In Review</span>
                        ) : (
                          <span className="text-gray-400">Waiting</span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1">
                        {req.checkerNotes || 'Verification of regional concurrence.'}
                      </div>
                    </div>

                    {/* Stage 3: Approver */}
                    <div
                      className={`p-2.5 rounded-lg border ${
                        req.stage === 'Approver'
                          ? 'bg-blue-50 border-blue-300'
                          : req.stage === 'Approved'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className="font-bold text-gray-800 flex items-center justify-between">
                        <span>3. Approver (Competent Auth)</span>
                        {req.stage === 'Approved' ? (
                          <span className="text-green-700 font-bold">✓ Approved & E-Signed</span>
                        ) : req.stage === 'Approver' ? (
                          <span className="text-blue-700 font-bold animate-pulse">● In Review</span>
                        ) : (
                          <span className="text-gray-400">Waiting</span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1">
                        {req.approverNotes || 'Final authority e-signature.'}
                      </div>
                    </div>
                  </div>

                  {/* Auto-check Checklist Grid */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Automated Pre-Release Verification Checklist
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        {req.checklist.approvalCycleComplete ? (
                          <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle size={14} className="text-red-600 flex-shrink-0" />
                        )}
                        <span className="text-gray-700">Approval Cycle Complete</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {req.checklist.noPendingCompliance ? (
                          <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle size={14} className="text-red-600 flex-shrink-0" />
                        )}
                        <span className="text-gray-700">
                          {req.checklist.noPendingCompliance ? 'Zero Pending Dues' : 'Pending Regional Clearance'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {req.checklist.noLegalHold ? (
                          <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle size={14} className="text-red-600 flex-shrink-0" />
                        )}
                        <span className="text-gray-700">No Legal Holds</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {req.checklist.instrumentStatusValid ? (
                          <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle size={14} className="text-red-600 flex-shrink-0" />
                        )}
                        <span className="text-gray-700">Maturity / Active Valid</span>
                      </div>
                    </div>
                    {!checklistPass && (
                      <div className="mt-2 text-[11px] text-red-700 bg-red-100/80 border border-red-300 p-2.5 rounded-lg space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <XCircle size={13} className="text-red-600" />
                          Release Action Blocked: Statutory Checklist Failure
                        </div>
                        <ul className="list-disc list-inside text-[10px] space-y-0.5 text-red-800">
                          {!req.checklist.approvalCycleComplete && <li>Approval cycle incomplete</li>}
                          {!req.checklist.noPendingCompliance && <li>Pending compliance clearance from Southern Regional Office</li>}
                          {!req.checklist.noLegalHold && <li>Statutory or court legal hold active on this deposit</li>}
                          {!req.checklist.instrumentStatusValid && <li>Instrument must be either Matured or Active</li>}
                        </ul>
                        <div className="text-[10px] text-red-600 italic">
                          Action buttons (Recommend, Concur, Approve) are strictly disabled until all conditions pass.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stage Action Panel */}
                  {req.stage !== 'Approved' && req.stage !== 'Rejected' && (
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-700">
                          Take Stage Action as{' '}
                          <span className="text-[#0072c6] font-bold">{req.stage}</span>:
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="Add formal scrutiny or approval remark…"
                        value={actionNotes}
                        onChange={e => setActionNotes(e.target.value)}
                        className="w-full text-xs p-2 border border-gray-300 rounded-lg"
                      />

                      <div className="flex gap-2 justify-end pt-1">
                        {req.stage === 'Maker' && isMakerRole && (
                          <button
                            title={!checklistPass ? "Blocked: Checklist item failed" : undefined}
                            disabled={!checklistPass || submitting}
                            onClick={() => handleStageAction(req, 'Checker', true)}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Recommend to Checker →
                          </button>
                        )}

                        {req.stage === 'Checker' && isCheckerRole && (
                          <button
                            title={!checklistPass ? "Blocked: Checklist item failed" : undefined}
                            disabled={!checklistPass || submitting}
                            onClick={() => handleStageAction(req, 'Approver', true)}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Concur & Forward to Approver →
                          </button>
                        )}

                        {req.stage === 'Approver' && isApproverRole && (
                          <button
                            title={!checklistPass ? "Blocked: Checklist item failed" : undefined}
                            disabled={!checklistPass || submitting}
                            onClick={() => handleStageAction(req, 'Approved', true)}
                            className="px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                          >
                            <ShieldCheck size={14} /> Final Approve & E-Sign Release
                          </button>
                        )}

                        <button
                          disabled={submitting}
                          onClick={() => handleStageAction(req, 'Rejected', false)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-semibold text-xs disabled:opacity-50"
                        >
                          Reject / Return
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* E-Signed Letter Modal */}
      {showLetterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="font-bold text-xs uppercase text-gray-500">
                Official AICTE Release Communication
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Printer size={13} /> Print
                </button>
                <button
                  onClick={() => setShowLetterModal(null)}
                  className="text-gray-400 hover:text-gray-800 text-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Styled HTML Official Letter */}
            <div className="p-8 border-2 border-gray-300 rounded-xl bg-amber-50/20 font-serif text-xs text-gray-900 space-y-5 leading-relaxed">
              <div className="text-center border-b-2 border-gray-800 pb-4">
                <div className="text-base font-bold uppercase tracking-widest text-[#0b2e4f]">
                  ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                </div>
                <div className="text-[10px] text-gray-600">
                  (A Statutory Body of the Government of India)
                </div>
                <div className="text-[10px] text-gray-600">
                  Nelson Mandela Marg, Vasant Kunj, New Delhi – 110070
                </div>
              </div>

              <div className="flex justify-between text-[11px] font-mono">
                <div>
                  <strong>Ref:</strong> AICTE/FD/REL/{showLetterModal.id.toUpperCase()}
                </div>
                <div>
                  <strong>Date:</strong> {currentDate}
                </div>
              </div>

              <div>
                <strong>To,</strong>
                <div>The Branch Manager,</div>
                <div>
                  {instruments.find(i => i.id === showLetterModal.instrumentId)?.bankName}
                </div>
              </div>

              <div>
                <strong>Sub: Release of Lien on Fixed Deposit Receipt in favour of AICTE – Reg.</strong>
              </div>

              <p>Sir/Madam,</p>

              <p>
                With reference to the FDR Number{' '}
                <strong className="font-mono">
                  {instruments.find(i => i.id === showLetterModal.instrumentId)?.instrumentNo}
                </strong>{' '}
                for an amount of{' '}
                <strong>
                  {formatINR(instruments.find(i => i.id === showLetterModal.instrumentId)?.amount || 0)}
                </strong>{' '}
                pledged in favour of Member Secretary, AICTE by{' '}
                <strong>
                  {institutions.find(i => i.id === showLetterModal.institutionId)?.name}
                </strong>
                , this is to certify that AICTE has <strong>NO OBJECTION</strong> to the release of the
                aforementioned lien.
              </p>

              <p>
                The said Fixed Deposit Receipt along with accrued interest may be released to the depositor
                institution as statutory terms have been fulfilled.
              </p>

              {/* Cryptographic E-Sign Stamp */}
              <div className="mt-8 pt-4 border-t border-gray-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="p-3 border-2 border-green-700 bg-green-50/60 rounded-xl text-[10px] font-mono space-y-0.5 text-green-900 w-full sm:w-auto">
                  <div className="font-bold flex items-center gap-1 text-green-800">
                    <ShieldCheck size={14} /> AICTE DIGITALLY SIGNED CERTIFICATE
                  </div>
                  <div>Signatory: {showLetterModal.esignStamp?.signedBy || 'Competent Authority'}</div>
                  <div>Serial: {showLetterModal.esignStamp?.certSerial}</div>
                  <div>Hash: {showLetterModal.esignStamp?.hash?.slice(0, 24)}…</div>
                  <div>Timestamp: {showLetterModal.esignStamp?.timestamp}</div>
                </div>

                <div className="text-right text-[11px]">
                  <div className="font-bold">For All India Council for Technical Education</div>
                  <div className="italic text-gray-500 mt-4">Authorized Officer / Bureau Head</div>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 pt-2 text-[10px] text-gray-500 flex justify-between">
                <span>Bank Lien Notice Ack: {showLetterModal.bankNoticeAck || 'ACK-BANK-991204'}</span>
                <span>Tamper-evident verification hash attached to blockchain ledger</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
