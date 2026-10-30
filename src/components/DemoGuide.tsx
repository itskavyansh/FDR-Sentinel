import React from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import type { Role } from '../types';
import {
  Compass,
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useToast, Toast } from './Toast';

interface DemoStep {
  num: number;
  title: string;
  desc: string;
  targetRoute: string;
  targetRole: Role;
}

export default function DemoGuide() {
  const { role, setRole, loadDemoScenario } = useStore();
  const navigate = useNavigate();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [expanded, setExpanded] = React.useState(false);
  const [completedSteps, setCompletedSteps] = React.useState<number[]>([]);

  const steps: DemoStep[] = [
    {
      num: 1,
      title: 'Institution uploads genuine FDR',
      desc: 'Test Document AI OCR scan, field confidences, and clean status.',
      targetRoute: '/institution',
      targetRole: 'Institution',
    },
    {
      num: 2,
      title: 'Upload edited & duplicate FDRs',
      desc: 'Verify Fraud Guard triggers: PDF modified, duplicate number, maturity before issue.',
      targetRoute: '/institution',
      targetRole: 'Institution',
    },
    {
      num: 3,
      title: 'Bank page: Confirm & Flag mismatch',
      desc: 'Open /bank/:token. Confirm one FDR (L2) and flag discrepancy (+50 risk).',
      targetRoute: '/bank/tok-fdr019-demo',
      targetRole: 'Bank',
    },
    {
      num: 4,
      title: 'Time Machine +60d & Renewal Link',
      desc: 'Advance clock by 60 days, see maturity alerts, detect gap, and link replacement FDR.',
      targetRoute: '/radar',
      targetRole: 'Officer',
    },
    {
      num: 5,
      title: '3-Tier Release & E-Signed Letter',
      desc: 'Maker scrutiny -> Checker concurrence -> Approver e-sign. Block rel-002 failure.',
      targetRoute: '/releases',
      targetRole: 'Officer',
    },
    {
      num: 6,
      title: 'Audit: Verify chain & Simulate tamper',
      desc: 'Run SHA-256 chain verification. Tamper event #3 silently, verify detection, repair.',
      targetRoute: '/audit',
      targetRole: 'Auditor',
    },
    {
      num: 7,
      title: 'Ask Sentinel Natural Language Query',
      desc: 'Search: "FDRs maturing in the next 30 days above 10 lakh in Delhi" without LLM leak.',
      targetRoute: '/',
      targetRole: 'Officer',
    },
    {
      num: 8,
      title: 'Dashboard & Before vs After Impact',
      desc: 'Inspect live KPI derivation and 5 core transformation measures in Reports.',
      targetRoute: '/reports',
      targetRole: 'Officer',
    },
  ];

  const handleGo = (step: DemoStep) => {
    setRole(step.targetRole);
    navigate(step.targetRoute);
    if (!completedSteps.includes(step.num)) {
      setCompletedSteps([...completedSteps, step.num]);
    }
    showToast(`Switched to ${step.targetRole} role and opened ${step.targetRoute}`, 'info');
  };

  const handleResetScenario = () => {
    loadDemoScenario();
    setCompletedSteps([]);
    navigate('/');
    setRole('Officer');
    showToast('Demo scenario loaded! Baseline clock set to 2026-10-30 with all 8 demo test cases.', 'success');
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="fixed bottom-4 left-4 z-50 max-w-sm w-full">
        <div className="bg-[#0b2e4f] text-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden backdrop-blur-md">
          {/* Header Bar */}
          <div
            onClick={() => setExpanded(e => !e)}
            className="p-3 px-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors select-none"
          >
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-amber-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-amber-300">
                8-Step Demo Script Guide
              </span>
              <span className="bg-white/20 text-blue-100 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {completedSteps.length}/8 Done
              </span>
            </div>
            {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>

          {/* Expanded Step List */}
          {expanded && (
            <div className="p-3 pt-0 max-h-80 overflow-y-auto space-y-2 text-xs border-t border-white/10">
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] text-gray-300">Smart India Hackathon Walkthrough:</span>
                <button
                  onClick={handleResetScenario}
                  className="bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1 shadow-sm transition-colors"
                >
                  <RotateCcw size={10} /> Load Demo Scenario
                </button>
              </div>

              <div className="space-y-1.5">
                {steps.map(s => {
                  const isDone = completedSteps.includes(s.num);
                  return (
                    <div
                      key={s.num}
                      className={`p-2 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                        isDone
                          ? 'bg-green-950/40 border-green-700/60 text-green-200'
                          : 'bg-white/10 border-white/10 text-white'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] leading-tight">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                              isDone ? 'bg-green-500 text-white font-black' : 'bg-blue-600 text-white'
                            }`}
                          >
                            {isDone ? '✓' : s.num}
                          </span>
                          <span className="truncate">{s.title}</span>
                        </div>
                        <p className="text-[10px] text-gray-300 mt-1 line-clamp-2 leading-snug">
                          {s.desc}
                        </p>
                      </div>

                      <button
                        onClick={() => handleGo(s)}
                        className="bg-[#0072c6] hover:bg-blue-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1 flex-shrink-0 shadow transition-colors"
                      >
                        <Play size={10} fill="white" /> Go
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
