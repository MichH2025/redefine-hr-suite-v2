import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Filter, Users, X,
  Palmtree, Home, Heart, Briefcase, Check, Star,
} from 'lucide-react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { getHolidayName, isNonWorkday, calcWorkDays, getBerlinHolidays } from '../services/holidayService';

// ── Types ────────────────────────────────────────────────────

interface TeamCalendarProps {
  user: User;
}

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;
}

interface CalendarAbsence {
  id: string;
  userId: string;
  type: string;
  start: string;
  end: string;
  days: number;
}

// ── Constants ────────────────────────────────────────────────

const MEMBER_COLORS = ['#A86E3A', '#5B8C5A', '#4A7FB5', '#8B5E8B', '#C07030', '#3A8A8A', '#7A6B5A', '#B85450'];

const TYPE_CONFIG: Record<string, { icon: React.FC<any>; color: string; bg: string; label: string }> = {
  Urlaub:       { icon: Palmtree,  color: '#A86E3A', bg: '#F7F3F0', label: 'Urlaub' },
  Homeoffice:   { icon: Home,      color: '#5B8C5A', bg: '#F0F5F0', label: 'Homeoffice' },
  Krankheit:    { icon: Heart,     color: '#C04040', bg: '#FDF2F2', label: 'Krankheit' },
  Sonderurlaub: { icon: Briefcase, color: '#4A7FB5', bg: '#F0F4FA', label: 'Sonderurlaub' },
};

const MONTHS_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const DAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// ── Helpers ──────────────────────────────────────────────────

const pad = (n: number): string => String(n).padStart(2, '0');
const fmtDate = (d: Date): string => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
const fmtKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isSameDay = (a: Date, b: Date): boolean => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const getDaysInMonth = (y: number, m: number): number => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y: number, m: number): number => { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; };
const dayIdx = (d: Date): number => d.getDay() === 0 ? 6 : d.getDay() - 1;

const getWeekNumber = (d: Date): number => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const getWeekDates = (date: Date): Date[] => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const r = new Date(monday);
    r.setDate(monday.getDate() + i);
    return r;
  });
};

const getAbsencesForDate = (date: Date, absences: CalendarAbsence[], selectedMembers: Set<string>): CalendarAbsence[] => {
  const dateStr = fmtKey(date);
  return absences.filter((a) => {
    if (selectedMembers.size > 0 && !selectedMembers.has(a.userId)) return false;
    return dateStr >= a.start && dateStr <= a.end;
  });
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// ── Component ────────────────────────────────────────────────

const TeamCalendar: React.FC<TeamCalendarProps> = ({ user }) => {
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [absences, setAbsences] = useState<CalendarAbsence[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // ── Data Fetching ──────────────────────────────────────────

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, role');
      if (data) {
        setMembers(data.map((p: any, i: number) => ({
          id: p.id,
          name: p.full_name || 'Unbekannt',
          initials: getInitials(p.full_name || 'UN'),
          role: p.role || 'EMPLOYEE',
          color: MEMBER_COLORS[i % MEMBER_COLORS.length],
        })));
      }
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    const fetchAbsences = async () => {
      setLoading(true);
      // Fetch a wide window: 1 month before and after current view
      const rangeStart = `${year}-${pad(month + 1)}-01`;
      const rangeEndDate = new Date(year, month + 2, 0);
      const rangeEnd = fmtKey(rangeEndDate);

      const { data } = await supabase
        .from('absences')
        .select('id, user_id, type, start_date, end_date, days, status')
        .eq('status', 'Freigegeben')
        .gte('end_date', rangeStart)
        .lte('start_date', rangeEnd);

      if (data) {
        setAbsences(data.map((a: any) => ({
          id: a.id,
          userId: a.user_id,
          type: a.type,
          start: a.start_date,
          end: a.end_date,
          days: a.days ?? calcWorkDays(new Date(a.start_date), new Date(a.end_date)),
        })));
      }
      setLoading(false);
    };
    fetchAbsences();
  }, [year, month]);

  // ── Navigation ─────────────────────────────────────────────

  const navigate = useCallback((dir: number) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === 'month') d.setMonth(d.getMonth() + dir);
      else d.setDate(d.getDate() + dir * 7);
      return d;
    });
    setSelectedDay(null);
  }, [view]);

  const goToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(null);
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Computed ───────────────────────────────────────────────

  const monthGrid = useMemo(() => {
    const firstDay = getFirstDayOfMonth(year, month);
    const dim = getDaysInMonth(year, month);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= dim; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [year, month]);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const headerTitle = view === 'month'
    ? `${MONTHS_DE[month]} ${year}`
    : `KW ${getWeekNumber(weekDates[0])} · ${MONTHS_DE[weekDates[0].getMonth()]} ${weekDates[0].getFullYear()}`;

  const monthStats = useMemo(() => {
    const mStart = new Date(year, month, 1);
    const mEnd = new Date(year, month + 1, 0);
    const monthAbs = absences.filter(a => {
      const s = new Date(a.start);
      const e = new Date(a.end);
      if (selectedMembers.size > 0 && !selectedMembers.has(a.userId)) return false;
      return s <= mEnd && e >= mStart;
    });

    let totalWorkDays = 0;
    monthAbs.forEach(a => {
      const cur = new Date(Math.max(new Date(a.start).getTime(), mStart.getTime()));
      const end = new Date(Math.min(new Date(a.end).getTime(), mEnd.getTime()));
      while (cur <= end) {
        if (!isNonWorkday(cur)) totalWorkDays++;
        cur.setDate(cur.getDate() + 1);
      }
    });
    const uniquePeople = new Set(monthAbs.map(a => a.userId)).size;

    const holidaysInMonth: { date: Date; name: string }[] = [];
    for (let d = 1; d <= getDaysInMonth(year, month); d++) {
      const date = new Date(year, month, d);
      const name = getHolidayName(date);
      if (name && date.getDay() !== 0 && date.getDay() !== 6) holidaysInMonth.push({ date, name });
    }

    let workdaysInMonth = 0;
    for (let d = 1; d <= getDaysInMonth(year, month); d++) {
      if (!isNonWorkday(new Date(year, month, d))) workdaysInMonth++;
    }

    return { totalWorkDays, uniquePeople, holidaysInMonth, workdaysInMonth };
  }, [year, month, absences, selectedMembers]);

  // ── AbsenceCount (sub-component) ──────────────────────────

  const AbsenceCount: React.FC<{ date: Date }> = ({ date }) => {
    const abs = getAbsencesForDate(date, absences, selectedMembers);
    if (abs.length === 0) return null;
    return (
      <span style={{
        fontSize: 9, fontWeight: 700, marginTop: 1, lineHeight: 1,
        color: abs.length >= 4 ? '#C04040' : abs.length >= 2 ? '#A86E3A' : '#8F5D30',
      }}>{abs.length}</span>
    );
  };

  // ── DayDetail Bottom Sheet ─────────────────────────────────

  const DayDetail: React.FC<{ date: Date; onClose: () => void }> = ({ date, onClose }) => {
    const abs = getAbsencesForDate(date, absences, selectedMembers);
    const holiday = getHolidayName(date);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const nonWork = weekend || !!holiday;

    return (
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', borderRadius: '20px 20px 0 0',
        boxShadow: '0 -8px 40px rgba(168,110,58,0.15)',
        zIndex: 100, maxHeight: '65vh', overflow: 'auto',
        animation: 'slideUp 0.3s ease-out',
        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
      }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #F0EBE6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: '#8F5D30', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {DAYS_SHORT[dayIdx(date)]}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#2C1810' }}>{fmtDate(date)}</div>
            {nonWork && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Star size={11} color="#C07030" fill="#C07030" />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#C07030' }}>
                  {holiday || 'Wochenende'} – kein Arbeitstag
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none',
            backgroundColor: '#F7F3F0', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
          }}><X size={16} color="#8F5D30" /></button>
        </div>
        <div style={{ padding: '12px 20px 20px' }}>
          {abs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#B8A090', fontSize: 14 }}>
              Keine Abwesenheiten an diesem Tag
            </div>
          ) : abs.map((a) => {
            const member = members.find(m => m.id === a.userId);
            const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.Urlaub;
            const Icon = cfg.icon;
            return (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', marginBottom: 8,
                borderRadius: 12, backgroundColor: cfg.bg,
                border: `1px solid ${cfg.color}20`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  backgroundColor: member?.color || '#A86E3A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>{member?.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2C1810' }}>{member?.name}</div>
                  <div style={{ fontSize: 12, color: '#8F5D30', marginTop: 1 }}>
                    {fmtDate(new Date(a.start))} → {fmtDate(new Date(a.end))} · {a.days} {a.days === 1 ? 'Arbeitstag' : 'Arbeitstage'}
                  </div>
                </div>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  backgroundColor: `${cfg.color}15`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}><Icon size={14} color={cfg.color} /></div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── WeekGantt ──────────────────────────────────────────────

  const WeekGantt: React.FC<{ dates: Date[] }> = ({ dates }) => {
    const weekMembers = useMemo(() => {
      const memberMap = new Map<string, { member: TeamMember | undefined; absences: { date: Date; absence: CalendarAbsence }[] }>();
      dates.forEach(date => {
        const abs = getAbsencesForDate(date, absences, selectedMembers);
        abs.forEach(a => {
          if (!memberMap.has(a.userId)) {
            memberMap.set(a.userId, { member: members.find(m => m.id === a.userId), absences: [] });
          }
          memberMap.get(a.userId)!.absences.push({ date, absence: a });
        });
      });
      return [...memberMap.values()];
    }, [dates, absences, selectedMembers, members]);

    return (
      <div style={{ padding: '0 12px 100px' }}>
        {/* Day Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(7, 1fr)', gap: 0, marginBottom: 2 }}>
          <div style={{ padding: '6px 4px' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#8F5D30', letterSpacing: 1, textTransform: 'uppercase' }}>KW {getWeekNumber(dates[0])}</span>
          </div>
          {dates.map((date, i) => {
            const isToday_ = isSameDay(date, today);
            const holiday = getHolidayName(date);
            const weekend = date.getDay() === 0 || date.getDay() === 6;
            const nonWork = weekend || !!holiday;
            return (
              <div key={i} style={{ textAlign: 'center', padding: '6px 2px', opacity: weekend ? 0.4 : holiday ? 0.7 : 1 }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                  color: isToday_ ? '#A86E3A' : nonWork ? '#B8A090' : '#8F5D30',
                }}>{DAYS_SHORT[dayIdx(date)]}</div>
                <div style={{
                  fontSize: 14, fontWeight: 700, lineHeight: 1.3,
                  color: isToday_ ? '#fff' : holiday ? '#C07030' : nonWork ? '#B8A090' : '#2C1810',
                  backgroundColor: isToday_ ? '#A86E3A' : 'transparent',
                  borderRadius: 8, width: 26, height: 26, margin: '2px auto 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{date.getDate()}</div>
                {holiday && <Star size={7} color="#C07030" fill="#C07030" style={{ marginTop: 2 }} />}
              </div>
            );
          })}
        </div>

        {/* Holiday hints */}
        {dates.some(d => getHolidayName(d) && d.getDay() !== 0 && d.getDay() !== 6) && (
          <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(7, 1fr)', gap: 0, marginBottom: 6 }}>
            <div />
            {dates.map((date, i) => {
              const holiday = getHolidayName(date);
              const weekend = date.getDay() === 0 || date.getDay() === 6;
              if (!holiday || weekend) return <div key={i} />;
              return (
                <div key={i} style={{ textAlign: 'center', padding: '0 1px' }}>
                  <span style={{ fontSize: 7, color: '#C07030', fontWeight: 600, lineHeight: 1 }}>
                    {holiday.length > 12 ? holiday.slice(0, 10) + '…' : holiday}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Member Rows */}
        {weekMembers.length === 0 ? (
          <div style={{
            padding: '40px 20px', textAlign: 'center', color: '#B8A090',
            fontSize: 14, borderRadius: 14, backgroundColor: '#fff',
            border: '1px solid #F0EBE6', marginTop: 8,
          }}>
            Keine Abwesenheiten in dieser Woche
          </div>
        ) : weekMembers.map(({ member, absences: memberAbs }) => {
          if (!member) return null;
          const dayData = dates.map(date => {
            const dateStr = fmtKey(date);
            const match = memberAbs.find(a => fmtKey(a.date) === dateStr);
            return {
              date,
              absence: match?.absence || null,
              isWeekend: date.getDay() === 0 || date.getDay() === 6,
              isHoliday: !!getHolidayName(date),
              isToday: isSameDay(date, today),
            };
          });

          return (
            <div key={member.id} style={{
              display: 'grid', gridTemplateColumns: '72px repeat(7, 1fr)',
              gap: 0, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F0EBE6',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px', minWidth: 0 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: member.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 700,
                }}>{member.initials}</div>
                <span style={{
                  fontSize: 10, fontWeight: 600, color: '#2C1810',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{member.name.split(' ').pop()}</span>
              </div>

              {dayData.map((dd, i) => {
                const nonWork = dd.isWeekend || dd.isHoliday;
                const cfg = dd.absence ? (TYPE_CONFIG[dd.absence.type] || TYPE_CONFIG.Urlaub) : null;
                const prevHas = i > 0 && dayData[i - 1].absence && dayData[i - 1].absence!.id === dd.absence?.id;
                const nextHas = i < 6 && dayData[i + 1]?.absence && dayData[i + 1]?.absence!.id === dd.absence?.id;
                const borderRadius = dd.absence
                  ? `${prevHas ? 0 : 6}px ${nextHas ? 0 : 6}px ${nextHas ? 0 : 6}px ${prevHas ? 0 : 6}px`
                  : '6px';

                return (
                  <div key={i} style={{
                    height: 28, padding: '3px 1px', opacity: nonWork ? 0.35 : 1,
                    display: 'flex', alignItems: 'center',
                  }}>
                    {dd.absence && cfg ? (
                      <div style={{
                        width: '100%', height: '100%',
                        backgroundColor: cfg.color, borderRadius,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 1px 3px ${cfg.color}30`,
                      }}>
                        {!prevHas && (() => { const Icon = cfg.icon; return <Icon size={11} color="#fff" strokeWidth={2.5} />; })()}
                      </div>
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        backgroundColor: dd.isToday ? '#FDF5EE' : nonWork ? '#F5F2EF' : '#FAFAF9',
                        borderRadius: 6,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Week Summary */}
        {weekMembers.length > 0 && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 12,
            backgroundColor: '#fff', border: '1px solid #F0EBE6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: '#8F5D30', fontWeight: 600 }}>
              {weekMembers.length} Mitarbeiter abwesend in KW {getWeekNumber(dates[0])}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                const count = weekMembers.reduce((sum, wm) =>
                  sum + (wm.absences.some(a => a.absence.type === key) ? 1 : 0), 0);
                if (count === 0) return null;
                const Icon = cfg.icon;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Icon size={10} color={cfg.color} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{
          marginTop: 8, padding: '8px 14px', borderRadius: 12,
          display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 14, height: 8, borderRadius: 3, backgroundColor: cfg.color }} />
              <span style={{ fontSize: 9, color: '#8F5D30', fontWeight: 500 }}>{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "'Titillium Web', sans-serif", position: 'relative', maxWidth: 600, margin: '0 auto' }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── Header Controls ── */}
      <div style={{ padding: '4px 0 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={() => navigate(-1)} style={{
            width: 44, height: 44, borderRadius: 10, border: '1px solid #E8DDD4',
            backgroundColor: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
          }}><ChevronLeft size={18} color="#4A311A" /></button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#2C1810' }}>{headerTitle}</div>
          </div>
          <button onClick={() => navigate(1)} style={{
            width: 44, height: 44, borderRadius: 10, border: '1px solid #E8DDD4',
            backgroundColor: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
          }}><ChevronRight size={18} color="#4A311A" /></button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', backgroundColor: '#F0EBE6', borderRadius: 10, padding: 3, flex: 1 }}>
            {([{ key: 'month' as const, label: 'Monat' }, { key: 'week' as const, label: 'Woche' }]).map(v => (
              <button key={v.key} onClick={() => { setView(v.key); setSelectedDay(null); }} style={{
                flex: 1, padding: '7px 0', borderRadius: 8, border: 'none',
                fontSize: 12, fontWeight: 600, letterSpacing: 0.5, cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: view === v.key ? '#fff' : 'transparent',
                color: view === v.key ? '#A86E3A' : '#8F5D30',
                boxShadow: view === v.key ? '0 1px 4px rgba(168,110,58,0.12)' : 'none',
              }}>{v.label}</button>
            ))}
          </div>
          <button onClick={() => setFilterOpen(!filterOpen)} style={{
            width: 44, height: 44, borderRadius: 10,
            border: selectedMembers.size > 0 ? '2px solid #A86E3A' : '1px solid #E8DDD4',
            backgroundColor: selectedMembers.size > 0 ? '#FDF9F5' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
          }}>
            <Filter size={16} color={selectedMembers.size > 0 ? '#A86E3A' : '#8F5D30'} />
            {selectedMembers.size > 0 && (
              <div style={{
                position: 'absolute', top: -4, right: -4,
                width: 16, height: 16, borderRadius: '50%',
                backgroundColor: '#A86E3A', color: '#fff',
                fontSize: 9, fontWeight: 700, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>{selectedMembers.size}</div>
            )}
          </button>
          <button onClick={goToday} style={{
            padding: '0 12px', height: 44, borderRadius: 10, border: '1px solid #E8DDD4',
            backgroundColor: '#fff', fontSize: 11, fontWeight: 600,
            color: '#A86E3A', cursor: 'pointer', letterSpacing: 0.5,
          }}>Heute</button>
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div style={{
            padding: '12px 14px', marginBottom: 12, borderRadius: 14,
            backgroundColor: '#fff', border: '1px solid #E8DDD4',
            boxShadow: '0 4px 16px rgba(168,110,58,0.08)',
            animation: 'fadeIn 0.2s ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={14} color="#8F5D30" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4A311A', letterSpacing: 1.5, textTransform: 'uppercase' }}>Mitarbeiter filtern</span>
              </div>
              {selectedMembers.size > 0 && (
                <button onClick={() => setSelectedMembers(new Set())} style={{ fontSize: 11, color: '#A86E3A', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>Alle zeigen</button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {members.map(m => {
                const active = selectedMembers.has(m.id);
                return (
                  <button key={m.id} onClick={() => toggleMember(m.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 10px', borderRadius: 20,
                    border: active ? `2px solid ${m.color}` : '1px solid #E8DDD4',
                    backgroundColor: active ? `${m.color}10` : '#FDFBF9',
                    cursor: 'pointer', transition: 'all 0.15s', minHeight: 44,
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      backgroundColor: m.color, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700,
                    }}>{active ? <Check size={11} color="#fff" /> : m.initials}</div>
                    <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? m.color : '#4A311A' }}>
                      {m.name.split(' ').pop()}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingTop: 10, borderTop: '1px solid #F0EBE6', flexWrap: 'wrap' }}>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon size={11} color={cfg.color} />
                    <span style={{ fontSize: 10, color: '#8F5D30' }}>{cfg.label}</span>
                  </div>
                );
              })}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={11} color="#C07030" fill="#C07030" />
                <span style={{ fontSize: 10, color: '#8F5D30' }}>Feiertag</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: '#B8A090', fontSize: 13, fontWeight: 600 }}>
          Daten werden geladen…
        </div>
      )}

      {/* ── Month View ── */}
      {!loading && view === 'month' && (
        <div style={{ padding: '0 0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, marginBottom: 4 }}>
            {DAYS_SHORT.map((d, i) => (
              <div key={d} style={{
                textAlign: 'center', fontSize: 10, fontWeight: 700,
                color: i >= 5 ? '#C4A882' : '#8F5D30',
                letterSpacing: 1.5, textTransform: 'uppercase', padding: '6px 0',
              }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {monthGrid.map((date, i) => {
              if (!date) return <div key={`e-${i}`} />;
              const isToday_ = isSameDay(date, today);
              const isSelected = selectedDay !== null && isSameDay(date, selectedDay);
              const weekend = date.getDay() === 0 || date.getDay() === 6;
              const holiday = getHolidayName(date);
              const nonWork = weekend || !!holiday;
              const hasAbs = getAbsencesForDate(date, absences, selectedMembers).length > 0;

              return (
                <button key={i} onClick={() => setSelectedDay(isSelected ? null : date)} style={{
                  aspectRatio: '1', borderRadius: 12, border: 'none',
                  backgroundColor: isSelected ? '#A86E3A'
                    : isToday_ ? '#FDF5EE'
                    : holiday && !weekend ? '#FFF8F0'
                    : 'transparent',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', position: 'relative',
                  opacity: weekend ? 0.35 : holiday ? 0.7 : 1,
                  fontFamily: 'inherit',
                }}>
                  {holiday && !isSelected && !weekend && (
                    <Star size={7} color="#C07030" fill="#C07030" style={{ position: 'absolute', top: 3, right: 3 }} />
                  )}
                  <span style={{
                    fontSize: 15, fontWeight: isToday_ || holiday ? 700 : 500,
                    color: isSelected ? '#fff'
                      : isToday_ ? '#A86E3A'
                      : holiday ? '#C07030'
                      : weekend ? '#B8A090' : '#2C1810',
                  }}>{date.getDate()}</span>
                  {!isSelected && <AbsenceCount date={date} />}
                  {isSelected && hasAbs && (
                    <div style={{
                      position: 'absolute', bottom: 3,
                      width: 14, height: 3, borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.6)',
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Hint */}
          <div style={{
            fontSize: 10, color: '#B8A090', textAlign: 'center',
            marginTop: 12, marginBottom: 4, fontWeight: 500,
          }}>
            Die Zahl im Kalender zeigt die Anzahl abwesender Mitarbeiter an diesem Tag
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
            {[
              { value: monthStats.workdaysInMonth, label: 'Arbeitstage' },
              { value: monthStats.totalWorkDays, label: 'Tage Abwesenheit' },
              { value: monthStats.uniquePeople, label: 'MA betroffen' },
            ].map(stat => (
              <div key={stat.label} style={{
                padding: '12px 10px', borderRadius: 14,
                backgroundColor: '#fff', border: '1px solid #F0EBE6', textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#A86E3A' }}>{stat.value}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#8F5D30', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Holidays */}
          {monthStats.holidaysInMonth.length > 0 && (
            <div style={{
              marginTop: 12, padding: '12px 14px', borderRadius: 14,
              backgroundColor: '#FFF8F0', border: '1px solid #F0E0C8',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Star size={12} color="#C07030" fill="#C07030" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#C07030', letterSpacing: 1, textTransform: 'uppercase' }}>
                  Feiertage im {MONTHS_DE[month]}
                </span>
              </div>
              {monthStats.holidaysInMonth.map((h, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '5px 0',
                  borderTop: i > 0 ? '1px solid #F0E0C830' : 'none',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#4A311A' }}>{h.name}</span>
                  <span style={{ fontSize: 12, color: '#8F5D30' }}>
                    {DAYS_SHORT[dayIdx(h.date)]}, {pad(h.date.getDate())}.{pad(h.date.getMonth() + 1)}.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Week View ── */}
      {!loading && view === 'week' && <WeekGantt dates={weekDates} />}

      {/* ── Day Detail Overlay ── */}
      {selectedDay && view === 'month' && (
        <>
          <div onClick={() => setSelectedDay(null)} style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(74,49,26,0.2)', zIndex: 90,
          }} />
          <DayDetail date={selectedDay} onClose={() => setSelectedDay(null)} />
        </>
      )}
    </div>
  );
};

export default TeamCalendar;
