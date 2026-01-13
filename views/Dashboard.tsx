import React, { useState, useEffect } from 'react';
import { User, AbsenceRequest, AbsenceStatus, AbsenceType } from '../types';
import { formatDate } from '../services/holidayService';
import { ICONS } from '../constants';
import { supabase } from '../services/supabaseClient';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [teamAbsences, setTeamAbsences] = useState<AbsenceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [usedVacationDays, setUsedVacationDays] = useState(0);

  useEffect(() => {
    fetchApprovedAbsences();
    fetchUsedVacationDays();
  }, [user.id]);

  const fetchApprovedAbsences = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('absences')
      .select(`
        *,
        profiles:user_id (full_name)
      `)
      .eq('status', AbsenceStatus.APPROVED)
      .order('start_date', { ascending: true });

    if (data) {
      setTeamAbsences(data.map(d => ({
        id: d.id,
        userId: d.user_id,
        userName: d.profiles?.full_name || 'Mitarbeiter',
        type: d.type as any,
        startDate: d.start_date,
        endDate: d.end_date,
        status: d.status as AbsenceStatus,
        createdAt: d.created_at,
        days: d.days
      })));
    }
    setLoading(false);
  };

  // Berechne die genutzten Urlaubstage des aktuellen Users
  const fetchUsedVacationDays = async () => {
    const currentYear = new Date().getFullYear();
    const { data } = await supabase
      .from('absences')
      .select('days, type')
      .eq('user_id', user.id)
      .eq('status', AbsenceStatus.APPROVED)
      .eq('type', AbsenceType.VACATION)
      .gte('start_date', `${currentYear}-01-01`)
      .lte('start_date', `${currentYear}-12-31`);

    if (data) {
  const totalUsed = data.reduce((sum, absence) => sum + (absence.days || 0), 0);
  setUsedVacationDays(totalUsed);
  console.log('Used vacation days:', totalUsed, 'Data:', data);
}
  };

  // Berechne verbleibende Tage (30 Tage Jahresurlaub - genutzte Tage)
  const totalVacationDays = 30;
  const remainingDays = totalVacationDays - usedVacationDays;

  // Berechne wer HEUTE abwesend ist
  const todayStr = new Date().toISOString().split('T')[0];
  const absenteesToday = teamAbsences.filter(a => a.startDate <= todayStr && a.endDate >= todayStr);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 border border-brand/10 premium-shadow bg-white flex flex-col justify-between h-44">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand/40">Mein Kontingent</span>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-brand">{remainingDays}</span>
            <span className="text-xs font-bold text-brand/40 uppercase tracking-widest">Tage übrig</span>
          </div>
          <div className="w-full bg-brand-soft h-1.5 mt-4">
            <div className="bg-brand h-full transition-all duration-1000" style={{ width: `${Math.min((remainingDays / totalVacationDays) * 100, 100)}%` }}></div>
          </div>
        </div>

        <div className="p-8 border border-brand/10 premium-shadow bg-white flex flex-col justify-between h-44">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand/40">Zuständigkeit</span>
          <div>
            <div className="text-xl font-bold text-brand-darkest truncate">{user.name}</div>
            <div className="text-[10px] text-brand uppercase font-bold tracking-[0.2em] mt-2 bg-brand-soft inline-block px-2 py-1">
               {user.role === 'CEO' ? 'Geschäftsführung' : user.role === 'TEAM_LEAD' ? 'Teamleiter' : 'Asset Management Team'}
            </div>
          </div>
        </div>

        <div className="p-8 border border-brand/10 premium-shadow bg-brand-darkest text-white flex flex-col justify-between h-44 shadow-2xl shadow-brand-darkest/20">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand/40">Team-Präsenz Heute</span>
          <div>
            <div className="text-3xl font-bold">{10 - absenteesToday.length} / 10</div>
            <p className="text-[9px] font-bold text-brand-light uppercase mt-2 tracking-widest">Mitarbeiter im Office</p>
          </div>
        </div>
      </div>

      {/* Team Overview */}
      <section className="border border-brand/10 premium-shadow bg-white overflow-hidden">
        <div className="p-6 border-b border-brand/5 flex justify-between items-center bg-white">
          <h3 className="font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-3 text-brand-darkest">
            <ICONS.Calendar size={18} className="text-brand" /> Team-Kalender (Zukünftige Abwesenheiten)
          </h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[9px] text-brand/40 font-bold uppercase tracking-widest">Live Sync: Berlin</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-soft/30 border-b border-brand/5">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand/60">Mitarbeiter</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand/60">Grund</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand/60">Zeitraum</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand/60 text-right">Dauer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-[10px] text-brand/30 uppercase font-bold tracking-[0.5em]">Daten werden synchronisiert...</td>
                </tr>
              ) : teamAbsences.length > 0 ? (
                teamAbsences.map((abs) => (
                  <tr key={abs.id} className="hover:bg-brand-soft/20 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="font-bold text-sm text-brand-darkest group-hover:text-brand transition-colors">{abs.userName}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[9px] font-bold uppercase tracking-widest border border-brand/10 px-2 py-1 rounded-sm text-brand-darkest">
                        {abs.type}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-brand-darkest/60">
                      {formatDate(abs.startDate)} <span className="mx-1 text-brand/20">→</span> {formatDate(abs.endDate)}
                    </td>
                    <td className="px-8 py-5 text-right font-bold text-xs text-brand">
                      {abs.days} <span className="text-[9px] text-brand/40 uppercase ml-1">Arbeitstage</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="text-[10px] text-brand/20 uppercase font-bold tracking-[0.3em] mb-2">Keine Einträge</div>
                    <p className="text-[9px] text-brand/40 uppercase tracking-widest">Aktuell sind keine Abwesenheiten für das Team geplant.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-brand-soft/20 text-[9px] text-brand/40 font-bold uppercase tracking-[0.2em] text-center border-t border-brand/5 italic">
          Samstage, Sonntage und gesetzliche Feiertage (Berlin) sind bereits exkludiert.
        </div>
      </section>
    </div>
  );
};

export default Dashboard;