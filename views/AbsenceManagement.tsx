
import React, { useState, useEffect } from 'react';
import { User, UserRole, AbsenceType, AbsenceRequest, AbsenceStatus } from '../types';
import { calculateWorkingDays, formatDate } from '../services/holidayService';
import { ICONS } from '../constants';
import { supabase } from '../services/supabaseClient';

const AbsenceManagement: React.FC<{ user: User }> = ({ user }) => {
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    type: AbsenceType.VACATION,
    startDate: '',
    endDate: ''
  });
  const [calculatedPreview, setCalculatedPreview] = useState<number | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || calculatedPreview === null) return;

    // Logik für den initialen Status basierend auf der Rolle
    let initialStatus: AbsenceStatus = AbsenceStatus.PENDING_TEAM_LEAD;
    if (user.role === UserRole.CEO) {
      initialStatus = AbsenceStatus.APPROVED;
    } else if (user.role === UserRole.TEAM_LEAD) {
      initialStatus = AbsenceStatus.PENDING_CEO;
    }

    const { data, error } = await supabase.from('absences').insert({
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

  const getStatusColor = (status: AbsenceStatus) => {
    switch(status) {
      case AbsenceStatus.APPROVED: return 'text-green-600 bg-green-50 border-green-100';
      case AbsenceStatus.REJECTED: return 'text-red-600 bg-red-50 border-red-100';
      case AbsenceStatus.PENDING_CEO: return 'text-orange-600 bg-orange-50 border-orange-100';
      default: return 'text-brand bg-brand-soft border-brand/10';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-brand/10 pb-4 md:pb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight text-brand-darkest">Meine Abwesenheiten</h1>
          <p className="text-brand/50 text-[10px] md:text-sm mt-1 uppercase tracking-widest">Urlaub, Homeoffice & Krankheit</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand text-white px-6 py-3 font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-brand-dark transition-all premium-shadow w-full md:w-auto justify-center"
        >
          <ICONS.Plus size={16} /> Antrag Erstellen
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {loading ? (
          <div className="text-center py-10 text-brand/30 uppercase text-xs font-bold tracking-widest">Daten werden geladen...</div>
        ) : requests.map(req => (
          <div key={req.id} className="p-4 md:p-6 border border-brand/10 bg-white premium-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 transition-transform hover:scale-[1.01]">
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
            <div className="flex items-center w-full md:w-auto justify-end md:justify-between">
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-darkest/40 z-50 flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm">
          <div className="bg-white w-full md:max-w-lg p-6 md:p-8 border-t md:border border-brand/20 premium-shadow rounded-t-2xl md:rounded-none max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-bold uppercase tracking-widest text-brand-darkest">Neuer Antrag</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-brand/40 hover:text-brand p-3"><ICONS.X size={20} /></button>
            </div>
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
                <button type="submit" disabled={calculatedPreview === null} className="flex-1 px-6 py-3 bg-brand text-white font-bold uppercase tracking-widest text-xs hover:bg-brand-dark transition-all disabled:opacity-50 shadow-lg shadow-brand/10">Antrag senden</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsenceManagement;
