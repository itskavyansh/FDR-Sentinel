import React from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { RotateCcw, Clock } from 'lucide-react';
import { useToast, Toast } from './Toast';

export default function TimeMachine() {
  const { currentDate, advanceClockDays, resetClock } = useStore();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const location = useLocation();

  // Show only on time-sensitive governance pages:
  // Dashboard (/), Maturity Radar (/radar), and Reports (/reports)
  const allowedPaths = ['/', '/radar', '/reports'];
  if (!allowedPaths.includes(location.pathname)) {
    return null;
  }

  const handleAdvance = async (days: number) => {
    setLoading(true);
    const res = await advanceClockDays(days);
    showToast(
      `⏱ Clock moved +${days} days to ${useStore.getState().currentDate}. ${res.alertsFired} alert(s) fired, ${res.instrumentsMatured} instrument(s) matured.`,
      res.alertsFired > 0 ? 'info' : 'success'
    );
    setLoading(false);
  };

  const handleReset = async () => {
    setLoading(true);
    await resetClock();
    showToast('⏱ Clock reset to initial seed date (2026-10-30). Instruments restored.', 'info');
    setLoading(false);
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="fixed bottom-4 right-4 z-50 bg-[#0b2e4f] text-white rounded-2xl shadow-2xl border border-white/20 p-3 px-4 flex items-center gap-3 text-xs backdrop-blur-md">
        <div className="flex items-center gap-1.5 font-bold text-blue-200">
          <Clock size={14} className="text-amber-400 animate-pulse" />
          <span>TIME MACHINE</span>
        </div>
        <div className="bg-black/30 px-2 py-1 rounded font-mono font-bold text-white border border-white/10">
          {currentDate}
        </div>
        <div className="flex items-center gap-1">
          <button
            disabled={loading}
            onClick={() => handleAdvance(7)}
            className="px-2 py-1 rounded bg-blue-600/80 hover:bg-blue-600 font-semibold transition-colors disabled:opacity-50"
            title="Advance 7 days"
          >
            +7d
          </button>
          <button
            disabled={loading}
            onClick={() => handleAdvance(30)}
            className="px-2 py-1 rounded bg-blue-600/80 hover:bg-blue-600 font-semibold transition-colors disabled:opacity-50"
            title="Advance 30 days"
          >
            +30d
          </button>
          <button
            disabled={loading}
            onClick={() => handleAdvance(60)}
            className="px-2 py-1 rounded bg-blue-600/80 hover:bg-blue-600 font-semibold transition-colors disabled:opacity-50"
            title="Advance 60 days"
          >
            +60d
          </button>
          <button
            disabled={loading}
            onClick={() => handleAdvance(90)}
            className="px-2 py-1 rounded bg-blue-600/80 hover:bg-blue-600 font-semibold transition-colors disabled:opacity-50"
            title="Advance 90 days"
          >
            +90d
          </button>
          <button
            id="time-machine-reset-btn"
            disabled={loading}
            onClick={handleReset}
            className="px-2.5 py-1 rounded bg-red-600/80 hover:bg-red-600 font-bold transition-colors disabled:opacity-50 flex items-center gap-1 text-white shadow-sm"
            title="Reset Clock to 2026-10-30"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>
    </>
  );
}
