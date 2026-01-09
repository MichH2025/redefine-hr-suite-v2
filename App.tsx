
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import AbsenceManagement from './views/AbsenceManagement';
import TimeTracking from './views/TimeTracking';
import Documents from './views/Documents';
import AdminReview from './views/AdminReview';
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Real-time Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
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
      // Row Level Security (RLS) ensures that employees can only see their own row.
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
          remainingVacationDays: data.remaining_vacation_days ?? 30
        };
        setCurrentUser(userObj);
        
        // Administrators / CEO need all profiles for the documents & approval view
        if (userObj.role === UserRole.CEO || userObj.role === UserRole.TEAM_LEAD) {
          fetchAllProfiles();
        }
      } else {
        // Handle case where profile record doesn't exist yet (auto-creation delay)
        console.warn("Profil-Synchronisierung läuft...");
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
        remainingVacationDays: d.remaining_vacation_days ?? 30
      })));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError("Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.");
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
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
      <Layout user={currentUser} onLogout={logout}>
        <Routes>
          <Route path="/" element={<Dashboard user={currentUser} />} />
          <Route path="/absences" element={<AbsenceManagement user={currentUser} />} />
          <Route path="/time" element={<TimeTracking user={currentUser} />} />
          <Route path="/documents" element={<Documents user={currentUser} allUsers={allUsers} />} />
          
          {(currentUser.role === UserRole.CEO || currentUser.role === UserRole.TEAM_LEAD) && (
            <Route path="/admin" element={<AdminReview user={currentUser} />} />
          )}
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
