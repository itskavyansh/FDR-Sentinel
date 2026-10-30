import React from 'react';
import { useStore } from '../store/useStore';
import type { Role } from '../types';
import { Shield, ChevronDown, Bell, Check, Clock } from 'lucide-react';

const roles: Array<{ role: Role; label: string; group?: string }> = [
  { role: 'Officer', label: 'AICTE Officer (All)' },
  { role: 'Officer-Maker', label: 'Officer — Maker (Scrutiny)' },
  { role: 'Officer-Checker', label: 'Officer — Checker (Section Head)' },
  { role: 'Officer-Approver', label: 'Officer — Approver (Competent Auth)' },
  { role: 'Institution', label: 'Institution User' },
  { role: 'Bank', label: 'Bank Nodal Officer' },
  { role: 'Auditor', label: 'Auditor' },
  { role: 'Admin', label: 'Administrator' },
];

export default function TopBar() {
  const { role, setRole, currentDate, alerts } = useStore();
  const [roleOpen, setRoleOpen] = React.useState(false);
  const [bellOpen, setBellOpen] = React.useState(false);

  const activeRoleObj = roles.find(r => r.role === role) || roles[0];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14"
      style={{ backgroundColor: '#0b2e4f' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: '#0072c6' }}>
          <Shield size={18} color="white" />
        </div>
        <div>
          <span className="text-white font-bold text-base tracking-wide">FDR Sentinel</span>
          <span className="text-blue-300 text-xs ml-2 hidden sm:inline">AICTE Security Deposit Portal</span>
        </div>
      </div>

      {/* Center: Search / Indicator */}
      <div className="hidden lg:flex items-center bg-white/10 border border-white/20 rounded-lg px-3 h-8 w-72 gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-200">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          className="bg-transparent text-sm text-white placeholder-blue-300 outline-none flex-1"
          placeholder="Ask Sentinel… (AI verification active)"
          disabled
        />
      </div>

      {/* Right controls: Date, Bell, Role */}
      <div className="flex items-center gap-3">
        {/* Current Date Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-blue-200 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
          <Clock size={12} className="text-blue-300" />
          <span>Clock:</span>
          <span className="text-white font-semibold font-mono">{currentDate}</span>
        </div>

        {/* Bell dropdown for alerts */}
        <div className="relative">
          <button
            id="notification-bell"
            onClick={() => {
              setBellOpen(o => !o);
              setRoleOpen(false);
            }}
            className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="In-app Notifications"
          >
            <Bell size={16} />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-11 bg-white rounded-xl shadow-2xl border border-gray-200 w-80 max-h-96 overflow-y-auto z-50 text-gray-800 p-2">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                <span className="font-bold text-xs text-gray-900 uppercase tracking-wider">Scheduler Alerts</span>
                <span className="text-[11px] text-gray-500">{alerts.length} notifications</span>
              </div>
              {alerts.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  No alerts fired yet. Advance the Time Machine to trigger scheduled maturity reminders.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {alerts.slice(0, 15).map(a => (
                    <div key={a.id} className="p-2.5 text-xs hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-[10px]">
                          {a.stage}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{a.date}</span>
                      </div>
                      <p className="text-gray-700 leading-snug">{a.message}</p>
                      <div className="mt-1 text-[10px] text-gray-400">To: {a.recipientRole}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Region selector for Officer roles */}
        {(role === 'Officer' || role === 'Officer-Maker' || role === 'Officer-Checker' || role === 'Officer-Approver') && (
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white">
            <span className="text-blue-300 font-semibold text-[11px]">Region:</span>
            <select
              value={useStore.getState().officerRegion}
              onChange={e => useStore.getState().setOfficerRegion(e.target.value as any)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
            >
              <option value="All" className="text-gray-900">All Regions</option>
              <option value="North" className="text-gray-900">North (Delhi, UP, RJ, PB)</option>
              <option value="South" className="text-gray-900">South (KA, TN, AP)</option>
              <option value="West" className="text-gray-900">West (MH, GJ)</option>
              <option value="East" className="text-gray-900">East (WB, OD)</option>
              <option value="Central" className="text-gray-900">Central (MP)</option>
            </select>
          </div>
        )}

        {/* Role switcher dropdown */}
        <div className="relative">
          <button
            id="role-switcher"
            onClick={() => {
              setRoleOpen(o => !o);
              setBellOpen(false);
            }}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs md:text-sm rounded-lg px-3 py-1.5 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            <span className="font-medium max-w-[140px] truncate">{activeRoleObj.label}</span>
            <ChevronDown size={14} />
          </button>

          {roleOpen && (
            <div className="absolute right-0 top-11 bg-white rounded-xl shadow-2xl border border-gray-200 min-w-56 z-50 py-1.5">
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                Select Active Role
              </div>
              {roles.map(r => (
                <button
                  key={r.role}
                  onClick={() => {
                    setRole(r.role);
                    setRoleOpen(false);
                    // Check if current page is allowed for the new role; if not, go to role's landing page
                    const currentPath = window.location.pathname;
                    const roleDefaultLanding: Record<Role, string> = {
                      'Officer': '/',
                      'Officer-Maker': '/releases',
                      'Officer-Checker': '/releases',
                      'Officer-Approver': '/releases',
                      'Institution': '/institution',
                      'Bank': '/bank/tok-fdr019-demo',
                      'Auditor': '/audit',
                      'Admin': '/',
                    };

                    const roleAllowedPaths: Record<Role, string[]> = {
                      'Officer': ['/', '/instruments', '/queue', '/radar', '/releases', '/reports', '/audit'],
                      'Officer-Maker': ['/', '/instruments', '/queue', '/radar', '/releases', '/reports', '/audit'],
                      'Officer-Checker': ['/', '/instruments', '/queue', '/radar', '/releases', '/reports', '/audit'],
                      'Officer-Approver': ['/', '/instruments', '/queue', '/radar', '/releases', '/reports', '/audit'],
                      'Institution': ['/institution', '/instruments', '/radar', '/releases'],
                      'Bank': ['/instruments'],
                      'Auditor': ['/', '/instruments', '/radar', '/reports', '/audit'],
                      'Admin': ['/', '/institution', '/instruments', '/queue', '/radar', '/releases', '/reports', '/audit', '/settings'],
                    };

                    const allowed = roleAllowedPaths[r.role] || ['/'];
                    const isAllowed = allowed.some(p => currentPath === p || (p !== '/' && currentPath.startsWith(p)));
                    if (!isAllowed) {
                      window.location.pathname = roleDefaultLanding[r.role] || '/';
                    }
                  }}
                  className={`w-full text-left px-4 py-2 text-xs md:text-sm flex items-center justify-between hover:bg-blue-50 transition-colors ${
                    r.role === role ? 'text-[#0072c6] font-bold bg-blue-50/60' : 'text-gray-700'
                  }`}
                >
                  <span>{r.label}</span>
                  {r.role === role && <Check size={14} className="text-[#0072c6]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
