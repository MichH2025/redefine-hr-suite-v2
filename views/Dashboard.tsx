import React, { useState, useEffect, useMemo } from 'react';
import { User, AbsenceRequest, AbsenceStatus, AbsenceType } from '../types';
import { formatDate } from '../services/holidayService';
import { ICONS } from '../constants';
import { supabase } from '../services/supabaseClient';

const FILTER_OPTIONS: { key: string; label: string }[] = [
  { key: 'Alle', label: 'Alle' },
  { key: AbsenceType.VACATION, label: 'Urlaub' },
  { key: AbsenceType.HOME_OFFICE, label: 'Homeoffice' },
  { key: AbsenceType.SICK_LEAVE, label: 'Krankheit' },
  { key: AbsenceType.SPECIAL_LEAVE, label: 'Sonderurlaub' },
];

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [teamAbsences, setTeamAbsences] = useState<AbsenceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [usedVacationDays, setUsedVacationDays] = useState(0);
  const [pendingVacationDays, setPendingVacationDays] = useState(0);
  const [activeFilter, setActiveFilter] = useState('Alle');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchApprovedAbsences();
    fetchVacationDays();
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

  const fetchVacationDays = async () => {
    const currentYear = new Date().getFullYear();

    // Genehmigte Urlaubstage
    const { data: approvedData } = await supabase
      .from('absences')
      .select('days')
      .eq('user_id', user.id)
      .eq('status', AbsenceStatus.APPROVED)
      .eq('type', AbsenceType.VACATION)
      .gte('start_date', `${currentYear}-01-01`)
      .lte('start_date', `${currentYear}-12-31`);

    if (approvedData) {
      setUsedVacationDays(approvedData.reduce((sum, a) => sum + (a.days || 0), 0));
    }

    // Beantragte (pending) Urlaubstage
    const { data: pendingData } = await supabase
      .from('absences')
      .select('days')
      .eq('user_id', user.id)
      .eq('type', AbsenceType.VACATION)
      .in('status', [AbsenceStatus.PENDING_TEAM_LEAD, AbsenceStatus.PENDING_CEO])
      .gte('start_date', `${currentYear}-01-01`)
      .lte('start_date', `${currentYear}-12-31`);

    if (pendingData) {
      setPendingVacationDays(pendingData.reduce((sum, a) => sum + (a.days || 0), 0));
    }
  };

  const currentYear = new Date().getFullYear();
  const baseVacationDays = user.remainingVacationDays;
  const previousYearDays = user.vacationDaysPreviousYear;
  const totalEntitlement = baseVacationDays + previousYearDays;
  const remainingDays = totalEntitlement - usedVacationDays;
  const usagePercent = totalEntitlement > 0 ? Math.round((usedVacationDays / totalEntitlement) * 100) : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const absenteesToday = teamAbsences.filter(a => a.startDate <= todayStr && a.endDate >= todayStr);

  const filteredAbsences = useMemo(() => {
    let result = teamAbsences;
    if (activeFilter !== 'Alle') {
      result = result.filter(a => a.type === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(a => a.userName.toLowerCase().includes(q));
    }
    return result;
  }, [teamAbsences, activeFilter, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Urlaubskonto - erweitert */}
        <div className="md:col-span-2 p-6 md:p-8 border border-brand/10 premium-shadow bg-white">
          <div className="flex items-center gap-2 mb-5">
            <ICONS.PlaneTakeoff size={16} className="text-brand" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand/40">Mein Urlaubskonto {currentYear}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-brand/60">Jahresurlaub</span>
              <span className="text-xs font-bold text-brand-darkest">{baseVacationDays} Tage</span>
            </div>
            {previousYearDays > 0 && (
              <div className="flex justify-between py-1.5 sm:col-start-1">
                <span className="text-xs text-brand/60">Resturlaub {currentYear - 1}</span>
                <span className="text-xs font-bold text-brand-darkest">+ {previousYearDays} Tage</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-t border-brand/10 sm:col-start-1">
              <span className="text-xs font-bold text-brand-darkest">Gesamtanspruch</span>
              <span className="text-xs font-bold text-brand-darkest">{totalEntitlement} Tage</span>
            </div>
            <div className="flex justify-between py-1.5 sm:col-start-1">
              <span className="text-xs text-brand/60">Genommen/Genehmigt</span>
              <span className="text-xs font-bold text-red-600">- {usedVacationDays} Tage</span>
            </div>
            {pendingVacationDays > 0 && (
              <div className="flex justify-between py-1.5 sm:col-start-1">
                <span className="text-xs text-brand/60">Beantragt (offen)</span>
                <span className="text-xs font-bold text-orange-500">- {pendingVacationDays} Tage</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-t border-brand/10 sm:col-start-1">
              <span className="text-xs font-bold text-brand-darkest">Noch verfügbar</span>
              <span className="text-sm font-bold text-brand">{remainingDays} Tage</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="w-full bg-brand-soft h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand h-full transition-all duration-1000 rounded-full"
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] text-brand/40 font-bold uppercase tracking-widest">{usagePercent}% verbraucht</span>
              <span className="text-[9px] text-brand/40 font-bold uppercase tracking-widest">{remainingDays} von {totalEntitlement} Tagen</span>
            </div>
          </div>
        </div>

        {/* Right column cards */}
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="p-6 md:p-8 border border-brand/10 premium-shadow bg-white flex flex-col justify-between flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand/40">Zuständigkeit</span>
            <div className="mt-2">
              <div className="text-lg md:text-xl font-bold text-brand-darkest truncate">{user.name}</div>
              <div className="text-[10px] text-brand uppercase font-bold tracking-[0.2em] mt-2 bg-brand-soft inline-block px-2 py-1">
                 {user.role === 'CEO' ? 'Geschäftsführung' : user.role === 'TEAM_LEAD' ? 'Teamleiter' : 'Asset Management Team'}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 border border-brand/10 premium-shadow bg-brand-darkest text-white flex flex-col justify-between flex-1 shadow-2xl shadow-brand-darkest/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand/40">Team-Präsenz Heute</span>
            <div className="mt-2">
              <div className="text-3xl font-bold">{10 - absenteesToday.length} / 10</div>
              <p className="text-[9px] font-bold text-brand-light uppercase mt-2 tracking-widest">Mitarbeiter im Office</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Overview */}
      <section className="border border-brand/10 premium-shadow bg-white overflow-hidden">
        <div className="p-4 md:p-6 border-b border-brand/5 flex flex-col gap-3 bg-white">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
            <h3 className="font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] text-[10px] md:text-xs flex items-center gap-2 md:gap-3 text-brand-darkest">
              <ICONS.Calendar size={18} className="text-brand" /> Team-Abwesenheiten
            </h3>

            {/* Search */}
            <input
              type="text"
              placeholder="Mitarbeiter suchen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full md:w-56 border border-brand/10 px-3 py-2 text-xs focus:border-brand outline-none bg-brand-soft/20 text-brand-darkest placeholder:text-brand/30"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setActiveFilter(opt.key)}
                className={`px-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest border transition-all ${
                  activeFilter === opt.key
                    ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                    : 'bg-white text-brand-darkest/60 border-brand/10 hover:border-brand/30 hover:text-brand-darkest'
                }`}
              >
                {opt.label}
                {opt.key !== 'Alle' && (
                  <span className="ml-1 opacity-60">
                    ({teamAbsences.filter(a => a.type === opt.key).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: Table */}
        <div className="hidden md:block overflow-x-auto">
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
              ) : filteredAbsences.length > 0 ? (
                filteredAbsences.map((abs) => (
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
                    <p className="text-[9px] text-brand/40 uppercase tracking-widest">
                      {searchQuery.trim() ? `Kein Ergebnis für „${searchQuery.trim()}"` : activeFilter !== 'Alle' ? `Keine ${activeFilter}-Einträge vorhanden.` : 'Aktuell sind keine Abwesenheiten für das Team geplant.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden divide-y divide-brand/5">
          {loading ? (
            <div className="px-4 py-10 text-center text-[10px] text-brand/30 uppercase font-bold tracking-widest">Daten werden synchronisiert...</div>
          ) : filteredAbsences.length > 0 ? (
            filteredAbsences.map((abs) => (
              <div key={abs.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-brand-darkest truncate">{abs.userName}</div>
                  <div className="text-[11px] text-brand/60 mt-0.5">
                    {formatDate(abs.startDate)} → {formatDate(abs.endDate)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[9px] font-bold uppercase tracking-widest border border-brand/10 px-2 py-0.5 rounded-sm text-brand-darkest">{abs.type}</span>
                  <span className="text-xs font-bold text-brand">{abs.days} Tage</span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-12 text-center">
              <div className="text-[10px] text-brand/20 uppercase font-bold tracking-widest">
                {searchQuery.trim() ? `Kein Ergebnis für „${searchQuery.trim()}"` : activeFilter !== 'Alle' ? `Keine ${activeFilter}-Einträge` : 'Keine Abwesenheiten geplant'}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 md:p-4 bg-brand-soft/20 text-[8px] md:text-[9px] text-brand/40 font-bold uppercase tracking-[0.2em] text-center border-t border-brand/5 italic">
          Samstage, Sonntage und gesetzliche Feiertage (Berlin) sind bereits exkludiert.
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
