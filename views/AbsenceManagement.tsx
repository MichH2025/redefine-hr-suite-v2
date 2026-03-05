
import React, { useState, useEffect } from 'react';
import { User, UserRole, AbsenceType, AbsenceRequest, AbsenceStatus } from '../types';
import { calculateWorkingDays, formatDate } from '../services/holidayService';
import { ICONS } from '../constants';
import { supabase } from '../services/supabaseClient';

const AbsenceManagement: React.FC<{ user: User }> = ({ user }) => {
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'plan' | 'submit'>('submit');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    type: AbsenceType.VACATION,
    startDate: '',
    endDate: ''
  });
  const [calculatedPreview, setCalculatedPreview] = useState<number | null>(null);

  // Edit state
  const [editEntry, setEditEntry] = useState<AbsenceRequest | null>(null);
  const [editForm, setEditForm] = useState({ startDate: '', endDate: '' });
  const [editPreview, setEditPreview] = useState<number | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deleteEntry, setDeleteEntry] = useState<AbsenceRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('absences')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setRequests(data.map(d => ({
        id: d.id,
        userId: d.user_id,
        userName: user.name,
        type: d.type as AbsenceType,
        startDate: d.start_date,
        endDate: d.end_date,
        status: d.status as AbsenceStatus,
        createdAt: d.created_at,
        days: d.days
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (end >= start) {
        setCalculatedPreview(calculateWorkingDays(start, end));
      } else {
        setCalculatedPreview(null);
      }
    } else {
      setCalculatedPreview(null);
    }
  }, [form.startDate, form.endDate]);

  useEffect(() => {
    if (editForm.startDate && editForm.endDate) {
      const start = new Date(editForm.startDate);
      const end = new Date(editForm.endDate);
      if (end >= start) {
        setEditPreview(calculateWorkingDays(start, end));
      } else {
        setEditPreview(null);
      }
    } else {
      setEditPreview(null);
    }
  }, [editForm.startDate, editForm.endDate]);

  const openModal = (mode: 'plan' | 'submit') => {
    setModalMode(mode);
    setForm({ type: AbsenceType.VACATION, startDate: '', endDate: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || calculatedPreview === null) return;

    let initialStatus: AbsenceStatus;

    if (modalMode === 'plan') {
      initialStatus = AbsenceStatus.PLANNED;
    } else {
      if (user.role === UserRole.CEO) {
        initialStatus = AbsenceStatus.APPROVED;
      } else if (user.role === UserRole.TEAM_LEAD) {
        initialStatus = AbsenceStatus.PENDING_CEO;
      } else {
        initialStatus = AbsenceStatus.PENDING_TEAM_LEAD;
      }
    }

    const { error } = await supabase.from('absences').insert({
      user_id: user.id,
      type: form.type,
      start_date: form.startDate,
      end_date: form.endDate,
      status: initialStatus,
      days: calculatedPreview
    }).select().single();

    if (!error) {
      fetchRequests();
      setIsModalOpen(false);
      setForm({ type: AbsenceType.VACATION, startDate: '', endDate: '' });
    }
  };

  const handleSubmitPlanned = async (req: AbsenceRequest) => {
    let newStatus: AbsenceStatus;
    if (user.role === UserRole.CEO) {
      newStatus = AbsenceStatus.APPROVED;
    } else if (user.role === UserRole.TEAM_LEAD) {
      newStatus = AbsenceStatus.PENDING_CEO;
    } else {
      newStatus = AbsenceStatus.PENDING_TEAM_LEAD;
    }

    const { error } = await supabase
      .from('absences')
      .update({ status: newStatus })
      .eq('id', req.id)
      .eq('user_id', user.id);

    if (!error) {
      fetchRequests();
    }
  };

  const openEdit = (req: AbsenceRequest) => {
    setEditEntry(req);
    setEditForm({ startDate: req.startDate, endDate: req.endDate });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEntry || editPreview === null) return;
    setEditSaving(true);

    const { error } = await supabase
      .from('absences')
      .update({
        start_date: editForm.startDate,
        end_date: editForm.endDate,
        days: editPreview
      })
      .eq('id', editEntry.id)
      .eq('user_id', user.id)
      .eq('status', AbsenceStatus.PLANNED);

    if (!error) {
      setEditEntry(null);
      fetchRequests();
    }
    setEditSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteEntry) return;
    setDeleting(true);

    const { error } = await supabase
      .from('absences')
      .delete()
      .eq('id', deleteEntry.id)
      .eq('user_id', user.id)
      .eq('status', AbsenceStatus.PLANNED);

    if (!error) {
      setDeleteEntry(null);
      fetchRequests();
    }
    setDeleting(false);
  };

  const getStatusColor = (status: AbsenceStatus) => {
    switch(status) {
      case AbsenceStatus.PLANNED: return 'text-gray-600 bg-gray-50 border-gray-200 border-dashed';
      case AbsenceStatus.APPROVED: return 'text-green-600 bg-green-50 border-green-100';
      case AbsenceStatus.REJECTED: return 'text-red-600 bg-red-50 border-red-100';
      case AbsenceStatus.PENDING_CEO: return 'text-orange-600 bg-orange-50 border-orange-100';
      default: return 'text-brand bg-brand-soft border-brand/10';
    }
  };

  const isPlanned = (req: AbsenceRequest) => req.status === AbsenceStatus.PLANNED;

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-brand/10 pb-4 md:pb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight text-brand-darkest">Meine Abwesenheiten</h1>
          <p className="text-brand/50 text-[10px] md:text-sm mt-1 uppercase tracking-widest">Urlaub, Homeoffice & Krankheit</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => openModal('plan')}
            className="flex-1 md:flex-none border border-brand/20 text-brand-darkest px-5 py-3 font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-brand-soft transition-all justify-center"
          >
            <ICONS.Calendar size={16} /> Urlaub planen
          </button>
          <button
            onClick={() => openModal('submit')}
            className="flex-1 md:flex-none bg-brand text-white px-5 py-3 font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-brand-dark transition-all premium-shadow justify-center"
          >
            <ICONS.Plus size={16} /> Antrag stellen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {loading ? (
          <div className="text-center py-10 text-brand/30 uppercase text-xs font-bold tracking-widest">Daten werden geladen...</div>
        ) : requests.map(req => (
          <div
            key={req.id}
            className={`p-4 md:p-6 border bg-white premium-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 transition-transform hover:scale-[1.01] ${
              isPlanned(req) ? 'border-dashed border-gray-300' : 'border-brand/10'
            }`}
          >
            <div className="w-full md:w-auto">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-base md:text-lg font-bold text-brand-darkest">{req.type}</span>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 border ${getStatusColor(req.status)}`}>
                  {req.status}
                </span>
              </div>
              <p className="text-xs md:text-sm text-brand/60">
                {formatDate(req.startDate)} &mdash; {formatDate(req.endDate)}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {isPlanned(req) && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSubmitPlanned(req)}
                    className="p-2 bg-brand text-white rounded-sm hover:bg-brand-dark transition-colors"
                    title="Antrag einreichen"
                  >
                    <ICONS.Send size={14} />
                  </button>
                  <button
                    onClick={() => openEdit(req)}
                    className="p-2 hover:bg-brand-soft rounded-sm transition-colors text-brand/50 hover:text-brand"
                    title="Bearbeiten"
                  >
                    <ICONS.Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteEntry(req)}
                    className="p-2 hover:bg-red-50 rounded-sm transition-colors text-brand/50 hover:text-red-600"
                    title="Löschen"
                  >
                    <ICONS.Trash size={14} />
                  </button>
                </div>
              )}
              <div className="text-right">
                <div className="text-sm font-bold text-brand-darkest uppercase tracking-widest">{req.days} Tage</div>
                <div className="text-[10px] text-brand/40 uppercase font-bold">Arbeitstage</div>
              </div>
            </div>
          </div>
        ))}
        {!loading && requests.length === 0 && (
          <div className="p-12 md:p-20 border-2 border-dashed border-brand/10 text-center bg-brand-soft/20 text-brand/30 uppercase tracking-widest text-xs font-bold">
            Keine Anträge gefunden
          </div>
        )}
      </div>

      {/* Create Modal (Plan / Submit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-darkest/40 z-50 flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full md:max-w-lg p-6 md:p-8 border-t md:border border-brand/20 premium-shadow rounded-t-2xl md:rounded-none max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-bold uppercase tracking-widest text-brand-darkest">
                {modalMode === 'plan' ? 'Urlaub planen' : 'Neuer Antrag'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-brand/40 hover:text-brand p-3"><ICONS.X size={20} /></button>
            </div>

            {modalMode === 'plan' && (
              <div className="mb-5 p-3 bg-gray-50 border border-dashed border-gray-300 text-xs text-gray-600">
                Geplanter Urlaub ist nur für Sie sichtbar und kann jederzeit bearbeitet oder gelöscht werden. Reichen Sie den Antrag ein, wenn Sie bereit sind.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/50 mb-2">Typ der Abwesenheit</label>
                <select
                  className="w-full border border-brand/10 p-3 text-sm focus:border-brand outline-none bg-brand-soft/20 text-brand-darkest font-bold"
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value as AbsenceType})}
                >
                  {Object.values(AbsenceType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/50 mb-2">Von</label>
                  <input type="date" required className="w-full border border-brand/10 p-3 text-sm focus:border-brand outline-none bg-brand-soft/20" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/50 mb-2">Bis</label>
                  <input type="date" required className="w-full border border-brand/10 p-3 text-sm focus:border-brand outline-none bg-brand-soft/20" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                </div>
              </div>

              {calculatedPreview !== null && (
                <div className="flex items-center justify-between p-3 md:p-4 bg-brand text-white shadow-lg shadow-brand/20">
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Berechnete Arbeitstage:</span>
                  <span className="text-lg md:text-xl font-bold">{calculatedPreview} {calculatedPreview === 1 ? 'Tag' : 'Tage'}</span>
                </div>
              )}

              <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 pt-4 pb-2 md:pb-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-brand-darkest text-brand-darkest font-bold uppercase tracking-widest text-xs hover:bg-brand-soft transition-colors">Abbrechen</button>
                <button type="submit" disabled={calculatedPreview === null} className="flex-1 px-6 py-3 bg-brand text-white font-bold uppercase tracking-widest text-xs hover:bg-brand-dark transition-all disabled:opacity-50 shadow-lg shadow-brand/10">
                  {modalMode === 'plan' ? 'Urlaub planen' : 'Antrag senden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal (nur für geplante) */}
      {editEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditEntry(null)}>
          <div className="bg-white border border-brand/20 w-full max-w-md premium-shadow" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-brand/10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand-darkest">Geplanten Urlaub bearbeiten</h3>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/60 mb-1.5">Von</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-brand/20 p-3 text-sm focus:border-brand outline-none"
                    value={editForm.startDate}
                    onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/60 mb-1.5">Bis</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-brand/20 p-3 text-sm focus:border-brand outline-none"
                    value={editForm.endDate}
                    onChange={e => setEditForm({ ...editForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              {editPreview !== null && (
                <div className="flex items-center justify-between p-3 bg-brand-soft border border-brand/20">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand/60">Arbeitstage:</span>
                  <span className="text-lg font-bold text-brand-darkest">{editPreview} {editPreview === 1 ? 'Tag' : 'Tage'}</span>
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
                  disabled={editPreview === null || editSaving}
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
                <h3 className="text-sm font-bold text-brand-darkest">Geplanten Urlaub löschen?</h3>
              </div>
              <p className="text-sm text-brand/70">
                Möchten Sie den geplanten Urlaub vom <strong>{formatDate(deleteEntry.startDate)}</strong> bis <strong>{formatDate(deleteEntry.endDate)}</strong> ({deleteEntry.days} Tage) wirklich löschen?
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

export default AbsenceManagement;
