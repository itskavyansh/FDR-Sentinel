import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatINR, formatDate, maskInstrumentNo } from '../lib/dates';
import { Toast, useToast } from '../components/Toast';
import {
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  KeyRound,
  FileCheck2,
} from 'lucide-react';

export default function BankConfirmation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { bankTokens, instruments, institutions, confirmBankToken, mismatchBankToken } = useStore();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [otp, setOtp] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [outcome, setOutcome] = React.useState<'idle' | 'confirmed' | 'mismatch'>('idle');

  const bankTokenObj = bankTokens.find(t => t.token === token);
  const instrument = bankTokenObj ? instruments.find(i => i.id === bankTokenObj.instrumentId) : null;
  const institution = instrument ? institutions.find(i => i.id === instrument.institutionId) : null;

  if (!bankTokenObj || !instrument || !institution) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={28} />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Invalid or Expired Bank Link</h1>
          <p className="text-xs text-gray-500">
            This verification token ({token}) is either invalid or has already been completed.
          </p>
          <button
            onClick={() => navigate('/instruments')}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            ← Return to Sentinel Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    if (otp.length !== 6) {
      showToast('Please enter any 6-digit bank verification OTP to proceed.', 'error');
      return;
    }
    setSubmitting(true);
    await confirmBankToken(bankTokenObj.token, `Bank Nodal Officer (${instrument.bankName})`);
    setOutcome('confirmed');
    setSubmitting(false);
    showToast('FDR verified! All fields upgraded to L2 Bank-confirmed trust.', 'success');
  };

  const handleMismatch = async () => {
    if (!confirm('Flag this FDR as a mismatch? This will immediately alert AICTE and flag the instrument.')) return;
    setSubmitting(true);
    await mismatchBankToken(bankTokenObj.token, `Bank Nodal Officer (${instrument.bankName})`);
    setOutcome('mismatch');
    setSubmitting(false);
    showToast('Discrepancy reported! Risk score increased by 50 and flagged for scrutiny.', 'error');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between p-4 sm:p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="max-w-md w-full mx-auto mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-bold text-gray-800 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-[#0072c6]" /> AICTE Bank Nodal Verification
          </span>
          <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
            SECURE LINK
          </span>
        </div>
      </div>

      {/* Card */}
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-[#0b2e4f] p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">
                Authorized Bank Verification
              </div>
              <h2 className="text-base font-bold mt-0.5">{instrument.bankName}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Building2 size={20} />
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-100 bg-white/10 p-2 rounded-lg">
            Institution: <strong className="text-white">{institution.name}</strong>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {outcome === 'idle' ? (
            <>
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Verify Pledged Security Deposit Particulars:
                </h3>
                {/* 3 Key Fields */}
                <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center text-xs py-1 border-b border-gray-200">
                    <span className="text-gray-500">FDR Number (Last Digits):</span>
                    <span className="font-mono font-bold text-gray-900 text-sm">
                      •••• •••• {instrument.instrumentNo.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1 border-b border-gray-200">
                    <span className="text-gray-500">Security Deposit Amount:</span>
                    <span className="font-bold text-gray-900 text-sm">
                      {formatINR(instrument.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1">
                    <span className="text-gray-500">Stipulated Maturity Date:</span>
                    <span className="font-bold text-gray-900 text-sm">
                      {formatDate(instrument.maturityDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* OTP Simulation */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <KeyRound size={13} className="text-gray-400" /> Bank Nodal 2-Factor OTP
                  </span>
                  <span className="text-[10px] text-blue-600 font-normal">
                    (Demo: Any 6 digits like 123456)
                  </span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  placeholder="Enter 6-digit OTP"
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-base tracking-widest font-mono font-bold p-2.5 border-2 border-gray-300 focus:border-[#0072c6] rounded-xl outline-none"
                />
              </div>

              {/* Two Actions */}
              <div className="space-y-2 pt-2">
                <button
                  id="bank-confirm-btn"
                  disabled={submitting}
                  onClick={handleConfirm}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-xs shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} /> Confirm Authenticity (Upgrade to L2)
                </button>

                <button
                  id="bank-mismatch-btn"
                  disabled={submitting}
                  onClick={handleMismatch}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <AlertTriangle size={16} /> Flag Mismatch / Discrepancy (+50 Risk)
                </button>
              </div>
            </>
          ) : outcome === 'confirmed' ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-base font-bold text-gray-900">Confirmation Successful</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Bank verification has been recorded in the AICTE audit chain. All instrument fields have been upgraded
                to <strong>L2 Bank-confirmed</strong> trust.
              </p>
              <button
                onClick={() => navigate(`/instruments/${instrument.id}`)}
                className="mt-3 px-4 py-2 bg-[#0072c6] text-white rounded-lg text-xs font-bold"
              >
                View in AICTE Officer Review →
              </button>
            </div>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-base font-bold text-gray-900">Discrepancy Flagged</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                A high-risk alert (+50 bank mismatch) has been triggered. Status set to{' '}
                <strong className="text-red-700">Flagged</strong> and placed in the Officer Verification Queue.
              </p>
              <button
                onClick={() => navigate('/queue')}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold"
              >
                Go to Verification Queue →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center text-[10px] text-gray-400 mt-4">
        AICTE Digital Security Deposit Framework · Smart India Hackathon Demo
      </div>
    </div>
  );
}
