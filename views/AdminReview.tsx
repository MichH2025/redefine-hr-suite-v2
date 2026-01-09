
import React, { useState, useEffect } from 'react';
import { User, UserRole, AbsenceRequest, AbsenceStatus } from '../types';
import { formatDate } from '../services/holidayService';
import { ICONS } from '../constants';
import { supabase } from '../services/supabaseClient';

const AdminReview: React.FC<{ user: User }> = ({ user }) => {
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingRequests();
  }, [user.role]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      // Dank RLS liefert die Query automatisch nur das zurück, was der Nutzer sehen darf.
      // Wir filtern hier nur noch nach dem Status für die UI.
      let query = supabase
        .from('absences')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .order('created_at', { ascending: false });

      // Nur offene Anträge anzeigen (RLS erlaubt CEO alles, Teamleiter nur PENDING_TEAM_LEAD)
      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // Filterung in der App für die spezifischen Verantwortlichkeiten
        const filtered = data
          .map(d => ({
            id: d.id,
            userId: d.user_id,
            userName: d.profiles?.full_name || 'Mitarbeiter',
            type: d.type as any,
            startDate: d.start_date,
            endDate: d.end_date,
            status: d.status as AbsenceStatus,
            createdAt: d.created_at,
            days: d.days
          }))
          .filter(req => {
            if (user.role === UserRole.CEO) {
              return req.status === AbsenceStatus.PENDING_CEO || req.status === AbsenceStatus.PENDING_TEAM_LEAD;
            }
            if (user.role === UserRole.TEAM_LEAD) {
              return req.status === AbsenceStatus.PENDING_TEAM_LEAD;
            }
            return false;
          });

        setRequests(filtered);
      }
    } catch (err) {
      console.error("Fehler beim Laden der Admin-Daten:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    let nextStatus: AbsenceStatus;
    
    if (action === 'reject') {
      nextStatus = AbsenceStatus.REJECTED;
    } else {
      if (user.role === UserRole.TEAM_LEAD) {
        nextStatus = AbsenceStatus.PENDING_CEO;
      } else {
        nextStatus = AbsenceStatus.APPROVED;
      }
    }

    const { error } = await supabase
      .from('absences')
      .update({ status: nextStatus })
      .eq('id', id);

    if (!error) {
      fetchPendingRequests();
    } else {
      alert("Aktion fehlgeschlagen: " + error.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      <div className="border-b border-brand/10 pb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-darkest uppercase">Freigaben & Controlling</h1>
          <p className="text-brand/50 text-[10px] mt-1 uppercase tracking-[0.2em] font-bold">
            {user.role === UserRole.CEO ? 'Management Review (2. Instanz)' : 'Teamleiter Review (1. Instanz)'}
          </p>
        </div>
        <div className="bg-brand-soft/50 px-6 py-3 border border-brand/10 text-center sm:text-right">
          <div className="text-2xl font-bold text-brand leading-none">{requests.length}</div>
          <div className="text-[9px] text-brand/40 uppercase font-bold tracking-widest mt-1">Ausstehende Anträge</div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-brand/20 uppercase text-[10px] font-bold tracking-[0.4em]">Prüfe Berechtigungen & Lade Daten...</div>
        ) : requests.length > 0 ? (requests.map(req => (
          <div key={req.id} className="border border-brand/10 bg-white premium-shadow p-6 flex flex-col lg:flex-row justify-between lg:items-center gap-6 transition-all hover:border-brand/30">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-brand-darkest uppercase tracking-tight text-sm">{req.userName}</span>
                <span className="text-[9px] font-bold text-brand/50 border border-brand/10 px-2 py-0.5 uppercase bg-brand-soft/30 tracking-widest">{req.type}</span>
              </div>
              <div className="text-xs text-brand-dark/70 flex items-center gap-2 font-bold">
                <ICONS.Calendar size={14} className="text-brand" />
                {formatDate(req.startDate)} <span className="text-brand/20">→</span> {formatDate(req.endDate)} 
                <span className="mx-2 text-brand/10">|</span>
                <span className="text-brand">{req.days} Arbeitstage</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-brand animate-pulse"></div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-brand/40">
                  Status: <span className="text-brand-darkest">{req.status}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => handleAction(req.id, 'reject')}
                className="px-6 py-3 border border-brand-darkest text-brand-darkest font-bold uppercase tracking-widest text-[10px] hover:bg-red-50 hover:text-red-600 hover:border-red-600 transition-all flex items-center justify-center gap-2"
              >
                <ICONS.X size={14} /> Ablehnen
              </button>
              <button 
                onClick={() => handleAction(req.id, 'approve')}
                className="px-6 py-3 bg-brand-darkest text-white font-bold uppercase tracking-widest text-[10px] hover:bg-brand transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-darkest/10"
              >
                <ICONS.Check size={14} /> {user.role === UserRole.CEO ? 'Final Freigeben' : 'Bestätigen (An CEO)'}
              </button>
            </div>
          </div>
        ))) : (
          <div className="p-24 border-2 border-dashed border-brand/10 text-center bg-brand-soft/10">
            <ICONS.Check size={32} className="mx-auto text-brand/20 mb-4" />
            <p className="text-brand/30 uppercase tracking-[0.3em] text-[10px] font-bold">Alles erledigt. Keine offenen Anfragen im Posteingang.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReview;
