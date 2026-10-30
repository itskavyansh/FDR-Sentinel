import React from 'react';
import { useStore } from '../store/useStore';
import { formatDate, formatINR, maskInstrumentNo, daysToMaturity } from '../lib/dates';
import { getRiskBand } from '../lib/fraud';
import {
  FileText,
  Download,
  Printer,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function Reports() {
  const { instruments, institutions, alerts, releaseRequests, currentDate } = useStore();
  const [selectedReport, setSelectedReport] = React.useState<
    'pipeline' | 'verifications' | 'gaps' | 'flagged' | 'released' | 'alerts'
  >('pipeline');

  // Export CSV helper
  const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}-${currentDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Maturity Pipeline Data
  const pipelineRows = instruments
    .filter(i => i.status !== 'Released')
    .map(i => {
      const inst = institutions.find(c => c.id === i.institutionId);
      const days = daysToMaturity(i.maturityDate, currentDate);
      return {
        instrumentNo: maskInstrumentNo(i.instrumentNo),
        institution: inst?.name || '',
        state: inst?.state || '',
        bankName: i.bankName,
        amount: i.amount,
        maturityDate: formatDate(i.maturityDate),
        daysLeft: days,
        status: i.status,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // 2. Pending verifications
  const verificationRows = instruments
    .filter(i => i.status === 'Flagged' || i.status === 'Under verification')
    .map(i => {
      const inst = institutions.find(c => c.id === i.institutionId);
      return {
        instrumentNo: maskInstrumentNo(i.instrumentNo),
        institution: inst?.name || '',
        bankName: i.bankName,
        amount: i.amount,
        riskScore: i.riskScore,
        status: i.status,
        owner: i.riskScore > 60 ? 'Bureau Head / Officer' : 'Scrutiny Officer',
        age: `${Math.floor(5 + Math.random() * 15)} days`,
      };
    });

  // 3. Coverage Gaps
  const gapRows = institutions
    .map(inst => {
      const instInstruments = instruments.filter(
        i => i.institutionId === inst.id && i.status !== 'Released' && i.status !== 'Matured'
      );
      const covered = instInstruments.reduce((s, i) => s + i.amount, 0);
      const req = 40;
      const deficit = Math.max(0, req - covered);
      return {
        institution: inst.name,
        state: inst.state,
        covered,
        required: req,
        deficit,
        isGap: deficit > 0,
      };
    })
    .filter(g => g.isGap);

  // 4. Fraud Guard Flagged
  const flaggedRows = instruments
    .filter(i => i.status === 'Flagged')
    .map(i => {
      const inst = institutions.find(c => c.id === i.institutionId);
      return {
        instrumentNo: maskInstrumentNo(i.instrumentNo),
        institution: inst?.name || '',
        bank: i.bankName,
        amount: i.amount,
        riskScore: i.riskScore,
        signals: i.riskSignals.filter(s => s.triggered).map(s => s.label).join('; ') || 'High Risk Anomaly',
      };
    });

  // 5. Released
  const releasedRows = instruments
    .filter(i => i.status === 'Released')
    .map(i => {
      const inst = institutions.find(c => c.id === i.institutionId);
      return {
        instrumentNo: maskInstrumentNo(i.instrumentNo),
        institution: inst?.name || '',
        bank: i.bankName,
        amount: i.amount,
        releaseDate: formatDate(i.maturityDate),
        status: i.status,
      };
    });

  // 6. Alerts Summary
  const alertRows = alerts.map(a => {
    const inst = instruments.find(i => i.id === a.instrumentId);
    return {
      id: a.id,
      stage: a.stage,
      instrument: inst ? maskInstrumentNo(inst.instrumentNo) : a.instrumentId,
      recipient: a.recipientRole,
      date: a.date,
      message: a.message,
    };
  });

  const handleExportCSV = () => {
    if (selectedReport === 'pipeline') {
      exportCSV(
        'AICTE-Maturity-Pipeline',
        ['FDR Number', 'Institution', 'State', 'Bank', 'Amount (Lakhs)', 'Maturity Date', 'Days Left', 'Status'],
        pipelineRows.map(r => [r.instrumentNo, r.institution, r.state, r.bankName, r.amount, r.maturityDate, r.daysLeft, r.status])
      );
    } else if (selectedReport === 'verifications') {
      exportCSV(
        'AICTE-Pending-Verifications',
        ['FDR Number', 'Institution', 'Bank', 'Amount (Lakhs)', 'Risk Score', 'Status', 'Owner', 'Age'],
        verificationRows.map(r => [r.instrumentNo, r.institution, r.bankName, r.amount, r.riskScore, r.status, r.owner, r.age])
      );
    } else if (selectedReport === 'gaps') {
      exportCSV(
        'AICTE-Coverage-Gaps',
        ['Institution', 'State', 'Covered (Lakhs)', 'Required (Lakhs)', 'Deficit (Lakhs)'],
        gapRows.map(r => [r.institution, r.state, r.covered, r.required, r.deficit])
      );
    } else if (selectedReport === 'flagged') {
      exportCSV(
        'AICTE-Fraud-Flagged-Cases',
        ['FDR Number', 'Institution', 'Bank', 'Amount (Lakhs)', 'Risk Score', 'Triggered Signals'],
        flaggedRows.map(r => [r.instrumentNo, r.institution, r.bank, r.amount, r.riskScore, r.signals])
      );
    } else if (selectedReport === 'released') {
      exportCSV(
        'AICTE-Released-Instruments',
        ['FDR Number', 'Institution', 'Bank', 'Amount (Lakhs)', 'Date', 'Status'],
        releasedRows.map(r => [r.instrumentNo, r.institution, r.bank, r.amount, r.releaseDate, r.status])
      );
    } else if (selectedReport === 'alerts') {
      exportCSV(
        'AICTE-Maturity-Alerts',
        ['Alert ID', 'Stage', 'FDR', 'Recipient', 'Date', 'Message'],
        alertRows.map(r => [r.id, r.stage, r.instrument, r.recipient, r.date, r.message])
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Governance & Intelligence Reports</h1>
            <span className="bg-blue-100 text-[#0072c6] text-xs px-2 py-0.5 rounded font-bold">
              Clock: {currentDate}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Automated statutory compliance tables, printable executive briefs, and before-vs-after impact metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-[#0072c6] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5"
          >
            <Printer size={13} /> Export PDF / Print
          </button>
        </div>
      </div>

      {/* 5 Problem Measures: Before vs After Panel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={16} className="text-[#0072c6]" />
              5 Core Impact Measures — Traditional Manual vs FDR Sentinel
            </h2>
            <p className="text-xs text-gray-400">
              Quantitative comparison of security deposit management efficiency and fraud prevention.
            </p>
          </div>
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
            Illustrative demo values included
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {/* Measure 1 */}
          <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2">
            <div className="font-bold text-gray-700">1. Record Accuracy</div>
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-gray-400 line-through">68% Manual</span>
              <span className="text-base font-bold text-green-700">96.8%</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">
              Document AI automated OCR field extraction with confidence scores & tamper signals.
            </p>
          </div>

          {/* Measure 2 */}
          <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2">
            <div className="font-bold text-gray-700">2. Verification Turnaround</div>
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-gray-400 line-through">14–21 Days</span>
              <span className="text-base font-bold text-blue-700">&lt; 5 Mins</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">
              One-click secure bank nodal OTP link (L2) replaces physical postal confirmation letters.
            </p>
          </div>

          {/* Measure 3 */}
          <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2">
            <div className="font-bold text-gray-700">3. Renewal Timeliness</div>
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-gray-400 line-through">Unmonitored</span>
              <span className="text-base font-bold text-amber-700">{alerts.length} Alerts Active</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">
              Statutory schedule T-90, T-60, T-30, T-15, T-7 escalation to bureau heads prior to maturity.
            </p>
          </div>

          {/* Measure 4 */}
          <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2">
            <div className="font-bold text-gray-700">4. Manual Administrative Effort</div>
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-gray-400 line-through">24 Steps / Case</span>
              <span className="text-base font-bold text-indigo-700">3 Click Flow</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">
              Digital 3-tier Maker-Checker-Approver release with cryptographic e-signed letters.
            </p>
          </div>

          {/* Measure 5 */}
          <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2">
            <div className="font-bold text-gray-700">5. Pending Case Visibility</div>
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-gray-400 line-through">Opaque Folders</span>
              <span className="text-base font-bold text-red-700">
                {instruments.filter(i => i.status === 'Flagged').length} Flagged Live
              </span>
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">
              Risk-ranked queue with age, owner, and real-time coverage gap deficit detection.
            </p>
          </div>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {[
          { key: 'pipeline', label: `Maturity Pipeline (${pipelineRows.length})` },
          { key: 'verifications', label: `Pending Verifications (${verificationRows.length})` },
          { key: 'gaps', label: `Coverage Gaps (${gapRows.length})` },
          { key: 'flagged', label: `Flagged Fraud Cases (${flaggedRows.length})` },
          { key: 'released', label: `Released Instruments (${releasedRows.length})` },
          { key: 'alerts', label: `Active Scheduler Alerts (${alertRows.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedReport(tab.key as any)}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${
              selectedReport === tab.key
                ? 'border-[#0072c6] text-[#0072c6]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Report Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {selectedReport === 'pipeline' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">FDR Number</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Bank</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Maturity Date</th>
                  <th className="px-4 py-3">Days Left</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pipelineRows.map((r, i) => (
                  <tr key={i} className="hover:bg-blue-50/40">
                    <td className="px-4 py-2.5 font-mono font-bold text-gray-900">{r.instrumentNo}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{r.institution}</td>
                    <td className="px-4 py-2.5 text-gray-600">{r.bankName}</td>
                    <td className="px-4 py-2.5 font-bold text-gray-900">{formatINR(r.amount)}</td>
                    <td className="px-4 py-2.5">{r.maturityDate}</td>
                    <td className="px-4 py-2.5 font-semibold">
                      {r.daysLeft < 0 ? `${Math.abs(r.daysLeft)}d overdue` : `${r.daysLeft}d`}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'verifications' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">FDR Number</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Bank</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">Assigned Owner</th>
                  <th className="px-4 py-3">Case Age</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {verificationRows.map((r, i) => (
                  <tr key={i} className="hover:bg-blue-50/40">
                    <td className="px-4 py-2.5 font-mono font-bold">{r.instrumentNo}</td>
                    <td className="px-4 py-2.5 font-medium">{r.institution}</td>
                    <td className="px-4 py-2.5">{r.bankName}</td>
                    <td className="px-4 py-2.5 font-bold">{formatINR(r.amount)}</td>
                    <td className="px-4 py-2.5 font-bold text-red-600">▲ {r.riskScore}</td>
                    <td className="px-4 py-2.5 font-semibold text-[#0072c6]">{r.owner}</td>
                    <td className="px-4 py-2.5 text-gray-500">{r.age}</td>
                    <td className="px-4 py-2.5">
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'gaps' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Current Pledged Deposit</th>
                  <th className="px-4 py-3">AICTE Required Deposit</th>
                  <th className="px-4 py-3">Deficit / Coverage Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gapRows.map((r, i) => (
                  <tr key={i} className="hover:bg-red-50/40 bg-red-50/20">
                    <td className="px-4 py-2.5 font-bold text-gray-900">{r.institution}</td>
                    <td className="px-4 py-2.5 text-gray-600">{r.state}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">₹{r.covered} Lakhs</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">₹{r.required} Lakhs</td>
                    <td className="px-4 py-2.5 font-bold text-red-700">₹{r.deficit} Lakhs Shortfall</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'flagged' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">FDR Number</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Bank</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">Triggered Fraud Guard Signals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {flaggedRows.map((r, i) => (
                  <tr key={i} className="hover:bg-red-50/40 bg-red-50/20">
                    <td className="px-4 py-2.5 font-mono font-bold text-red-900">{r.instrumentNo}</td>
                    <td className="px-4 py-2.5 font-medium">{r.institution}</td>
                    <td className="px-4 py-2.5">{r.bank}</td>
                    <td className="px-4 py-2.5 font-bold">{formatINR(r.amount)}</td>
                    <td className="px-4 py-2.5 font-black text-red-700">▲ {r.riskScore}</td>
                    <td className="px-4 py-2.5 text-red-800 font-medium">{r.signals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'released' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">FDR Number</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Bank</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Release Order Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {releasedRows.map((r, i) => (
                  <tr key={i} className="hover:bg-blue-50/40">
                    <td className="px-4 py-2.5 font-mono font-bold">{r.instrumentNo}</td>
                    <td className="px-4 py-2.5 font-medium">{r.institution}</td>
                    <td className="px-4 py-2.5">{r.bank}</td>
                    <td className="px-4 py-2.5 font-bold">{formatINR(r.amount)}</td>
                    <td className="px-4 py-2.5">{r.releaseDate}</td>
                    <td className="px-4 py-2.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'alerts' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Alert ID</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Target FDR</th>
                  <th className="px-4 py-3">Recipient Role</th>
                  <th className="px-4 py-3">Date Dispatched</th>
                  <th className="px-4 py-3">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alertRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                      No scheduler alerts have triggered yet at current date ({currentDate}). Advance Time Machine to trigger notices.
                    </td>
                  </tr>
                ) : (
                  alertRows.map((r, i) => (
                    <tr key={i} className="hover:bg-blue-50/40">
                      <td className="px-4 py-2.5 font-mono text-gray-500">{r.id}</td>
                      <td className="px-4 py-2.5 font-bold text-red-600">{r.stage}</td>
                      <td className="px-4 py-2.5 font-mono font-bold">{r.instrument}</td>
                      <td className="px-4 py-2.5 font-semibold text-[#0072c6]">{r.recipient}</td>
                      <td className="px-4 py-2.5 font-mono text-gray-500">{r.date}</td>
                      <td className="px-4 py-2.5 text-gray-700">{r.message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
