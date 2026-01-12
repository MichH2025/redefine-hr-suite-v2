import React, { useState, useEffect } from 'react';
import { User, UserRole, Document as HRDocument } from '../types';
import { ICONS } from '../constants';
import { supabase } from '../services/supabaseClient';

interface DocumentsProps {
  user: User;
  allUsers: User[];
}

const Documents: React.FC<DocumentsProps> = ({ user, allUsers }) => {
  const [docs, setDocs] = useState<HRDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string>('');

  useEffect(() => {
    const defaultUser = allUsers.find(u => u.role !== UserRole.CEO);
    if (allUsers.length > 0 && !targetUserId) {
      setTargetUserId(defaultUser?.id || allUsers[0].id);
    }
  }, [allUsers]);

  useEffect(() => {
    fetchDocuments();
  }, [user.id, user.role]);

  const fetchDocuments = async () => {
    setLoading(true);
    let query = supabase.from('documents').select('*');
    
    // Mitarbeiter sehen nur ihre eigenen, CEO sieht alles
    if (user.role !== UserRole.CEO) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('upload_date', { ascending: false });
    if (data) {
      setDocs(data.map(d => ({
        id: d.id,
        userId: d.user_id,
        name: d.name,
        type: d.type as any,
        uploadDate: d.upload_date,
        url: d.url
      })));
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const file = e.target.files[0];
      const targetUser = user.role === UserRole.CEO ? targetUserId : user.id;
      
      // Eindeutiger Dateiname: userId/timestamp_filename
      const timestamp = Date.now();
      const filePath = `${targetUser}/${timestamp}_${file.name}`;
      
      try {
        // 1. Datei in Supabase Storage hochladen
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        // 2. Öffentliche URL generieren (signierte URL für private Buckets)
        const { data: urlData } = await supabase.storage
          .from('documents')
          .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 Jahr gültig

        const fileUrl = urlData?.signedUrl || '';

        // 3. Datenbank-Eintrag erstellen
        const { error: dbError } = await supabase.from('documents').insert({
          user_id: targetUser,
          name: file.name,
          type: file.name.toLowerCase().includes('lohn') ? 'Lohnabrechnung' 
              : file.name.toLowerCase().includes('vertrag') ? 'Vertrag' 
              : 'Sonstiges',
          upload_date: new Date().toISOString().split('T')[0],
          url: fileUrl
        });

        if (dbError) {
          throw dbError;
        }

        fetchDocuments();
      } catch (error: any) {
        alert("Fehler beim Hochladen: " + error.message);
      }
      
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: HRDocument) => {
    try {
      // Extrahiere den Dateipfad aus der URL oder erstelle ihn neu
      // Die URL enthält den signierten Pfad - wir können sie direkt verwenden
      if (doc.url && doc.url.startsWith('http')) {
        window.open(doc.url, '_blank');
      } else {
        // Fallback: Neue signierte URL generieren
        const filePath = `${doc.userId}/${doc.name}`;
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(filePath, 60 * 60); // 1 Stunde gültig

        if (error) {
          throw error;
        }

        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
        }
      }
    } catch (error: any) {
      alert("Fehler beim Download: " + error.message);
    }
  };

  const getOwnerName = (userId: string) => {
    return allUsers.find(u => u.id === userId)?.name || 'Mitarbeiter';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-brand/10 pb-6 gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-darkest uppercase">Dokumentenarchiv</h1>
          <p className="text-brand/50 text-sm mt-1 uppercase tracking-[0.2em] font-bold">REDEFINE Asset Management Suite</p>
        </div>
        
        {user.role === UserRole.CEO && (
          <div className="bg-brand-soft/50 p-4 border border-brand/10 flex flex-col sm:flex-row gap-4 items-end w-full md:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-64">
              <label className="text-[9px] font-bold uppercase tracking-widest text-brand/50">Ziel-Mitarbeiter wählen</label>
              <select 
                className="w-full border border-brand/10 p-2 text-xs font-bold uppercase tracking-widest outline-none focus:border-brand bg-white text-brand-darkest h-10"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              >
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            
            <label className="bg-brand-darkest text-white px-6 py-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-brand transition-all cursor-pointer h-10 w-full sm:w-auto shadow-xl shadow-brand-darkest/10">
              <ICONS.Plus size={14} /> 
              {isUploading ? 'Wird hochgeladen...' : 'Datei bereitstellen'}
              <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 text-brand/20 uppercase text-[10px] font-bold tracking-[0.4em]">Verzeichnis wird gelesen...</div>
        ) : docs.map(doc => (
          <div key={doc.id} className="border border-brand/10 p-6 bg-white premium-shadow flex flex-col justify-between group relative transition-all hover:border-brand/40 hover:translate-y-[-2px]">
            {user.role === UserRole.CEO && (
              <div className="mb-4 pb-2 border-b border-brand/5 flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase tracking-tighter text-brand/40">Inhaber:</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-brand">{getOwnerName(doc.userId)}</span>
              </div>
            )}
            
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-brand-soft/50 text-brand group-hover:bg-brand group-hover:text-white transition-all">
                <ICONS.Documents size={20} />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs truncate text-brand-darkest uppercase tracking-tight" title={doc.name}>{doc.name}</div>
                <div className="text-[9px] text-brand/40 uppercase font-bold tracking-widest mt-1">
                  {doc.type} • {doc.uploadDate}
                </div>
              </div>
            </div>

            <button 
              onClick={() => handleDownload(doc)}
              className="w-full flex items-center justify-center gap-2 py-2 border border-brand-darkest text-brand-darkest text-[10px] font-bold uppercase tracking-widest hover:bg-brand-darkest hover:text-white transition-all"
            >
              <ICONS.Download size={14} /> Download
            </button>
          </div>
        ))}
        
        {!loading && docs.length === 0 && (
          <div className="col-span-full py-32 border-2 border-dashed border-brand/10 text-center bg-brand-soft/10">
            <ICONS.Documents size={40} className="mx-auto text-brand/10 mb-4" />
            <p className="text-brand/30 uppercase tracking-[0.3em] text-[10px] font-bold">Keine Unterlagen in der Cloud hinterlegt</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Documents;