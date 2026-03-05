import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  FileText,
  ShieldCheck,
} from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

interface TabItem {
  to: string;
  icon: React.FC<{ size?: number; strokeWidth?: number; color?: string }>;
  label: string;
  adminOnly?: boolean;
}

const TABS: TabItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dash' },
  { to: '/absences', icon: Calendar, label: 'Abw.' },
  { to: '/calendar', icon: Users, label: 'Kalen.' },
  { to: '/time', icon: Clock, label: 'Zeit' },
  { to: '/documents', icon: FileText, label: 'Doku' },
  { to: '/admin', icon: ShieldCheck, label: 'Admin', adminOnly: true },
];

const BRAND = '#A86E3A';
const INACTIVE = '#B8A090';

const MobileLayout: React.FC<MobileLayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const isAdmin = user.role === UserRole.CEO || user.role === UserRole.TEAM_LEAD;
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div
      className="flex flex-col min-h-screen font-sans"
      style={{
        fontFamily: "'Titillium Web', sans-serif",
        background: '#FDFBF9',
      }}
    >
      {/* ── Sticky Header (includes Safe Area Top for Notch / Dynamic Island) ── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4"
        style={{
          paddingTop: 'env(safe-area-inset-top, 20px)',
          height: `calc(52px + env(safe-area-inset-top, 20px))`,
          background: 'rgba(253, 251, 249, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E8DDD4',
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
            color: BRAND,
          }}
        >
          REDEFINE
        </span>

        <div className="flex items-center gap-1.5">
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#22c55e',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: INACTIVE,
              letterSpacing: '0.02em',
            }}
          >
            Live &middot; Berlin
          </span>
        </div>
      </header>

      {/* ── Scrollable Content ─────────────────────────────── */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: 80,
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none',
        }}
      >
        <div className="p-4">{children}</div>
      </main>

      {/* ── Fixed Bottom Navigation ────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-start justify-around"
        style={{
          background: 'rgba(253, 251, 249, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid #E8DDD4',
          paddingTop: 6,
          paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        }}
      >
        {visibleTabs.map((tab) => {
          const isActive =
            tab.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.to);

          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="flex flex-col items-center justify-center"
              style={{
                minWidth: 44,
                minHeight: 44,
                textDecoration: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.2 : 1.5}
                color={isActive ? BRAND : INACTIVE}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                  marginTop: 2,
                  color: isActive ? BRAND : INACTIVE,
                }}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileLayout;
