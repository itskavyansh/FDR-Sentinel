import { NavLink } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { Role } from '../types';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Radar,
  Download,
  BarChart3,
  Settings,
  ChevronRight,
  Layers,
  Building2,
  ExternalLink,
} from 'lucide-react';

interface NavItem {
  label: string;
  hindiLabel: string;
  icon: React.ReactNode;
  to: string;
  badge?: number;
  roles: Role[];
}

export default function Sidebar() {
  const { role, instruments, bankTokens, releaseRequests, resetDemo } = useStore();

  const flaggedCount = instruments.filter(
    i => i.status === 'Flagged' || i.status === 'Under verification'
  ).length;
  const pendingReleaseCount = releaseRequests.filter(
    r => r.stage === 'Maker' || r.stage === 'Checker' || r.stage === 'Approver'
  ).length;
  const pendingBankTokens = bankTokens.filter(t => t.status === 'pending');

  const officerRoles: Role[] = ['Officer', 'Officer-Maker', 'Officer-Checker', 'Officer-Approver', 'Admin'];

  const items: NavItem[] = [
    {
      label: 'Dashboard',
      hindiLabel: 'डैशबोर्ड',
      icon: <LayoutDashboard size={16} />,
      to: '/',
      roles: ['Officer', 'Officer-Maker', 'Officer-Checker', 'Officer-Approver', 'Admin', 'Auditor'],
    },
    {
      label: 'Institution Portal',
      hindiLabel: 'संस्थान पोर्टल',
      icon: <Building2 size={16} />,
      to: '/institution',
      roles: ['Institution', 'Admin'],
    },
    {
      label: 'All Instruments',
      hindiLabel: 'सभी सावधि जमा',
      icon: <FileText size={16} />,
      to: '/instruments',
      roles: [
        'Officer',
        'Officer-Maker',
        'Officer-Checker',
        'Officer-Approver',
        'Institution',
        'Bank',
        'Auditor',
        'Admin',
      ],
    },
    {
      label: 'Verification Queue',
      hindiLabel: 'सत्यापन कतार',
      icon: <CheckSquare size={16} />,
      to: '/queue',
      roles: officerRoles,
      badge: flaggedCount,
    },
    {
      label: 'Maturity Radar',
      hindiLabel: 'परिपक्वता रडार',
      icon: <Radar size={16} />,
      to: '/radar',
      roles: [
        'Officer',
        'Officer-Maker',
        'Officer-Checker',
        'Officer-Approver',
        'Admin',
        'Auditor',
        'Institution',
      ],
    },
    {
      label: 'Release Requests',
      hindiLabel: 'निकासी अनुरोध',
      icon: <Download size={16} />,
      to: '/releases',
      roles: [...officerRoles, 'Institution'],
      badge: pendingReleaseCount,
    },
    {
      label: 'Reports',
      hindiLabel: 'अनुपालन रिपोर्ट',
      icon: <BarChart3 size={16} />,
      to: '/reports',
      roles: ['Officer', 'Auditor', 'Admin'],
    },
    {
      label: 'Audit Trail',
      hindiLabel: 'लेखापरीक्षा ट्रेल',
      icon: <Layers size={16} />,
      to: '/audit',
      roles: ['Officer', 'Auditor', 'Admin'],
    },
    {
      label: 'Settings',
      hindiLabel: 'प्रणाली सेटिंग्स',
      icon: <Settings size={16} />,
      to: '/settings',
      roles: ['Admin'],
    },
  ];

  const visible = items.filter(i => i.roles.includes(role));

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-56 bg-white border-r border-gray-200 flex flex-col z-40">
      <div className="flex-1 overflow-y-auto pt-3 pb-4">
        {/* Navigation items with secondary Hindi labels */}
        <nav className="flex flex-col gap-0.5 px-3">
          {visible.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative group ${
                  isActive
                    ? 'bg-[#0072c6]/15 text-[#0072c6] font-semibold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <span className={isActive ? 'text-[#0072c6]' : 'text-gray-400 group-hover:text-gray-600'}>
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-xs font-semibold leading-tight">{item.label}</div>
                    <div className="text-[10px] text-gray-400 leading-tight font-medium">
                      {item.hindiLabel}
                    </div>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.2 font-bold min-w-4 text-center">
                      {item.badge}
                    </span>
                  ) : null}
                  {isActive && <ChevronRight size={12} className="text-[#0072c6]" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bank Portal Quick Links */}
        {(role === 'Bank' || role === 'Admin') && (
          <div className="mt-4 mx-3 pt-3 border-t border-gray-100">
            <div className="text-[10px] uppercase font-bold text-gray-400 px-2 mb-2 flex items-center justify-between">
              <span>Pending Bank Links</span>
              <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold">
                {pendingBankTokens.length}
              </span>
            </div>
            {pendingBankTokens.length === 0 ? (
              <div className="text-[11px] text-gray-400 px-2 py-1 italic">No pending links</div>
            ) : (
              <div className="space-y-1">
                {pendingBankTokens.map(t => (
                  <NavLink
                    key={t.token}
                    to={`/bank/${t.token}`}
                    className="flex items-center justify-between px-2 py-1.5 rounded text-xs bg-amber-50/60 hover:bg-amber-100 text-amber-900 border border-amber-200"
                  >
                    <span className="truncate max-w-[120px] font-mono font-semibold">
                      {t.token.slice(-10)}
                    </span>
                    <ExternalLink size={12} className="text-amber-600 flex-shrink-0" />
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reset demo */}
      <div className="p-3 border-t border-gray-200">
        <button
          id="reset-demo-btn"
          onClick={() => {
            if (confirm('Reset all demo data to seed state?')) resetDemo();
          }}
          className="w-full text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 py-2 px-3 rounded-lg transition-colors text-center font-medium"
        >
          ↺ Reset demo data
        </button>
      </div>
    </aside>
  );
}
