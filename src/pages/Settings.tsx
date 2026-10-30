import React from 'react';
import { useStore } from '../store/useStore';
import { Toast, useToast } from '../components/Toast';
import {
  Sliders,
  Shield,
  Users,
  RotateCcw,
  CheckCircle2,
  Clock,
  Save,
  Key,
} from 'lucide-react';

interface FakeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  mfaEnabled: boolean;
  lastActive: string;
}

export default function Settings() {
  const {
    schedulerConfig,
    updateSchedulerConfig,
    fraudWeights,
    updateFraudWeights,
    riskBandThresholds,
    updateRiskBandThresholds,
    currentDate,
    advanceClockDays,
    resetDemo,
  } = useStore();
  const { toast, show: showToast, hide: hideToast } = useToast();

  // Local form state
  const [coverageReq, setCoverageReq] = React.useState(schedulerConfig.defaultCoverageRequired);
  const [weights, setWeights] = React.useState({ ...fraudWeights });
  const [bands, setBands] = React.useState({ ...riskBandThresholds });

  // Users table state
  const [users, setUsers] = React.useState<FakeUser[]>([
    {
      id: 'usr-1',
      name: 'R. K. Kumar',
      email: 'officer.kumar@aicte.gov.in',
      role: 'AICTE Officer',
      mfaEnabled: true,
      lastActive: 'Just now',
    },
    {
      id: 'usr-2',
      name: 'Dr. Suresh Sharma',
      email: 'suresh.sharma@ditm.edu.in',
      role: 'Institution Principal',
      mfaEnabled: true,
      lastActive: '2 hours ago',
    },
    {
      id: 'usr-3',
      name: 'V. Ramanathan',
      email: 'nodal.fdr@sbi.co.in',
      role: 'Bank Nodal Officer',
      mfaEnabled: false,
      lastActive: 'Yesterday',
    },
    {
      id: 'usr-4',
      name: 'Priyanka Sen',
      email: 'cag.auditor@cag.gov.in',
      role: 'Auditor',
      mfaEnabled: true,
      lastActive: '3 days ago',
    },
    {
      id: 'usr-5',
      name: 'Sentinel System Admin',
      email: 'admin.sentinel@aicte.gov.in',
      role: 'Administrator',
      mfaEnabled: true,
      lastActive: 'Active now',
    },
  ]);

  const toggleMfa = (id: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, mfaEnabled: !u.mfaEnabled } : u))
    );
    showToast('User 2-Factor Authentication state toggled.', 'info');
  };

  const handleSaveThresholds = () => {
    updateSchedulerConfig({ defaultCoverageRequired: Number(coverageReq) });
    updateRiskBandThresholds(bands);
    showToast('System rules & risk band thresholds updated successfully.', 'success');
  };

  const handleSaveWeights = () => {
    updateFraudWeights(weights);
    showToast('Fraud Guard signal weights updated. Risk scores re-evaluate dynamically.', 'success');
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">System Configuration & Administration</h1>
          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded font-bold">
            Admin Role Only
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Tune AICTE statutory deposit thresholds, Fraud Guard scoring weights, and manage demo simulation state.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Section 1: Rule Thresholds */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Sliders size={16} className="text-[#0072c6]" />
              AICTE Statutory Thresholds & Cutoffs
            </h2>
            <button
              onClick={handleSaveThresholds}
              className="px-3 py-1.5 bg-[#0072c6] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
            >
              <Save size={13} /> Save Thresholds
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Required Statutory Deposit Amount per Institution (₹ Lakhs):
              </label>
              <input
                type="number"
                value={coverageReq}
                onChange={e => setCoverageReq(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg font-bold text-gray-900"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">
                Institutions whose total active deposit falls below this amount are flagged for Coverage Gap Risk.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  High Risk Score Cutoff (▲ Flagged):
                </label>
                <input
                  type="number"
                  value={bands.high}
                  onChange={e => setBands({ ...bands, high: Number(e.target.value) })}
                  className="w-full p-2 border border-red-200 bg-red-50/50 rounded-lg font-bold text-red-900"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Medium Risk Score Cutoff (● Warning):
                </label>
                <input
                  type="number"
                  value={bands.medium}
                  onChange={e => setBands({ ...bands, medium: Number(e.target.value) })}
                  className="w-full p-2 border border-amber-200 bg-amber-50/50 rounded-lg font-bold text-amber-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Demo Clock & Reset */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock size={16} className="text-amber-500" />
              Demo Simulation Clock & Reset
            </h2>
            <button
              onClick={() => {
                if (confirm('Reset demo data and restore initial clock (2026-10-30)?')) {
                  resetDemo();
                  showToast('Demo data and clock reset to seed state.', 'info');
                }
              }}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            >
              <RotateCcw size={13} /> Reset Demo Data
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-gray-600 font-medium">Active Virtual Calendar Clock:</span>
              <span className="font-mono text-base font-bold text-[#0b2e4f] bg-white px-3 py-1 rounded-lg border border-gray-300">
                {currentDate}
              </span>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1.5">
                Time Machine Fast Forward Controls:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[7, 30, 60, 90].map(days => (
                  <button
                    key={days}
                    onClick={async () => {
                      const res = await advanceClockDays(days);
                      showToast(
                        `Clock moved +${days} days. ${res.alertsFired} alert(s) fired, ${res.instrumentsMatured} instrument(s) matured.`,
                        res.alertsFired > 0 ? 'info' : 'success'
                      );
                    }}
                    className="py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0072c6] border border-blue-200 font-bold text-xs transition-colors"
                  >
                    +{days} Days
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Fraud Guard Weights Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Shield size={16} className="text-red-500" />
              Fraud Guard Signal Weights Table (Editable)
            </h2>
            <p className="text-xs text-gray-400">
              Changes instantly update risk scoring calculations across all instruments.
            </p>
          </div>
          <button
            onClick={handleSaveWeights}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
          >
            <Save size={13} /> Update Weights
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            { key: 'duplicateInstrumentNo', label: 'Duplicate Instrument Number' },
            { key: 'sameFileHash', label: 'Duplicate File Hash (Same PDF)' },
            { key: 'maturityNotAfterIssueOrOddTenure', label: 'Maturity Not After Issue / Odd Tenure' },
            { key: 'ifscBankMismatch', label: 'IFSC Prefix vs Bank Mismatch' },
            { key: 'amountBelowRequirement', label: 'Amount Below AICTE Requirement' },
            { key: 'pdfModifiedAfterCreation', label: 'PDF Modified After Creation Date' },
            { key: 'imageTamper', label: 'Image Tampering Detected' },
            { key: 'noAicteWording', label: 'Missing AICTE Lien Clause' },
            { key: 'bankMismatch', label: 'Bank Mismatch (Portal Reported)' },
          ].map(sig => (
            <div
              key={sig.key}
              className="p-3 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between gap-2"
            >
              <span className="font-semibold text-gray-800 leading-tight">{sig.label}</span>
              <input
                type="number"
                value={(weights as any)[sig.key] ?? 10}
                onChange={e =>
                  setWeights({ ...weights, [sig.key]: Number(e.target.value) })
                }
                className="w-16 p-1.5 border border-gray-300 rounded font-bold text-right text-gray-900 bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Users & Roles Table (Cosmetic Demo) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Users size={16} className="text-[#0072c6]" />
              Authorized Portal Users & Access Control
            </h2>
            <p className="text-xs text-gray-400">
              Demo role mappings, access scopes, and multi-factor authentication (MFA) enforcement.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">2-Factor Auth (MFA)</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-bold text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-[#0072c6] px-2 py-0.5 rounded font-semibold text-[11px]">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.mfaEnabled ? (
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        ✓ Enabled
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{u.lastActive}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleMfa(u.id)}
                      className="text-[#0072c6] font-semibold hover:underline"
                    >
                      Toggle MFA
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
