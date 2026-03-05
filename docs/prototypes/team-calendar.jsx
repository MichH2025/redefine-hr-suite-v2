import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar, Filter, Users, X, Palmtree, Home, Heart, Briefcase, Check, Star } from "lucide-react";

// ── Berliner Feiertage ─────────────────────────────────────
function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getBerlinHolidays(year) {
  const easter = getEasterSunday(year);
  const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const holidays = [
    { date: `${year}-01-01`, name: "Neujahr" },
    { date: `${year}-03-08`, name: "Internationaler Frauentag" },
    { date: fmt(addDays(easter, -2)), name: "Karfreitag" },
    { date: fmt(easter), name: "Ostersonntag" },
    { date: fmt(addDays(easter, 1)), name: "Ostermontag" },
    { date: `${year}-05-01`, name: "Tag der Arbeit" },
    { date: fmt(addDays(easter, 39)), name: "Christi Himmelfahrt" },
    { date: fmt(addDays(easter, 49)), name: "Pfingstsonntag" },
    { date: fmt(addDays(easter, 50)), name: "Pfingstmontag" },
    { date: `${year}-10-03`, name: "Tag der Deutschen Einheit" },
    { date: `${year}-12-25`, name: "1. Weihnachtsfeiertag" },
    { date: `${year}-12-26`, name: "2. Weihnachtsfeiertag" },
  ];

  const map = {};
  holidays.forEach(h => { map[h.date] = h.name; });
  return map;
}

const HOLIDAY_CACHE = {};
function getHolidayName(date) {
  const y = date.getFullYear();
  if (!HOLIDAY_CACHE[y]) HOLIDAY_CACHE[y] = getBerlinHolidays(y);
  const key = `${y}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return HOLIDAY_CACHE[y][key] || null;
}

function isNonWorkday(date) {
  return date.getDay() === 0 || date.getDay() === 6 || !!getHolidayName(date);
}

// ── Mock Data ──────────────────────────────────────────────
const TEAM_MEMBERS = [
  { id: "1", name: "Michael Hülsbusch", role: "CEO", initials: "MH", color: "#A86E3A" },
  { id: "2", name: "Kempchen", role: "Employee", initials: "KE", color: "#5B8C5A" },
  { id: "3", name: "Freiberger", role: "Employee", initials: "FR", color: "#4A7FB5" },
  { id: "4", name: "Cordesius", role: "Employee", initials: "CO", color: "#8B5E8B" },
  { id: "5", name: "Gauthier", role: "Team Lead", initials: "GA", color: "#C07030" },
  { id: "6", name: "Webb", role: "Employee", initials: "WE", color: "#3A8A8A" },
];

const ABSENCES = [
  { id: 1, userId: "2", type: "Urlaub", start: "2026-01-02", end: "2026-01-02", status: "APPROVED" },
  { id: 2, userId: "3", type: "Urlaub", start: "2026-01-19", end: "2026-01-23", status: "APPROVED" },
  { id: 3, userId: "1", type: "Urlaub", start: "2026-01-21", end: "2026-01-30", status: "APPROVED" },
  { id: 4, userId: "2", type: "Urlaub", start: "2026-01-26", end: "2026-01-29", status: "APPROVED" },
  { id: 5, userId: "4", type: "Urlaub", start: "2026-01-27", end: "2026-01-27", status: "APPROVED" },
  { id: 6, userId: "4", type: "Urlaub", start: "2026-01-29", end: "2026-01-29", status: "APPROVED" },
  { id: 7, userId: "5", type: "Urlaub", start: "2026-02-02", end: "2026-02-06", status: "APPROVED" },
  { id: 8, userId: "1", type: "Urlaub", start: "2026-02-11", end: "2026-02-16", status: "APPROVED" },
  { id: 9, userId: "6", type: "Homeoffice", start: "2026-02-12", end: "2026-02-13", status: "APPROVED" },
  { id: 10, userId: "1", type: "Urlaub", start: "2026-02-27", end: "2026-03-02", status: "APPROVED" },
  { id: 11, userId: "5", type: "Urlaub", start: "2026-03-09", end: "2026-03-13", status: "APPROVED" },
  { id: 12, userId: "2", type: "Urlaub", start: "2026-04-01", end: "2026-04-06", status: "APPROVED" },
  { id: 13, userId: "3", type: "Krankheit", start: "2026-02-18", end: "2026-02-20", status: "APPROVED" },
  { id: 14, userId: "6", type: "Sonderurlaub", start: "2026-03-03", end: "2026-03-04", status: "APPROVED" },
  { id: 15, userId: "2", type: "Homeoffice", start: "2026-02-09", end: "2026-02-10", status: "APPROVED" },
];

function calcWorkDays(startStr, endStr) {
  let count = 0;
  const cur = new Date(startStr);
  const end = new Date(endStr);
  while (cur <= end) {
    if (!isNonWorkday(cur)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}
ABSENCES.forEach(a => { a.days = calcWorkDays(a.start, a.end); });

// ── Helpers ────────────────────────────────────────────────
const TYPE_CONFIG = {
  Urlaub: { icon: Palmtree, color: "#A86E3A", bg: "#F7F3F0", label: "Urlaub" },
  Homeoffice: { icon: Home, color: "#5B8C5A", bg: "#F0F5F0", label: "Homeoffice" },
  Krankheit: { icon: Heart, color: "#C04040", bg: "#FDF2F2", label: "Krankheit" },
  Sonderurlaub: { icon: Briefcase, color: "#4A7FB5", bg: "#F0F4FA", label: "Sonderurlaub" },
};

const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1; };

const getWeekDates = (date) => {
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

const getAbsencesForDate = (date, absences, selectedMembers) => {
  const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return absences.filter((a) => {
    if (selectedMembers.size > 0 && !selectedMembers.has(a.userId)) return false;
    return dateStr >= a.start && dateStr <= a.end;
  });
};

const getWeekNumber = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
};

const MONTHS_DE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const DAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// ── Main Component ─────────────────────────────────────────
export default function TeamCalendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState("month");
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const navigate = useCallback((dir) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === "month") d.setMonth(d.getMonth() + dir);
      else d.setDate(d.getDate() + dir * 7);
      return d;
    });
    setSelectedDay(null);
  }, [view]);

  const goToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(null);
  };

  const toggleMember = (id) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearFilter = () => setSelectedMembers(new Set());

  const monthGrid = useMemo(() => {
    const firstDay = getFirstDayOfMonth(year, month);
    const dim = getDaysInMonth(year, month);
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= dim; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [year, month]);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const headerTitle = view === "month"
    ? `${MONTHS_DE[month]} ${year}`
    : `KW ${getWeekNumber(weekDates[0])} · ${MONTHS_DE[weekDates[0].getMonth()]} ${weekDates[0].getFullYear()}`;

  // ── Month Stats ──
  const monthStats = useMemo(() => {
    const mStart = new Date(year, month, 1);
    const mEnd = new Date(year, month + 1, 0);
    const monthAbs = ABSENCES.filter(a => {
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

    const holidaysInMonth = [];
    for (let d = 1; d <= getDaysInMonth(year, month); d++) {
      const date = new Date(year, month, d);
      const name = getHolidayName(date);
      if (name && date.getDay() !== 0 && date.getDay() !== 6) holidaysInMonth.push({ date, name });
    }

    // Count workdays in month
    let workdaysInMonth = 0;
    for (let d = 1; d <= getDaysInMonth(year, month); d++) {
      if (!isNonWorkday(new Date(year, month, d))) workdaysInMonth++;
    }

    return { totalWorkDays, uniquePeople, holidaysInMonth, workdaysInMonth };
  }, [year, month, selectedMembers]);

  // ── AbsenceCount ──
  const AbsenceCount = ({ date }) => {
    const abs = getAbsencesForDate(date, ABSENCES, selectedMembers);
    if (abs.length === 0) return null;
    return (
      <span style={{
        fontSize: 9, fontWeight: 700, marginTop: 1,
        color: abs.length >= 4 ? "#C04040" : abs.length >= 2 ? "#A86E3A" : "#8F5D30",
        lineHeight: 1
      }}>{abs.length}</span>
    );
  };

  // ── Day Detail Bottom Sheet ──
  const DayDetail = ({ date, onClose }) => {
    const abs = getAbsencesForDate(date, ABSENCES, selectedMembers);
    const holiday = getHolidayName(date);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const nonWork = weekend || !!holiday;
    const dayIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;

    return (
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: "#fff", borderRadius: "20px 20px 0 0",
        boxShadow: "0 -8px 40px rgba(168,110,58,0.15)",
        zIndex: 100, maxHeight: "65vh", overflow: "auto",
        animation: "slideUp 0.3s ease-out",
        paddingBottom: "env(safe-area-inset-bottom, 20px)"
      }}>
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #F0EBE6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "#8F5D30", fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>
              {DAYS_SHORT[dayIdx]}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#2C1810" }}>{fmtDate(date)}</div>
            {nonWork && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Star size={11} color="#C07030" fill="#C07030" />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#C07030" }}>
                  {holiday || "Wochenende"} – kein Arbeitstag
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%", border: "none",
            backgroundColor: "#F7F3F0", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer"
          }}><X size={16} color="#8F5D30" /></button>
        </div>
        <div style={{ padding: "12px 20px 20px" }}>
          {abs.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#B8A090", fontSize: 14 }}>
              Keine Abwesenheiten an diesem Tag
            </div>
          ) : abs.map((a) => {
            const member = TEAM_MEMBERS.find(m => m.id === a.userId);
            const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.Urlaub;
            const Icon = cfg.icon;
            return (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", marginBottom: 8,
                borderRadius: 12, backgroundColor: cfg.bg,
                border: `1px solid ${cfg.color}20`
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  backgroundColor: member?.color || "#A86E3A",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0
                }}>{member?.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#2C1810" }}>{member?.name}</div>
                  <div style={{ fontSize: 12, color: "#8F5D30", marginTop: 1 }}>
                    {fmtDate(new Date(a.start))} → {fmtDate(new Date(a.end))} · {a.days} {a.days === 1 ? "Arbeitstag" : "Arbeitstage"}
                  </div>
                </div>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  backgroundColor: `${cfg.color}15`, display: "flex",
                  alignItems: "center", justifyContent: "center"
                }}><Icon size={14} color={cfg.color} /></div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Week Gantt Grid ──
  const WeekGantt = ({ dates }) => {
    // Find all members with absences this week
    const weekMembers = useMemo(() => {
      const memberMap = new Map();
      dates.forEach(date => {
        const abs = getAbsencesForDate(date, ABSENCES, selectedMembers);
        abs.forEach(a => {
          if (!memberMap.has(a.userId)) {
            memberMap.set(a.userId, { member: TEAM_MEMBERS.find(m => m.id === a.userId), absences: [] });
          }
          memberMap.get(a.userId).absences.push({ date, absence: a });
        });
      });
      return [...memberMap.values()];
    }, [dates, selectedMembers]);

    const colWidth = "1fr";

    return (
      <div style={{ padding: "0 12px 100px" }}>
        {/* Day Header Row (X-Axis) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `72px repeat(7, ${colWidth})`,
          gap: 0, marginBottom: 2
        }}>
          <div style={{ padding: "6px 4px" }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#8F5D30", letterSpacing: 1, textTransform: "uppercase" }}>KW {getWeekNumber(dates[0])}</span>
          </div>
          {dates.map((date, i) => {
            const isToday_ = isSameDay(date, today);
            const holiday = getHolidayName(date);
            const weekend = date.getDay() === 0 || date.getDay() === 6;
            const nonWork = weekend || !!holiday;
            const dayIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
            return (
              <div key={i} style={{
                textAlign: "center", padding: "6px 2px",
                opacity: weekend ? 0.4 : holiday ? 0.7 : 1
              }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                  color: isToday_ ? "#A86E3A" : nonWork ? "#B8A090" : "#8F5D30"
                }}>{DAYS_SHORT[dayIdx]}</div>
                <div style={{
                  fontSize: 14, fontWeight: 700, lineHeight: 1.3,
                  color: isToday_ ? "#fff" : holiday ? "#C07030" : nonWork ? "#B8A090" : "#2C1810",
                  backgroundColor: isToday_ ? "#A86E3A" : "transparent",
                  borderRadius: 8, width: 26, height: 26, margin: "2px auto 0",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>{date.getDate()}</div>
                {holiday && (
                  <Star size={7} color="#C07030" fill="#C07030" style={{ marginTop: 2 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Holiday hints row */}
        {dates.some(d => getHolidayName(d) && d.getDay() !== 0 && d.getDay() !== 6) && (
          <div style={{
            display: "grid", gridTemplateColumns: `72px repeat(7, ${colWidth})`,
            gap: 0, marginBottom: 6
          }}>
            <div />
            {dates.map((date, i) => {
              const holiday = getHolidayName(date);
              const weekend = date.getDay() === 0 || date.getDay() === 6;
              if (!holiday || weekend) return <div key={i} />;
              return (
                <div key={i} style={{ textAlign: "center", padding: "0 1px" }}>
                  <span style={{ fontSize: 7, color: "#C07030", fontWeight: 600, lineHeight: 1 }}>
                    {holiday.length > 12 ? holiday.slice(0, 10) + "…" : holiday}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Member Rows (Y-Axis) with Gantt Bars */}
        {weekMembers.length === 0 ? (
          <div style={{
            padding: "40px 20px", textAlign: "center", color: "#B8A090",
            fontSize: 14, borderRadius: 14, backgroundColor: "#fff",
            border: "1px solid #F0EBE6", marginTop: 8
          }}>
            Keine Abwesenheiten in dieser Woche
          </div>
        ) : (
          weekMembers.map(({ member, absences }) => {
            if (!member) return null;
            // Build day-by-day data for this member
            const dayData = dates.map(date => {
              const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
              const match = absences.find(a => {
                const ds = `${a.date.getFullYear()}-${pad(a.date.getMonth() + 1)}-${pad(a.date.getDate())}`;
                return ds === dateStr;
              });
              return {
                date,
                absence: match?.absence || null,
                isWeekend: date.getDay() === 0 || date.getDay() === 6,
                isHoliday: !!getHolidayName(date),
                isToday: isSameDay(date, today)
              };
            });

            return (
              <div key={member.id} style={{
                display: "grid",
                gridTemplateColumns: `72px repeat(7, ${colWidth})`,
                gap: 0, alignItems: "center",
                padding: "6px 0",
                borderBottom: "1px solid #F0EBE6"
              }}>
                {/* Member name (Y-axis) */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 4px", minWidth: 0 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    backgroundColor: member.color, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, fontWeight: 700
                  }}>{member.initials}</div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: "#2C1810",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}>{member.name.split(" ").pop()}</span>
                </div>

                {/* Day cells with bars */}
                {dayData.map((dd, i) => {
                  const nonWork = dd.isWeekend || dd.isHoliday;
                  const cfg = dd.absence ? (TYPE_CONFIG[dd.absence.type] || TYPE_CONFIG.Urlaub) : null;

                  // Determine bar shape: connected bars for consecutive days
                  const prevHas = i > 0 && dayData[i - 1].absence && dayData[i - 1].absence.id === dd.absence?.id;
                  const nextHas = i < 6 && dayData[i + 1]?.absence && dayData[i + 1]?.absence.id === dd.absence?.id;
                  const borderRadius = dd.absence
                    ? `${prevHas ? 0 : 6}px ${nextHas ? 0 : 6}px ${nextHas ? 0 : 6}px ${prevHas ? 0 : 6}px`
                    : "6px";

                  return (
                    <div key={i} style={{
                      height: 28, padding: "3px 1px",
                      opacity: nonWork ? 0.35 : 1,
                      display: "flex", alignItems: "center"
                    }}>
                      {dd.absence ? (
                        <div style={{
                          width: "100%", height: "100%",
                          backgroundColor: cfg.color,
                          borderRadius,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: `0 1px 3px ${cfg.color}30`
                        }}>
                          {/* Show type icon only on first cell of a span */}
                          {!prevHas && (() => {
                            const Icon = cfg.icon;
                            return <Icon size={11} color="#fff" strokeWidth={2.5} />;
                          })()}
                        </div>
                      ) : (
                        <div style={{
                          width: "100%", height: "100%",
                          backgroundColor: dd.isToday ? "#FDF5EE" : nonWork ? "#F5F2EF" : "#FAFAF9",
                          borderRadius: 6
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}

        {/* Week summary */}
        {weekMembers.length > 0 && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 12,
            backgroundColor: "#fff", border: "1px solid #F0EBE6",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span style={{ fontSize: 11, color: "#8F5D30", fontWeight: 600 }}>
              {weekMembers.length} {weekMembers.length === 1 ? "Mitarbeiter" : "Mitarbeiter"} abwesend in KW {getWeekNumber(dates[0])}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                const count = weekMembers.reduce((sum, wm) => {
                  return sum + (wm.absences.some(a => a.absence.type === key) ? 1 : 0);
                }, 0);
                if (count === 0) return null;
                const Icon = cfg.icon;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 3 }}>
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
          marginTop: 8, padding: "8px 14px", borderRadius: 12,
          display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center"
        }}>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 14, height: 8, borderRadius: 3, backgroundColor: cfg.color }} />
              <span style={{ fontSize: 9, color: "#8F5D30", fontWeight: 500 }}>{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      maxWidth: 430, margin: "0 auto", minHeight: "100vh",
      backgroundColor: "#FDFBF9", fontFamily: "'Titillium Web', sans-serif",
      position: "relative", overflow: "hidden"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@300;400;600;700&display=swap');
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        padding: "12px 16px 0",
        paddingTop: "max(env(safe-area-inset-top, 20px), 20px)",
        backgroundColor: "#FDFBF9", position: "sticky", top: 0, zIndex: 50
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#A86E3A", letterSpacing: 2, textTransform: "uppercase" }}>Redefine</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: "#B8A090", letterSpacing: 2.5, textTransform: "uppercase" }}>Team-Kalender</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#5B8C5A" }} />
            <span style={{ fontSize: 9, color: "#8F5D30", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Live · Berlin</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={() => navigate(-1)} style={{
            width: 36, height: 36, borderRadius: 10, border: "1px solid #E8DDD4",
            backgroundColor: "#fff", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer"
          }}><ChevronLeft size={18} color="#4A311A" /></button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#2C1810" }}>{headerTitle}</div>
          </div>
          <button onClick={() => navigate(1)} style={{
            width: 36, height: 36, borderRadius: 10, border: "1px solid #E8DDD4",
            backgroundColor: "#fff", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer"
          }}><ChevronRight size={18} color="#4A311A" /></button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ display: "flex", backgroundColor: "#F0EBE6", borderRadius: 10, padding: 3, flex: 1 }}>
            {[{ key: "month", label: "Monat" }, { key: "week", label: "Woche" }].map(v => (
              <button key={v.key} onClick={() => { setView(v.key); setSelectedDay(null); }} style={{
                flex: 1, padding: "7px 0", borderRadius: 8, border: "none",
                fontSize: 12, fontWeight: 600, letterSpacing: 0.5, cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: view === v.key ? "#fff" : "transparent",
                color: view === v.key ? "#A86E3A" : "#8F5D30",
                boxShadow: view === v.key ? "0 1px 4px rgba(168,110,58,0.12)" : "none"
              }}>{v.label}</button>
            ))}
          </div>
          <button onClick={() => setFilterOpen(!filterOpen)} style={{
            width: 36, height: 36, borderRadius: 10,
            border: selectedMembers.size > 0 ? "2px solid #A86E3A" : "1px solid #E8DDD4",
            backgroundColor: selectedMembers.size > 0 ? "#FDF9F5" : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", position: "relative"
          }}>
            <Filter size={16} color={selectedMembers.size > 0 ? "#A86E3A" : "#8F5D30"} />
            {selectedMembers.size > 0 && (
              <div style={{
                position: "absolute", top: -4, right: -4,
                width: 16, height: 16, borderRadius: "50%",
                backgroundColor: "#A86E3A", color: "#fff",
                fontSize: 9, fontWeight: 700, display: "flex",
                alignItems: "center", justifyContent: "center"
              }}>{selectedMembers.size}</div>
            )}
          </button>
          <button onClick={goToday} style={{
            padding: "0 12px", borderRadius: 10, border: "1px solid #E8DDD4",
            backgroundColor: "#fff", fontSize: 11, fontWeight: 600,
            color: "#A86E3A", cursor: "pointer", letterSpacing: 0.5
          }}>Heute</button>
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div style={{
            padding: "12px 14px", marginBottom: 12, borderRadius: 14,
            backgroundColor: "#fff", border: "1px solid #E8DDD4",
            boxShadow: "0 4px 16px rgba(168,110,58,0.08)",
            animation: "fadeIn 0.2s ease-out"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={14} color="#8F5D30" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#4A311A", letterSpacing: 1.5, textTransform: "uppercase" }}>Mitarbeiter filtern</span>
              </div>
              {selectedMembers.size > 0 && (
                <button onClick={clearFilter} style={{ fontSize: 11, color: "#A86E3A", fontWeight: 600, border: "none", background: "none", cursor: "pointer" }}>Alle zeigen</button>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TEAM_MEMBERS.map(m => {
                const active = selectedMembers.has(m.id);
                return (
                  <button key={m.id} onClick={() => toggleMember(m.id)} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 10px", borderRadius: 20,
                    border: active ? `2px solid ${m.color}` : "1px solid #E8DDD4",
                    backgroundColor: active ? `${m.color}10` : "#FDFBF9",
                    cursor: "pointer", transition: "all 0.15s"
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%",
                      backgroundColor: m.color, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 700
                    }}>{active ? <Check size={11} color="#fff" /> : m.initials}</div>
                    <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? m.color : "#4A311A" }}>
                      {m.name.split(" ").pop()}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 12, paddingTop: 10, borderTop: "1px solid #F0EBE6", flexWrap: "wrap" }}>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon size={11} color={cfg.color} />
                    <span style={{ fontSize: 10, color: "#8F5D30" }}>{cfg.label}</span>
                  </div>
                );
              })}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={11} color="#C07030" fill="#C07030" />
                <span style={{ fontSize: 10, color: "#8F5D30" }}>Feiertag</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Month View ── */}
      {view === "month" && (
        <div style={{ padding: "0 16px 100px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0, marginBottom: 4 }}>
            {DAYS_SHORT.map((d, i) => (
              <div key={d} style={{
                textAlign: "center", fontSize: 10, fontWeight: 700,
                color: i >= 5 ? "#C4A882" : "#8F5D30",
                letterSpacing: 1.5, textTransform: "uppercase", padding: "6px 0"
              }}>{d}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {monthGrid.map((date, i) => {
              if (!date) return <div key={`e-${i}`} />;
              const isToday_ = isSameDay(date, today);
              const isSelected = selectedDay && isSameDay(date, selectedDay);
              const weekend = date.getDay() === 0 || date.getDay() === 6;
              const holiday = getHolidayName(date);
              const nonWork = weekend || !!holiday;
              const hasAbs = getAbsencesForDate(date, ABSENCES, selectedMembers).length > 0;

              return (
                <button key={i} onClick={() => setSelectedDay(isSelected ? null : date)} style={{
                  aspectRatio: "1", borderRadius: 12, border: "none",
                  backgroundColor: isSelected ? "#A86E3A"
                    : isToday_ ? "#FDF5EE"
                    : holiday && !weekend ? "#FFF8F0"
                    : "transparent",
                  cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s", position: "relative",
                  opacity: weekend ? 0.35 : holiday ? 0.7 : 1
                }}>
                  {holiday && !isSelected && !weekend && (
                    <Star size={7} color="#C07030" fill="#C07030" style={{ position: "absolute", top: 3, right: 3 }} />
                  )}
                  <span style={{
                    fontSize: 15, fontWeight: isToday_ || holiday ? 700 : 500,
                    color: isSelected ? "#fff"
                      : isToday_ ? "#A86E3A"
                      : holiday ? "#C07030"
                      : weekend ? "#B8A090" : "#2C1810"
                  }}>{date.getDate()}</span>
                  {!isSelected && <AbsenceCount date={date} />}
                  {isSelected && hasAbs && (
                    <div style={{
                      position: "absolute", bottom: 3,
                      width: 14, height: 3, borderRadius: 2,
                      backgroundColor: "rgba(255,255,255,0.6)"
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div style={{
            fontSize: 10, color: "#B8A090", textAlign: "center",
            marginTop: 12, marginBottom: 4, fontWeight: 500
          }}>
            Die Zahl im Kalender zeigt die Anzahl abwesender Mitarbeiter an diesem Tag
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
            {[
              { value: monthStats.workdaysInMonth, label: "Arbeitstage" },
              { value: monthStats.totalWorkDays, label: "Tage Abwesenheit" },
              { value: monthStats.uniquePeople, label: "MA betroffen" },
            ].map(stat => (
              <div key={stat.label} style={{
                padding: "12px 10px", borderRadius: 14,
                backgroundColor: "#fff", border: "1px solid #F0EBE6", textAlign: "center"
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#A86E3A" }}>{stat.value}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: "#8F5D30", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Holidays this month */}
          {monthStats.holidaysInMonth.length > 0 && (
            <div style={{
              marginTop: 12, padding: "12px 14px", borderRadius: 14,
              backgroundColor: "#FFF8F0", border: "1px solid #F0E0C8"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Star size={12} color="#C07030" fill="#C07030" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#C07030", letterSpacing: 1, textTransform: "uppercase" }}>
                  Feiertage im {MONTHS_DE[month]}
                </span>
              </div>
              {monthStats.holidaysInMonth.map((h, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "5px 0",
                  borderTop: i > 0 ? "1px solid #F0E0C830" : "none"
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#4A311A" }}>{h.name}</span>
                  <span style={{ fontSize: 12, color: "#8F5D30" }}>
                    {DAYS_SHORT[h.date.getDay() === 0 ? 6 : h.date.getDay() - 1]}, {pad(h.date.getDate())}.{pad(h.date.getMonth() + 1)}.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Week View ── */}
      {view === "week" && (
        <WeekGantt dates={weekDates} />
      )}

      {/* ── Day Detail ── */}
      {selectedDay && view === "month" && (
        <>
          <div onClick={() => setSelectedDay(null)} style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(74,49,26,0.2)", zIndex: 90
          }} />
          <DayDetail date={selectedDay} onClose={() => setSelectedDay(null)} />
        </>
      )}

      {/* ── Bottom Nav ── */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        backgroundColor: "rgba(253,251,249,0.92)", backdropFilter: "blur(20px)",
        borderTop: "1px solid #F0EBE6",
        paddingBottom: "max(env(safe-area-inset-bottom, 20px), 20px)", zIndex: 80
      }}>
        <div style={{ display: "flex", justifyContent: "space-around", padding: "8px 0 4px" }}>
          {[
            { icon: Calendar, label: "Dashboard", active: false },
            { icon: Palmtree, label: "Abwesenheit", active: false },
            { icon: Users, label: "Kalender", active: true },
            { icon: Briefcase, label: "Dokumente", active: false },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button key={item.label} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 2, border: "none", background: "none", cursor: "pointer", padding: "4px 12px"
              }}>
                <Icon size={20} color={item.active ? "#A86E3A" : "#B8A090"} strokeWidth={item.active ? 2.2 : 1.5} />
                <span style={{ fontSize: 9, fontWeight: item.active ? 700 : 500, color: item.active ? "#A86E3A" : "#B8A090", letterSpacing: 0.5 }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
