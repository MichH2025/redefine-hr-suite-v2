
import React, { useState, useEffect } from 'react';
import { User, TimeEntry } from '../types';
import { ICONS } from '../constants';
import { supabase } from '../services/supabaseClient';
import { exportTimeEntriesToCSV } from '../services/reportService';

const TimeTracking: React.FC<{ user: User }> = ({ user }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const fetchEntries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(20);

    if (data) {
      setEntries(data.map(d => ({
        id: d.id,
        userId: d.user_id,
        date: d.date,
        startTime: d.start_time,
        endTime: d.end_time,
        duration: d.duration
      })));
    }
    setLoading(false);
  };

  const handleToggle = async () => {
    if (isTracking) {
      const now = new Date();
      const startStr = startTime?.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) || '00:00';
      const endStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      const durationHours = Number((elapsed / 3600).toFixed(2));

      const { error } = await supabase.from('time_entries').insert({
        user_id: user.id,
        date: now.toISOString().split('T')[0],
        start_time: startStr,
        end_time: endStr,
        duration: durationHours
      });

      if (!error) {
        fetchEntries();
      }
      
      setIsTracking(false);
      setStartTime(null);
      setElapsed(0);
    } else {
      setStartTime(new Date());
      setIsTracking(true);
    }
  };

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      <div className="border-b border-brand/10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-darkest">Zeiterfassung</h1>
          <p className="text-brand/50 text-sm mt-1 uppercase tracking-widest">Optionales Performance-Tracking für REDEFINE Mitarbeiter</p>
        </div>
        {entries.length > 0 && (
          <button 
            onClick={() => exportTimeEntriesToCSV(entries, user.name)}
            className="flex items-center gap-2 px-4 py-2 border border-brand/20 text-brand-darkest text-[10px] font-bold uppercase tracking-widest hover:bg-brand-soft transition-all"
          >
            <ICONS.Download size={14} /> Bericht exportieren
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 border border-brand/20 bg-brand-darkest text-white p-8 premium-shadow flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center mb-6 shadow-lg shadow-brand/20">
            <ICONS.Timer size={32} />
          </div>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand/40 mb-2">Live Tracker</h2>
          <div className="text-5xl font-bold mb-8 tabular-nums tracking-tighter text-white">
            {isTracking ? formatElapsed(elapsed) : '00:00:00'}
          </div>
          <button
            onClick={handleToggle}
            className={`w-full py-4 font-bold uppercase tracking-widest transition-all shadow-lg ${
              isTracking 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' 
                : 'bg-brand hover:bg-brand-dark shadow-brand/20'
            }`}
          >
            {isTracking ? 'Stoppen' : 'Starten'}
          </button>
          {isTracking && (
            <p className="mt-4 text-[10px] text-brand/40 uppercase font-bold tracking-widest">Gestartet um {startTime?.toLocaleTimeString()}</p>
          )}
        </div>

        <div className="lg:col-span-2 border border-brand/10 bg-white premium-shadow overflow-hidden">
          <div className="p-6 border-b border-brand/5 font-bold uppercase tracking-widest text-xs text-brand-darkest">Deine letzten Einträge</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-brand-soft/50 text-[10px] font-bold uppercase text-brand/60 tracking-tighter">
                  <th className="px-6 py-4">Datum</th>
                  <th className="px-6 py-4">Start</th>
                  <th className="px-6 py-4">Ende</th>
                  <th className="px-6 py-4 text-right">Stunden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-xs text-brand/30 uppercase font-bold tracking-widest">Lade Zeitdaten...</td>
                  </tr>
                ) : entries.length > 0 ? (
                  entries.map(entry => (
                    <tr key={entry.id} className="text-sm hover:bg-brand-soft/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-brand-darkest">{entry.date}</td>
                      <td className="px-6 py-4 text-brand/70">{entry.startTime}</td>
                      <td className="px-6 py-4 text-brand/70">{entry.endTime}</td>
                      <td className="px-6 py-4 text-right font-bold text-brand">{entry.duration?.toFixed(2)} h</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-xs text-brand/30 uppercase font-bold tracking-widest">Noch keine Einträge vorhanden</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTracking;
