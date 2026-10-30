import React from 'react';
import { useStore } from '../store/useStore';
import { formatDate, formatINR, maskInstrumentNo, daysToMaturity } from '../lib/dates';
import { StatusPill, TrustBadge, RiskBadge } from '../components/Badges';
import { computeRisk, getRiskBand } from '../lib/fraud';
import { Toast, useToast } from '../components/Toast';
import type { Instrument, TrustLevel } from '../types';
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck,
  Send,
  ExternalLink,
  ChevronRight,
  Shield,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OcrFormState {
  bankName: string;
  ifsc: string;
  instrumentNo: string;
  amount: number;
  issueDate: string;
  maturityDate: string;
  lienInFavourAicte: boolean;
  fileHash: string;
  pdfModifiedAfterCreation?: boolean;
  imageTampered?: boolean;
  confidences: {
    bankName: number;
    ifsc: number;
    instrumentNo: number;
    amount: number;
    issueDate: number;
    maturityDate: number;
    lienInFavourAicte: number;
  };
  fieldModifiedByUser: {
    bankName: boolean;
    ifsc: boolean;
    instrumentNo: boolean;
    amount: boolean;
    issueDate: boolean;
    maturityDate: boolean;
    lienInFavourAicte: boolean;
  };
}

export default function InstitutionPortal() {
  const {
    institutions,
    instruments,
    selectedInstitutionId,
    setSelectedInstitutionId,
    addInstrument,
    createBankToken,
    currentDate,
  } = useStore();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = React.useState<'portfolio' | 'submit'>('portfolio');
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [scanning, setScanning] = React.useState(false);
  const [createdInstrument, setCreatedInstrument] = React.useState<Instrument | null>(null);
  const [generatedBankToken, setGeneratedBankToken] = React.useState<string | null>(null);

  const currentInstitution =
    institutions.find(i => i.id === selectedInstitutionId) || institutions[0];

  const institutionInstruments = instruments.filter(
    i => i.institutionId === currentInstitution.id
  );

  const activeInstruments = institutionInstruments.filter(
    i => i.status === 'Active' || i.status === 'Expiring'
  );
  const activeCount = activeInstruments.length;
  const nextMaturityDays = institutionInstruments
    .filter(i => i.status !== 'Released' && i.status !== 'Matured')
    .map(i => daysToMaturity(i.maturityDate, currentDate))
    .filter(d => d >= 0)
    .sort((a, b) => a - b)[0] ?? null;

  // Form state
  const [form, setForm] = React.useState<OcrFormState>({
    bankName: 'State Bank of India',
    ifsc: 'SBIN0001203',
    instrumentNo: 'SBI20268899',
    amount: 35,
    issueDate: '2026-10-15',
    maturityDate: '2029-10-15',
    lienInFavourAicte: true,
    fileHash: `hash-inst-${Date.now()}`,
    confidences: {
      bankName: 98,
      ifsc: 96,
      instrumentNo: 94,
      amount: 95,
      issueDate: 92,
      maturityDate: 94,
      lienInFavourAicte: 99,
    },
    fieldModifiedByUser: {
      bankName: false,
      ifsc: false,
      instrumentNo: false,
      amount: false,
      issueDate: false,
      maturityDate: false,
      lienInFavourAicte: false,
    },
  });

  const loadSample = (type: 'genuine' | 'edited' | 'duplicate') => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      if (type === 'genuine') {
        const randNo = `SBI2026${Math.floor(1000 + Math.random() * 9000)}`;
        setForm({
          bankName: 'State Bank of India',
          ifsc: 'SBIN0001203',
          instrumentNo: randNo,
          amount: 40,
          issueDate: '2026-09-01',
          maturityDate: '2029-09-01',
          lienInFavourAicte: true,
          fileHash: `genuine-doc-hash-${Date.now()}`,
          pdfModifiedAfterCreation: false,
          imageTampered: false,
          confidences: {
            bankName: 98,
            ifsc: 96,
            instrumentNo: 94,
            amount: 95,
            issueDate: 95,
            maturityDate: 94,
            lienInFavourAicte: 99,
          },
          fieldModifiedByUser: {
            bankName: false,
            ifsc: false,
            instrumentNo: false,
            amount: false,
            issueDate: false,
            maturityDate: false,
            lienInFavourAicte: false,
          },
        });
        showToast('Genuine sample loaded with high OCR confidence.', 'success');
      } else if (type === 'edited') {
        setForm({
          bankName: 'Canara Bank',
          ifsc: 'CNRB0002034',
          instrumentNo: `CNR2026${Math.floor(1000 + Math.random() * 9000)}`,
          amount: 25,
          issueDate: '2026-10-20',
          maturityDate: '2025-05-15', // Error: maturity before issue!
          lienInFavourAicte: false,
          fileHash: `edited-pdf-hash-${Date.now()}`,
          pdfModifiedAfterCreation: true,
          imageTampered: true,
          confidences: {
            bankName: 92,
            ifsc: 91,
            instrumentNo: 89,
            amount: 76, // Low confidence!
            issueDate: 68, // Low confidence!
            maturityDate: 64, // Low confidence!
            lienInFavourAicte: 72,
          },
          fieldModifiedByUser: {
            bankName: false,
            ifsc: false,
            instrumentNo: false,
            amount: false,
            issueDate: false,
            maturityDate: false,
            lienInFavourAicte: false,
          },
        });
        showToast('Edited sample loaded: maturity before issue and PDF anomalies detected.', 'error');
      } else if (type === 'duplicate') {
        // Reuse an existing instrument number from another institution (e.g. fdr-001 or fdr-002)
        const targetOther = instruments.find(i => i.institutionId !== currentInstitution.id) || instruments[0];
        setForm({
          bankName: targetOther.bankName,
          ifsc: targetOther.ifsc,
          instrumentNo: targetOther.instrumentNo,
          amount: targetOther.amount,
          issueDate: targetOther.issueDate,
          maturityDate: targetOther.maturityDate,
          lienInFavourAicte: true,
          fileHash: targetOther.fileHash || `dup-hash-${Date.now()}`,
          pdfModifiedAfterCreation: false,
          imageTampered: false,
          confidences: {
            bankName: 96,
            ifsc: 95,
            instrumentNo: 97,
            amount: 94,
            issueDate: 92,
            maturityDate: 93,
            lienInFavourAicte: 98,
          },
          fieldModifiedByUser: {
            bankName: false,
            ifsc: false,
            instrumentNo: false,
            amount: false,
            issueDate: false,
            maturityDate: false,
            lienInFavourAicte: false,
          },
        });
        showToast(`Duplicate sample loaded: reuses instrument #${targetOther.instrumentNo}.`, 'info');
      }
      setStep(2);
    }, 2000);
  };

  const handleFieldChange = (field: keyof OcrFormState['fieldModifiedByUser'], value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
      fieldModifiedByUser: {
        ...prev.fieldModifiedByUser,
        [field]: true,
      },
    }));
  };

  const handleFinalSubmit = async () => {
    // Build fieldTrust: L0 if modified by user, L1 if untouched OCR
    const fieldTrust: Instrument['fieldTrust'] = {
      bank: form.fieldModifiedByUser.bankName ? ('L0' as TrustLevel) : ('L1' as TrustLevel),
      instrumentNo: form.fieldModifiedByUser.instrumentNo ? ('L0' as TrustLevel) : ('L1' as TrustLevel),
      amount: form.fieldModifiedByUser.amount ? ('L0' as TrustLevel) : ('L1' as TrustLevel),
      issueDate: form.fieldModifiedByUser.issueDate ? ('L0' as TrustLevel) : ('L1' as TrustLevel),
      maturityDate: form.fieldModifiedByUser.maturityDate ? ('L0' as TrustLevel) : ('L1' as TrustLevel),
      lien: form.fieldModifiedByUser.lienInFavourAicte ? ('L0' as TrustLevel) : ('L1' as TrustLevel),
    };

    const newInst: Instrument = {
      id: `fdr-${Date.now().toString().slice(-4)}`,
      institutionId: currentInstitution.id,
      bankName: form.bankName,
      ifsc: form.ifsc,
      instrumentNo: form.instrumentNo,
      amount: Number(form.amount),
      issueDate: form.issueDate,
      maturityDate: form.maturityDate,
      lienInFavourAicte: Boolean(form.lienInFavourAicte),
      status: 'Submitted',
      riskScore: 0,
      riskSignals: [],
      fieldTrust,
      fileHash: form.fileHash,
      pdfModifiedAfterCreation: form.pdfModifiedAfterCreation,
      imageTampered: form.imageTampered,
      hasAicteWording: Boolean(form.lienInFavourAicte),
      coverageRequired: 40,
    };

    // Calculate risk
    const { score, signals } = computeRisk(newInst, instruments);
    newInst.riskScore = score;
    newInst.riskSignals = signals;
    newInst.status = score >= 60 ? 'Flagged' : 'Under verification';

    await addInstrument(newInst, currentInstitution.contactEmail);
    const token = await createBankToken(newInst.id, currentInstitution.contactEmail);

    setCreatedInstrument(newInst);
    setGeneratedBankToken(token);
    setStep(4);
    showToast(
      `FDR submitted! Risk score: ${score} (${newInst.status}). Bank link generated.`,
      score >= 60 ? 'error' : 'success'
    );
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header & Institution Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <Building2 size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">Institution Portal</div>
            <h1 className="text-xl font-bold text-gray-900">{currentInstitution.name}</h1>
            <p className="text-xs text-gray-500">
              {currentInstitution.approvalNo} · {currentInstitution.state} ({currentInstitution.region})
            </p>
          </div>
        </div>

        {/* Institution Switcher for Demo */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-semibold whitespace-nowrap">Switch College:</label>
          <select
            value={selectedInstitutionId}
            onChange={e => setSelectedInstitutionId(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {institutions.map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.name} ({inst.state})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'portfolio'
              ? 'border-[#0072c6] text-[#0072c6]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          My Instruments Portfolio ({institutionInstruments.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('submit');
            setStep(1);
          }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'submit'
              ? 'border-[#0072c6] text-[#0072c6]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Sparkles size={14} className="text-amber-500" />
          Submit New FDR (Document AI)
        </button>
      </div>

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <div className="space-y-4">
          {/* Institutional Stats Banner */}
          <div className="bg-[#0b2e4f] text-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span>
                Your active FDRs:{' '}
                <strong className="text-amber-300 font-bold text-base">{activeCount}</strong>
              </span>
              <span className="text-blue-300 mx-2">|</span>
              <span>
                Next maturity:{' '}
                <strong className="text-amber-300 font-bold text-base">
                  {nextMaturityDays !== null ? `${nextMaturityDays} days` : 'None pending'}
                </strong>
              </span>
            </div>
            <button
              onClick={() => {
                setActiveTab('submit');
                setStep(1);
              }}
              className="bg-[#0072c6] hover:bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Upload size={14} /> Submit New FDR
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">FDR Number</th>
                  <th className="px-4 py-3">Bank & IFSC</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Maturity Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Trust Badges</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {institutionInstruments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No instruments on record for this institution. Submit one using Document AI.
                    </td>
                  </tr>
                ) : (
                  institutionInstruments.map(inst => {
                    const days = daysToMaturity(inst.maturityDate, currentDate);
                    return (
                      <tr key={inst.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-gray-900">
                          {maskInstrumentNo(inst.instrumentNo)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800">{inst.bankName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{inst.ifsc}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{formatINR(inst.amount)}</td>
                        <td className="px-4 py-3">
                          <div>{formatDate(inst.maturityDate)}</div>
                          {days >= 0 ? (
                            <span className={`text-[10px] font-semibold ${days <= 30 ? 'text-red-600' : 'text-gray-500'}`}>
                              ({days}d left)
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-semibold">(Matured)</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={inst.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <span title="Amount Trust">
                              <TrustBadge level={inst.fieldTrust.amount} />
                            </span>
                            <span title="Maturity Trust">
                              <TrustBadge level={inst.fieldTrust.maturityDate} />
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate(`/instruments/${inst.id}`)}
                            className="text-[#0072c6] hover:underline font-semibold"
                          >
                            View →
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

      {/* Submit Stepper Tab */}
      {activeTab === 'submit' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          {/* Stepper Header */}
          <div className="flex items-center justify-between max-w-2xl mx-auto border-b border-gray-100 pb-5">
            {[
              { num: 1, label: 'Upload & OCR' },
              { num: 2, label: 'Check Details' },
              { num: 3, label: 'Risk & Submit' },
              { num: 4, label: 'Bank Confirms' },
            ].map(s => (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    step === s.num
                      ? 'bg-[#0072c6] text-white'
                      : step > s.num
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:inline ${
                    step === s.num ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
                {s.num < 4 && <ChevronRight size={14} className="text-gray-300 mx-1 hidden sm:inline" />}
              </div>
            ))}
          </div>

          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-6 max-w-xl mx-auto text-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Upload Fixed Deposit Receipt</h2>
                <p className="text-xs text-gray-500 mt-1">
                  AICTE Document AI extracts security deposit particulars with automated tampering detection.
                </p>
              </div>

              {/* Dropzone */}
              <div
                onClick={() => loadSample('genuine')}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/70 p-8 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Upload size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">
                    Drag and drop FDR PDF / Scanned copy here
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Supports PDF, PNG, JPEG up to 10MB</div>
                </div>
              </div>

              {/* Scanning Animation */}
              {scanning && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-center gap-3 text-blue-800 text-xs font-semibold animate-pulse">
                  <Loader2 className="animate-spin text-blue-600" size={18} />
                  <span>Scanning with Document AI… analyzing security features, OCR text, and lien wording…</span>
                </div>
              )}

              {/* 3 Quick Sample Buttons */}
              <div className="pt-2">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Or test with pre-built demonstration samples:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    disabled={scanning}
                    onClick={() => loadSample('genuine')}
                    className="p-3 rounded-xl border border-green-200 bg-green-50/60 hover:bg-green-100 text-green-900 text-xs font-semibold transition-all text-left flex flex-col justify-between"
                  >
                    <span className="font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-green-600" /> Genuine FDR
                    </span>
                    <span className="text-[10px] text-green-700 mt-1">
                      Clean SBI certificate with verified AICTE lien clause.
                    </span>
                  </button>

                  <button
                    disabled={scanning}
                    onClick={() => loadSample('edited')}
                    className="p-3 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-900 text-xs font-semibold transition-all text-left flex flex-col justify-between"
                  >
                    <span className="font-bold flex items-center gap-1">
                      <AlertTriangle size={13} className="text-red-600" /> Edited FDR
                    </span>
                    <span className="text-[10px] text-red-700 mt-1">
                      PDF modified, maturity before issue date, low OCR confidence.
                    </span>
                  </button>

                  <button
                    disabled={scanning}
                    onClick={() => loadSample('duplicate')}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-all text-left flex flex-col justify-between"
                  >
                    <span className="font-bold flex items-center gap-1">
                      <Shield size={13} className="text-amber-600" /> Duplicate FDR
                    </span>
                    <span className="text-[10px] text-amber-700 mt-1">
                      Reuses instrument number already pledged by another institute.
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Check Details */}
          {step === 2 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Check Extracted Details</h2>
                  <p className="text-xs text-gray-500">
                    Fields with confidence &lt; 80% are highlighted with <span className="text-amber-600 font-bold">CHECK</span>.
                    Edited fields receive trust level L0; untouched OCR receives L1.
                  </p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-gray-500 hover:text-gray-800 underline"
                >
                  Change file
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bank Name */}
                <div
                  className={`p-3 rounded-xl border ${
                    form.confidences.bankName < 80 ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-semibold text-gray-700">Bank Name</label>
                    <span className="text-[10px] text-gray-500">
                      OCR: {form.confidences.bankName}%
                      {form.confidences.bankName < 80 && (
                        <span className="ml-1 text-amber-700 font-bold bg-amber-200 px-1 rounded">CHECK</span>
                      )}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={e => handleFieldChange('bankName', e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-gray-300 rounded-lg p-2"
                  />
                  <div className="text-[10px] text-gray-400 mt-1">
                    Trust:{' '}
                    <strong className="text-gray-700">
                      {form.fieldModifiedByUser.bankName ? 'L0 (Edited)' : 'L1 (Doc-checked)'}
                    </strong>
                  </div>
                </div>

                {/* IFSC */}
                <div
                  className={`p-3 rounded-xl border ${
                    form.confidences.ifsc < 80 ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-semibold text-gray-700">IFSC Code</label>
                    <span className="text-[10px] text-gray-500">
                      OCR: {form.confidences.ifsc}%
                      {form.confidences.ifsc < 80 && (
                        <span className="ml-1 text-amber-700 font-bold bg-amber-200 px-1 rounded">CHECK</span>
                      )}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={form.ifsc}
                    onChange={e => handleFieldChange('ifsc', e.target.value)}
                    className="w-full text-xs font-mono font-semibold bg-white border border-gray-300 rounded-lg p-2"
                  />
                  <div className="text-[10px] text-gray-400 mt-1">
                    Trust:{' '}
                    <strong className="text-gray-700">
                      {form.fieldModifiedByUser.ifsc ? 'L0 (Edited)' : 'L1 (Doc-checked)'}
                    </strong>
                  </div>
                </div>

                {/* Instrument Number */}
                <div
                  className={`p-3 rounded-xl border ${
                    form.confidences.instrumentNo < 80 ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-semibold text-gray-700">FDR Instrument No.</label>
                    <span className="text-[10px] text-gray-500">
                      OCR: {form.confidences.instrumentNo}%
                      {form.confidences.instrumentNo < 80 && (
                        <span className="ml-1 text-amber-700 font-bold bg-amber-200 px-1 rounded">CHECK</span>
                      )}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={form.instrumentNo}
                    onChange={e => handleFieldChange('instrumentNo', e.target.value)}
                    className="w-full text-xs font-mono font-semibold bg-white border border-gray-300 rounded-lg p-2"
                  />
                  <div className="text-[10px] text-gray-400 mt-1">
                    Trust:{' '}
                    <strong className="text-gray-700">
                      {form.fieldModifiedByUser.instrumentNo ? 'L0 (Edited)' : 'L1 (Doc-checked)'}
                    </strong>
                  </div>
                </div>

                {/* Amount */}
                <div
                  className={`p-3 rounded-xl border ${
                    form.confidences.amount < 80 ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-semibold text-gray-700">Amount (₹ Lakhs)</label>
                    <span className="text-[10px] text-gray-500">
                      OCR: {form.confidences.amount}%
                      {form.confidences.amount < 80 && (
                        <span className="ml-1 text-amber-700 font-bold bg-amber-200 px-1 rounded">CHECK</span>
                      )}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => handleFieldChange('amount', Number(e.target.value))}
                    className="w-full text-xs font-semibold bg-white border border-gray-300 rounded-lg p-2"
                  />
                  <div className="text-[10px] text-gray-400 mt-1">
                    Trust:{' '}
                    <strong className="text-gray-700">
                      {form.fieldModifiedByUser.amount ? 'L0 (Edited)' : 'L1 (Doc-checked)'}
                    </strong>
                  </div>
                </div>

                {/* Issue Date */}
                <div
                  className={`p-3 rounded-xl border ${
                    form.confidences.issueDate < 80 ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-semibold text-gray-700">Issue Date</label>
                    <span className="text-[10px] text-gray-500">
                      OCR: {form.confidences.issueDate}%
                      {form.confidences.issueDate < 80 && (
                        <span className="ml-1 text-amber-700 font-bold bg-amber-200 px-1 rounded">CHECK</span>
                      )}
                    </span>
                  </div>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={e => handleFieldChange('issueDate', e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-gray-300 rounded-lg p-2"
                  />
                  <div className="text-[10px] text-gray-400 mt-1">
                    Trust:{' '}
                    <strong className="text-gray-700">
                      {form.fieldModifiedByUser.issueDate ? 'L0 (Edited)' : 'L1 (Doc-checked)'}
                    </strong>
                  </div>
                </div>

                {/* Maturity Date */}
                <div
                  className={`p-3 rounded-xl border ${
                    form.confidences.maturityDate < 80 ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-semibold text-gray-700">Maturity Date</label>
                    <span className="text-[10px] text-gray-500">
                      OCR: {form.confidences.maturityDate}%
                      {form.confidences.maturityDate < 80 && (
                        <span className="ml-1 text-amber-700 font-bold bg-amber-200 px-1 rounded">CHECK</span>
                      )}
                    </span>
                  </div>
                  <input
                    type="date"
                    value={form.maturityDate}
                    onChange={e => handleFieldChange('maturityDate', e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-gray-300 rounded-lg p-2"
                  />
                  <div className="text-[10px] text-gray-400 mt-1">
                    Trust:{' '}
                    <strong className="text-gray-700">
                      {form.fieldModifiedByUser.maturityDate ? 'L0 (Edited)' : 'L1 (Doc-checked)'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Lien wording checkbox */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  form.confidences.lienInFavourAicte < 80 ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-gray-800">
                    Lien in favour of AICTE explicitly stated in certificate
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Document AI matched clause: &quot;Pledged in favour of Member Secretary, AICTE&quot;
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.lienInFavourAicte}
                  onChange={e => handleFieldChange('lienInFavourAicte', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-5 py-2 text-xs font-bold bg-[#0072c6] hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  Continue to Risk Analysis →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Risk Check & Final Submit */}
          {step === 3 && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div>
                <h2 className="text-base font-bold text-gray-900">Pre-Submission Fraud Guard Scan</h2>
                <p className="text-xs text-gray-500">
                  Sentinel runs the 9 risk signal tests in real time before creating the instrument.
                </p>
              </div>

              {/* Live Risk Evaluation */}
              {(() => {
                const draftInst: Instrument = {
                  id: 'temp-preview',
                  institutionId: currentInstitution.id,
                  bankName: form.bankName,
                  ifsc: form.ifsc,
                  instrumentNo: form.instrumentNo,
                  amount: Number(form.amount),
                  issueDate: form.issueDate,
                  maturityDate: form.maturityDate,
                  lienInFavourAicte: Boolean(form.lienInFavourAicte),
                  status: 'Draft',
                  riskScore: 0,
                  riskSignals: [],
                  fieldTrust: {
                    bank: form.fieldModifiedByUser.bankName ? 'L0' : 'L1',
                    instrumentNo: form.fieldModifiedByUser.instrumentNo ? 'L0' : 'L1',
                    amount: form.fieldModifiedByUser.amount ? 'L0' : 'L1',
                    issueDate: form.fieldModifiedByUser.issueDate ? 'L0' : 'L1',
                    maturityDate: form.fieldModifiedByUser.maturityDate ? 'L0' : 'L1',
                    lien: form.fieldModifiedByUser.lienInFavourAicte ? 'L0' : 'L1',
                  },
                  fileHash: form.fileHash,
                  pdfModifiedAfterCreation: form.pdfModifiedAfterCreation,
                  imageTampered: form.imageTampered,
                  hasAicteWording: Boolean(form.lienInFavourAicte),
                  coverageRequired: 40,
                };
                const { score, signals } = computeRisk(draftInst, instruments);
                const band = getRiskBand(score);
                const triggered = signals.filter(s => s.triggered);

                return (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-xl border flex items-center justify-between ${
                        band === 'high'
                          ? 'bg-red-50 border-red-200'
                          : band === 'medium'
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-gray-600 uppercase">Fraud Guard Risk Score</div>
                        <div className="text-2xl font-black text-gray-900">{score} / 100</div>
                        <div className="text-xs font-semibold mt-0.5">
                          {score >= 60 ? (
                            <span className="text-red-700">Flagged for In-Depth Officer Review</span>
                          ) : (
                            <span className="text-green-700">Eligible for Auto-checked Verification</span>
                          )}
                        </div>
                      </div>
                      <RiskBadge score={score} band={band} />
                    </div>

                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                      <div className="text-xs font-bold text-gray-700 mb-2">Triggered Risk Signals ({triggered.length}):</div>
                      {triggered.length === 0 ? (
                        <div className="text-xs text-green-700 flex items-center gap-1.5 font-medium">
                          <CheckCircle2 size={14} /> Zero fraud signals detected. Clean document.
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {triggered.map(s => (
                            <div
                              key={s.label}
                              className="text-xs bg-red-100/60 border border-red-200 text-red-800 p-2 rounded-lg flex items-center justify-between"
                            >
                              <span>⚠ {s.label}</span>
                              <span className="font-bold">+{s.weight}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => setStep(2)}
                        className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        ← Back to Details
                      </button>
                      <button
                        onClick={handleFinalSubmit}
                        className="px-6 py-2.5 text-xs font-bold bg-[#0072c6] hover:bg-blue-600 text-white rounded-lg shadow transition-colors flex items-center gap-1.5"
                      >
                        <Send size={13} /> Confirm & Submit to AICTE
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Step 4: Bank Confirms */}
          {step === 4 && createdInstrument && (
            <div className="space-y-5 max-w-xl mx-auto text-center py-4">
              <div className="w-14 h-14 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Instrument Submitted to AICTE</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Instrument <span className="font-mono font-bold text-gray-800">#{createdInstrument.instrumentNo}</span>{' '}
                  has been recorded in the tamper-evident audit chain.
                </p>
              </div>

              {/* Bank Confirmation Link Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Bank Nodal Officer Confirmation Pending (L2)
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  A secure, one-time confirmation token has been dispatched to {createdInstrument.bankName}.
                  Until confirmed by the bank, fields remain at L1 Doc-checked trust.
                </p>

                <div className="bg-white border border-amber-200 p-2.5 rounded-lg text-xs font-mono break-all text-gray-700">
                  http://localhost:5173/bank/{generatedBankToken}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      if (generatedBankToken) {
                        navigate(`/bank/${generatedBankToken}`);
                      }
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink size={14} /> Open Bank Confirmation Page (Demo)
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('portfolio');
                      setStep(1);
                    }}
                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-3 rounded-lg text-xs transition-colors"
                  >
                    Return to Portfolio
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
