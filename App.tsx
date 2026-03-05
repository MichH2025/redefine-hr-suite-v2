import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ResponsiveShell from './components/ResponsiveShell';
import Dashboard from './views/Dashboard';
import AbsenceManagement from './views/AbsenceManagement';
import TimeTracking from './views/TimeTracking';
import Documents from './views/Documents';
import AdminReview from './views/AdminReview';
import TeamCalendar from './views/TeamCalendar';
import { User, UserRole } from './types';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Initial Session Check
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await (supabase.auth as any).getSession();
        setSession(currentSession);
        if (currentSession) {
          await fetchProfile(currentSession.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setLoading(false);
      }
    };

    checkSession();

    // Real-time Auth Listener
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, newSession: any) => {
      setSession(newSession);
      if (newSession) {
        fetchProfile(newSession.user.id);
      } else {
        setCurrentUser(null);
        setAllUsers([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const userObj: User = {
          id: data.id,
          name: data.full_name || 'Mitarbeiter',
          email: data.email || session?.user?.email || '',
          role: (data.role as UserRole) || UserRole.EMPLOYEE,
          remainingVacationDays: data.remaining_vacation_days ?? 30,
          vacationDaysPreviousYear: data.vacation_days_previous_year ?? 0
        };
        setCurrentUser(userObj);
        
        if (userObj.role === UserRole.CEO || userObj.role === UserRole.TEAM_LEAD) {
          fetchAllProfiles();
        }
      } else {
        console.warn("Profil nicht gefunden, wird erstellt...");
        setTimeout(() => fetchProfile(userId), 1500);
      }
    } catch (err) {
      console.error("Critical Profile Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) {
      setAllUsers(data.map(d => ({
        id: d.id,
        name: d.full_name || 'Unbekannt',
        email: d.email || '',
        role: (d.role as UserRole) || UserRole.EMPLOYEE,
        remainingVacationDays: d.remaining_vacation_days ?? 30,
        vacationDaysPreviousYear: d.vacation_days_previous_year ?? 0
      })));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      const { error } = await (supabase.auth as any).signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      setAuthError("Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.");
      setLoading(false);
    }
  };

  const logout = async () => {
    await (supabase.auth as any).signOut();
  };

  if (loading && !session) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-soft">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-[3px] border-brand border-t-transparent rounded-full animate-spin"></div>
        <div className="text-brand font-bold tracking-[0.4em] uppercase text-[10px] animate-pulse">REDEFINE Security Check</div>
      </div>
    </div>
  );

  if (!session || !currentUser) {
    return (
      <div className="min-h-screen bg-brand-soft/30 flex items-center justify-center p-4 font-sans selection:bg-brand/20">
        <div className="max-w-md w-full border border-brand/10 p-12 premium-shadow bg-white animate-fadeIn">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tighter text-brand">REDEFINE</h1>
            <p className="text-[10px] text-brand/50 uppercase tracking-[0.4em] mt-2 font-bold">HR Management Suite</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/40 mb-2">Geschäftliche Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-brand/10 p-4 text-sm focus:border-brand outline-none bg-brand-soft/20 transition-all font-semibold"
                placeholder="name@redefine-asset.de"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/40 mb-2">Sicheres Passwort</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-brand/10 p-4 text-sm focus:border-brand outline-none bg-brand-soft/20 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            {authError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-widest text-center">
                {authError}
              </div>
            )}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-darkest text-white py-4 font-bold uppercase tracking-[0.2em] text-xs hover:bg-brand transition-all shadow-xl shadow-brand-darkest/10 disabled:opacity-50"
            >
              {loading ? 'Verbindung wird aufgebaut...' : 'Sicher Anmelden'}
            </button>
          </form>
          
          <div className="mt-12 pt-8 border-t border-brand/5 text-center">
             <p className="text-[9px] text-brand/30 uppercase tracking-widest font-bold">&copy; 2024 REDEFINE Asset Management GmbH</p>
             <p className="text-[8px] text-brand/20 mt-1">Sichere End-to-End Verschlüsselung aktiv</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <ResponsiveShell user={currentUser} onLogout={logout}>
        <Routes>
          <Route path="/" element={<Dashboard user={currentUser} />} />
          <Route path="/absences" element={<AbsenceManagement user={currentUser} />} />
          <Route path="/calendar" element={<TeamCalendar user={currentUser} />} />
          <Route path="/time" element={<TimeTracking user={currentUser} />} />
          <Route path="/documents" element={<Documents user={currentUser} allUsers={allUsers} />} />

          {(currentUser.role === UserRole.CEO || currentUser.role === UserRole.TEAM_LEAD) && (
            <Route path="/admin" element={<AdminReview user={currentUser} />} />
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ResponsiveShell>
    </HashRouter>
  );
};

export default App;