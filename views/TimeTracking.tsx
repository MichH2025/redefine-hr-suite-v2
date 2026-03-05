
import React, { useState, useEffect } from 'react';
import { User, TimeEntry } from '../types';
import { ICONS } from '../constants';
import { supabase } from '../services/supabaseClient';
import { exportTimeEntriesToCSV } from '../services/reportService';

const TimeTracking: React.FC<{ user: User }> = ({ user }) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    breakMinutes: '0',
  });

  // Edit state
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deleteEntry, setDeleteEntry] = useState<TimeEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

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

  const calcDuration = (): number | null => {
    if (!form.startTime || !form.endTime) return null;
    const [sh, sm] = form.startTime.split(':').map(Number);
    const [eh, em] = form.endTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (endMin <= startMin) return null;
    const breakMin = Math.max(0, parseInt(form.breakMinutes) || 0);
    const netMin = endMin - startMin - breakMin;
    if (netMin <= 0) return null;
    return Number((netMin / 60).toFixed(2));
  };

  const calcEditDuration = (): number | null => {
    if (!editForm.startTime || !editForm.endTime) return null;
    const [sh, sm] = editForm.startTime.split(':').map(Number);
    const [eh, em] = editForm.endTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (endMin <= startMin) return null;
    return Number(((endMin - startMin) / 60).toFixed(2));
  };

  const duration = calcDuration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duration === null) return;
    setSaving(true);

    const { error } = await supabase.from('time_entries').insert({
      user_id: user.id,
      date: form.date,
      start_time: form.startTime,
      end_time: form.endTime,
      duration: duration,
    });

    if (!error) {
      fetchEntries();
      setForm({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        breakMinutes: '0',
      });
    }
    setSaving(false);
  };

  const openEdit = (entry: TimeEntry) => {
    setEditEntry(entry);
    setEditForm({
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime || '',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEntry) return;
    const editDuration = calcEditDuration();
    if (editDuration === null) return;
    setEditSaving(true);

    const { error } = await supabase
      .from('time_entries')
      .update({
        date: editForm.date,
        start_time: editForm.startTime,
        end_time: editForm.endTime,
        duration: editDuration,
      })
      .eq('id', editEntry.id)
      .eq('user_id', user.id);

    if (!error) {
      setEditEntry(null);
      fetchEntries();
    }
    setEditSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteEntry) return;
    setDeleting(true);

    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', deleteEntry.id)
      .eq('user_id', user.id);

    if (!error) {
      setDeleteEntry(null);
      fetchEntries();
    }
    setDeleting(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-fadeIn">
      <div className="border-b border-brand/10 pb-4 md:pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight text-brand-darkest">Zeiterfassung</h1>
          <p className="text-brand/50 text-[10px] md:text-sm mt-1 uppercase tracking-widest">Arbeitszeit manuell erfassen</p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={() => exportTimeEntriesToCSV(entries, user.name)}
            className="flex items-center gap-2 px-4 py-3 border border-brand/20 text-brand-darkest text-[10px] font-bold uppercase tracking-widest hover:bg-brand-soft transition-all"
          >
            <ICONS.Download size={14} /> Bericht exportieren
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Entry Form */}
        <div className="lg:col-span-1 border border-brand/20 bg-brand-darkest text-white p-6 md:p-8 premium-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-brand rounded-full flex items-center justify-center shadow-lg shadow-brand/20">
              <ICONS.Timer size={22} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold">Neuer Eintrag</h2>
              <p className="text-[10px] text-brand/40 uppercase tracking-widest font-bold">Zeit erfassen</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/40 mb-1.5">Datum</label>
              <input
                type="date"
                required
                className="w-full border border-white/10 bg-white/5 p-3 text-sm focus:border-brand outline-none text-white"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/40 mb-1.5">Beginn</label>
                <input
                  type="time"
                  required
                  className="w-full border border-white/10 bg-white/5 p-3 text-sm focus:border-brand outline-none text-white"
                  value={form.startTime}
                  onChange={e => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/40 mb-1.5">Ende</label>
                <input
                  type="time"
                  required
                  className="w-full border border-white/10 bg-white/5 p-3 text-sm focus:border-brand outline-none text-white"
                  value={form.endTime}
                  onChange={e => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/40 mb-1.5">Pause (Minuten)</label>
              <input
                type="number"
                min="0"
                max="480"
                className="w-full border border-white/10 bg-white/5 p-3 text-sm focus:border-brand outline-none text-white"
                value={form.breakMinutes}
                onChange={e => setForm({ ...form, breakMinutes: e.target.value })}
              />
            </div>

            {duration !== null && (
              <div className="flex items-center justify-between p-3 bg-brand/20 border border-brand/30">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-light">Nettozeit:</span>
                <span className="text-lg font-bold">{duration.toFixed(2)} h</span>
              </div>
            )}

            <button
              type="submit"
              disabled={duration === null || saving}
              className="w-full py-4 font-bold uppercase tracking-widest transition-all shadow-lg text-sm bg-brand hover:bg-brand-dark shadow-brand/20 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {saving ? 'Wird gespeichert...' : 'Eintrag speichern'}
            </button>
          </form>
        </div>

        {/* Entries List */}
        <div className="lg:col-span-2 border border-brand/10 bg-white premium-shadow overflow-hidden">
          <div className="p-4 md:p-6 border-b border-brand/5 font-bold uppercase tracking-widest text-xs text-brand-darkest">Deine letzten Einträge</div>

          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-brand-soft/50 text-[10px] font-bold uppercase text-brand/60 tracking-tighter">
                  <th className="px-6 py-4">Datum</th>
                  <th className="px-6 py-4">Start</th>
                  <th className="px-6 py-4">Ende</th>
                  <th className="px-6 py-4 text-right">Stunden</th>
                  <th className="px-6 py-4 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-xs text-brand/30 uppercase font-bold tracking-widest">Lade Zeitdaten...</td>
                  </tr>
                ) : entries.length > 0 ? (
                  entries.map(entry => (
                    <tr key={entry.id} className="text-sm hover:bg-brand-soft/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-brand-darkest">{entry.date}</td>
                      <td className="px-6 py-4 text-brand/70">{entry.startTime}</td>
                      <td className="px-6 py-4 text-brand/70">{entry.endTime}</td>
                      <td className="px-6 py-4 text-right font-bold text-brand">{entry.duration?.toFixed(2)} h</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(entry)}
                            className="p-2 hover:bg-brand-soft rounded-sm transition-colors text-brand/50 hover:text-brand"
                            title="Bearbeiten"
                          >
                            <ICONS.Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteEntry(entry)}
                            className="p-2 hover:bg-red-50 rounded-sm transition-colors text-brand/50 hover:text-red-600"
                            title="Löschen"
                          >
                            <ICONS.Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-xs text-brand/30 uppercase font-bold tracking-widest">Noch keine Einträge vorhanden</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden divide-y divide-brand/5">
            {loading ? (
              <div className="px-4 py-10 text-center text-[10px] text-brand/30 uppercase font-bold tracking-widest">Lade Zeitdaten...</div>
            ) : entries.length > 0 ? (
              entries.map(entry => (
                <div key={entry.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-brand-darkest">{entry.date}</div>
                    <div className="text-[11px] text-brand/60 mt-0.5">
                      {entry.startTime} → {entry.endTime}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-brand">{entry.duration?.toFixed(2)} h</span>
                    <button
                      onClick={() => openEdit(entry)}
                      className="p-1.5 hover:bg-brand-soft rounded-sm transition-colors text-brand/50 hover:text-brand"
                      title="Bearbeiten"
                    >
                      <ICONS.Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteEntry(entry)}
                      className="p-1.5 hover:bg-red-50 rounded-sm transition-colors text-brand/50 hover:text-red-600"
                      title="Löschen"
                    >
                      <ICONS.Trash size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-10 text-center text-[10px] text-brand/30 uppercase font-bold tracking-widest">Noch keine Einträge</div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditEntry(null)}>
          <div className="bg-white border border-brand/20 w-full max-w-md premium-shadow" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-brand/10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand-darkest">Eintrag bearbeiten</h3>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/60 mb-1.5">Datum</label>
                <input
                  type="date"
                  required
                  className="w-full border border-brand/20 p-3 text-sm focus:border-brand outline-none"
                  value={editForm.date}
                  onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/60 mb-1.5">Beginn</label>
                  <input
                    type="time"
                    required
                    className="w-full border border-brand/20 p-3 text-sm focus:border-brand outline-none"
                    value={editForm.startTime}
                    onChange={e => setEditForm({ ...editForm, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/60 mb-1.5">Ende</label>
                  <input
                    type="time"
                    required
                    className="w-full border border-brand/20 p-3 text-sm focus:border-brand outline-none"
                    value={editForm.endTime}
                    onChange={e => setEditForm({ ...editForm, endTime: e.target.value })}
                  />
                </div>
              </div>

              {calcEditDuration() !== null && (
                <div className="flex items-center justify-between p-3 bg-brand-soft border border-brand/20">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand/60">Dauer:</span>
                  <span className="text-lg font-bold text-brand-darkest">{calcEditDuration()!.toFixed(2)} h</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditEntry(null)}
                  className="flex-1 py-3 border border-brand/20 text-brand-darkest text-[10px] font-bold uppercase tracking-widest hover:bg-brand-soft transition-all"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={calcEditDuration() === null || editSaving}
                  className="flex-1 py-3 bg-brand text-white text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editSaving ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteEntry(null)}>
          <div className="bg-white border border-brand/20 w-full max-w-sm premium-shadow" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <ICONS.Trash size={20} className="text-red-600" />
                </div>
                <h3 className="text-sm font-bold text-brand-darkest">Eintrag löschen?</h3>
              </div>
              <p className="text-sm text-brand/70">
                Möchten Sie den Eintrag vom <strong>{deleteEntry.date}</strong> ({deleteEntry.startTime} – {deleteEntry.endTime}) wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteEntry(null)}
                  className="flex-1 py-3 border border-brand/20 text-brand-darkest text-[10px] font-bold uppercase tracking-widest hover:bg-brand-soft transition-all"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-40"
                >
                  {deleting ? 'Löschen...' : 'Löschen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracking;
