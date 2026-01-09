
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';
import { ICONS } from '../constants';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const location = useLocation();

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest transition-all ${
          isActive
            ? 'bg-brand text-white shadow-lg shadow-brand/20'
            : 'text-brand-darkest hover:bg-brand-soft hover:text-brand'
        }`
      }
    >
      <Icon size={20} strokeWidth={1.5} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="flex min-h-screen bg-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-brand/10 flex flex-col fixed h-full z-20 bg-white">
        <div className="p-8">
          <h1 className="text-2xl font-bold tracking-tighter text-brand">
            REDEFINE
          </h1>
          <p className="text-[10px] text-brand/60 uppercase tracking-[0.2em] mt-1 font-bold">
            Asset Management
          </p>
        </div>

        <nav className="flex-1 mt-4">
          <NavItem to="/" icon={ICONS.Dashboard} label="Dashboard" />
          <NavItem to="/absences" icon={ICONS.Calendar} label="Abwesenheit" />
          <NavItem to="/time" icon={ICONS.Time} label="Zeiterfassung" />
          <NavItem to="/documents" icon={ICONS.Documents} label="Dokumente" />
          
          {(user.role === UserRole.CEO || user.role === UserRole.TEAM_LEAD) && (
            <NavItem to="/admin" icon={ICONS.Admin} label="Admin / Freigaben" />
          )}
        </nav>

        <div className="p-4 border-t border-brand/10">
          <div className="flex items-center gap-3 p-2 mb-4 bg-brand-soft/50 rounded-sm">
            <div className="w-10 h-10 bg-brand text-white rounded-sm flex items-center justify-center">
              <ICONS.User size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-brand-darkest truncate">{user.name}</p>
              <p className="text-[10px] text-brand/50 uppercase tracking-tighter font-bold">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 text-xs font-bold text-brand/40 hover:text-red-600 uppercase tracking-widest transition-colors p-2"
          >
            <ICONS.Logout size={16} />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen bg-brand-soft/30">
        <header className="h-16 border-b border-brand/10 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-brand-darkest">
            {location.pathname === '/' ? 'Übersicht' : location.pathname.substring(1).toUpperCase()}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-[11px] font-bold text-brand/60 bg-brand-soft px-3 py-1.5 rounded-sm uppercase tracking-tighter border border-brand/10">
              Berlin Office
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
