import React, { useState, useEffect } from 'react';
import { User, UserRole, Document as HRDocument, DocumentType, DOCUMENT_TYPES, AbsenceRequest, AbsenceType, AbsenceStatus } from '../types';
import { ICONS } from '../constants';
import { supabase } from '../services/supabaseClient';

interface DocumentsProps {
  user: User;
  allUsers: User[];
}

const TAB_CONFIG: { type: DocumentType; label: string }[] = [
  { type: 'Verdienstabrechnung', label: 'Verdienst' },
  { type: 'Jahressteuermeldung', label: 'Steuer' },
  { type: 'Arbeitsvertrag', label: 'Verträge' },
  { type: 'Nachtrag', label: 'Nachträge' },
  { type: 'Krankmeldung', label: 'Krankmeldungen' },
  { type: 'Sonstiges', label: 'Sonstiges' },
];

const MONTH_NAMES = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

const FOLDER_MAP: Record<DocumentType, string> = {
  'Verdienstabrechnung': 'verdienstabrechnungen',
  'Jahressteuermeldung': 'steuermeldungen',
  'Arbeitsvertrag': 'vertraege',
  'Nachtrag': 'vertraege',
  'Krankmeldung': 'krankmeldungen',
  'Sonstiges': 'sonstiges',
};

const Documents: React.FC<DocumentsProps> = ({ user, allUsers }) => {
  const [docs, setDocs] = useState<HRDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DocumentType>('Verdienstabrechnung');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sickAbsences, setSickAbsences] = useState<AbsenceRequest[]>([]);

  // Upload form
  const [uploadForm, setUploadForm] = useState<{
    documentType: DocumentType;
    file: File | null;
    referenceMonth: string;
    referenceYear: string;
    absenceId: string;
    targetUserId: string;
  }>({
    documentType: 'Verdienstabrechnung',
    file: null,
    referenceMonth: '',
    referenceYear: new Date().getFullYear().toString(),
    absenceId: '',
    targetUserId: '',
  });

  // Delete state
  const [deleteDoc, setDeleteDoc] = useState<HRDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isCEO = user.role === UserRole.CEO;
  const viewUserId = isCEO ? selectedUserId : user.id;

  useEffect(() => {
    if (isCEO && allUsers.length > 0 && !selectedUserId) {
      const defaultUser = allUsers.find(u => u.role !== UserRole.CEO);
      setSelectedUserId(defaultUser?.id || allUsers[0].id);
    }
  }, [allUsers]);

  useEffect(() => {
    fetchDocuments();
  }, [user.id, user.role, selectedUserId]);

  const fetchDocuments = async () => {
    setLoading(true);
    let query = supabase.from('documents').select('*');

    if (!isCEO) {
      query = query.eq('user_id', user.id);
    } else if (selectedUserId) {
      query = query.eq('user_id', selectedUserId);
    }

    const { data } = await query.order('upload_date', { ascending: false });
    if (data) {
      setDocs(data.map(d => ({
        id: d.id,
        userId: d.user_id,
        name: d.name,
        documentType: d.document_type as DocumentType,
        referenceMonth: d.reference_month,
        referenceYear: d.reference_year,
        absenceId: d.absence_id,
        uploadDate: d.upload_date,
        url: d.url,
        storagePath: d.storage_path || ''
      })));
    }
    setLoading(false);
  };

  const fetchSickAbsences = async (targetId: string) => {
    const { data } = await supabase
      .from('absences')
      .select('*')
      .eq('user_id', targetId)
      .eq('type', AbsenceType.SICK_LEAVE)
      .order('start_date', { ascending: false });

    if (data) {
      setSickAbsences(data.map(d => ({
        id: d.id,
        userId: d.user_id,
        userName: '',
        type: d.type as AbsenceType,
        startDate: d.start_date,
        endDate: d.end_date,
        status: d.status as AbsenceStatus,
        createdAt: d.created_at,
        days: d.days
      })));
    }
  };

  const openUpload = (docType?: DocumentType) => {
    const targetId = isCEO ? selectedUserId : user.id;
    setUploadForm({
      documentType: docType || activeTab,
      file: null,
      referenceMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
      referenceYear: new Date().getFullYear().toString(),
      absenceId: '',
      targetUserId: targetId,
    });
    fetchSickAbsences(targetId);
    setIsUploadOpen(true);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) return;
    setUploading(true);

    const targetId = isCEO ? uploadForm.targetUserId : user.id;
    const folder = FOLDER_MAP[uploadForm.documentType];
    const timestamp = Date.now();
    const filePath = `${targetId}/${folder}/${timestamp}_${uploadForm.file.name}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadForm.file);

      if (uploadError) throw uploadError;

      // Signed URL mit 1 Stunde Gültigkeit
      const { data: urlData } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);

      const dbRecord: Record<string, any> = {
        user_id: targetId,
        name: uploadForm.file.name,
        document_type: uploadForm.documentType,
        upload_date: new Date().toISOString().split('T')[0],
        url: urlData?.signedUrl || '',
        storage_path: filePath,
      };

      if (uploadForm.documentType === 'Verdienstabrechnung' && uploadForm.referenceMonth) {
        dbRecord.reference_month = uploadForm.referenceMonth;
      }
      if (uploadForm.documentType === 'Jahressteuermeldung' && uploadForm.referenceYear) {
        dbRecord.reference_year = parseInt(uploadForm.referenceYear);
      }
      if (uploadForm.documentType === 'Krankmeldung' && uploadForm.absenceId) {
        dbRecord.absence_id = uploadForm.absenceId;
      }

      const { error: dbError } = await supabase.from('documents').insert(dbRecord);
      if (dbError) throw dbError;

      fetchDocuments();
      setIsUploadOpen(false);
    } catch (error: any) {
      alert('Fehler beim Hochladen: ' + error.message);
    }
    setUploading(false);
  };

  const handleDownload = async (doc: HRDocument) => {
    try {
      if (doc.storagePath) {
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.storagePath, 3600);
        if (error) throw error;
        if (data?.signedUrl) window.open(data.signedUrl, '_blank');
      } else if (doc.url && doc.url.startsWith('http')) {
        window.open(doc.url, '_blank');
      }
    } catch (error: any) {
      alert('Fehler beim Download: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    setDeleting(true);
    try {
      if (deleteDoc.storagePath) {
        await supabase.storage.from('documents').remove([deleteDoc.storagePath]);
      }
      const { error } = await supabase.from('documents').delete().eq('id', deleteDoc.id);
      if (error) throw error;
      setDeleteDoc(null);
      fetchDocuments();
    } catch (error: any) {
      alert('Fehler beim Löschen: ' + error.message);
    }
    setDeleting(false);
  };

  const filteredDocs = docs.filter(d => d.documentType === activeTab);

  const sortedDocs = [...filteredDocs].sort((a, b) => {
    if (activeTab === 'Verdienstabrechnung') {
      return (b.referenceMonth || '').localeCompare(a.referenceMonth || '');
    }
    if (activeTab === 'Jahressteuermeldung') {
      return (b.referenceYear || 0) - (a.referenceYear || 0);
    }
    return b.uploadDate.localeCompare(a.uploadDate);
  });

  const getOwnerName = (userId: string) => allUsers.find(u => u.id === userId)?.name || 'Mitarbeiter';

  const formatRefMonth = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  };

  const generateMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        value: d.toISOString().split('T')[0],
        label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
      });
    }
    return options;
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-brand/10 pb-4 md:pb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight text-brand-darkest uppercase">
            {isCEO ? 'Dokumentenverwaltung' : 'Meine Dokumente'}
          </h1>
          <p className="text-brand/50 text-[10px] md:text-sm mt-1 uppercase tracking-widest">
            {isCEO ? 'Dokumente aller Mitarbeiter' : 'Persönliche Dokumente'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-end">
          {isCEO && (
            <div className="flex flex-col gap-1 w-full sm:w-56">
              <label className="text-[9px] font-bold uppercase tracking-widest text-brand/50">Mitarbeiter</label>
              <select
                className="w-full border border-brand/10 p-2.5 text-xs font-bold uppercase tracking-widest outline-none focus:border-brand bg-white text-brand-darkest"
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
              >
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => openUpload()}
            className="bg-brand text-white px-5 py-3 font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-brand-dark transition-all premium-shadow whitespace-nowrap"
          >
            <ICONS.Upload size={14} /> Hochladen
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {TAB_CONFIG.map(tab => {
          const count = docs.filter(d => d.documentType === tab.type).length;
          return (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className={`px-3 py-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest border transition-all ${
                activeTab === tab.type
                  ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                  : 'bg-white text-brand-darkest/60 border-brand/10 hover:border-brand/30 hover:text-brand-darkest'
              }`}
            >
              {tab.label}
              {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Document List */}
      <div className="border border-brand/10 bg-white premium-shadow overflow-hidden">
        <div className="p-4 md:p-6 border-b border-brand/5 flex justify-between items-center">
          <h3 className="font-bold uppercase tracking-widest text-xs text-brand-darkest flex items-center gap-2">
            <ICONS.Folder size={16} className="text-brand" />
            {TAB_CONFIG.find(t => t.type === activeTab)?.label || activeTab}
          </h3>
          <button
            onClick={() => openUpload(activeTab)}
            className="text-[9px] font-bold uppercase tracking-widest text-brand hover:text-brand-dark flex items-center gap-1 transition-colors"
          >
            <ICONS.FilePlus size={14} /> Hinzufügen
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-[10px] text-brand/30 uppercase font-bold tracking-widest">Dokumente werden geladen...</div>
        ) : sortedDocs.length > 0 ? (
          <div className="divide-y divide-brand/5">
            {sortedDocs.map(doc => (
              <div key={doc.id} className="p-4 md:px-6 md:py-5 flex items-center gap-4 hover:bg-brand-soft/20 transition-colors group">
                <div className="p-2.5 bg-brand-soft/50 text-brand group-hover:bg-brand group-hover:text-white transition-all flex-shrink-0">
                  <ICONS.Documents size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-brand-darkest truncate" title={doc.name}>{doc.name}</div>
                  <div className="text-[9px] text-brand/40 uppercase font-bold tracking-widest mt-0.5 flex items-center gap-2 flex-wrap">
                    {activeTab === 'Verdienstabrechnung' && doc.referenceMonth && (
                      <span>{formatRefMonth(doc.referenceMonth)}</span>
                    )}
                    {activeTab === 'Jahressteuermeldung' && doc.referenceYear && (
                      <span>Jahr {doc.referenceYear}</span>
                    )}
                    <span>{doc.uploadDate}</span>
                    {isCEO && <span className="text-brand">{getOwnerName(doc.userId)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 border border-brand/20 text-brand-darkest hover:bg-brand-darkest hover:text-white transition-all"
                    title="Download"
                  >
                    <ICONS.Download size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteDoc(doc)}
                    className="p-2 border border-brand/20 text-brand/50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                    title="Löschen"
                  >
                    <ICONS.Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <ICONS.Documents size={32} className="mx-auto text-brand/10 mb-3" />
            <p className="text-brand/30 uppercase tracking-widest text-[10px] font-bold">
              Keine {TAB_CONFIG.find(t => t.type === activeTab)?.label} vorhanden
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-brand-darkest/40 z-50 flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm" onClick={() => setIsUploadOpen(false)}>
          <div className="bg-white w-full md:max-w-lg p-6 md:p-8 border-t md:border border-brand/20 premium-shadow rounded-t-2xl md:rounded-none max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold uppercase tracking-widest text-brand-darkest">Dokument hochladen</h2>
              <button onClick={() => setIsUploadOpen(false)} className="text-brand/40 hover:text-brand p-3"><ICONS.X size={20} /></button>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              {/* Dokumententyp */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/50 mb-2">Dokumententyp</label>
                <select
                  className="w-full border border-brand/10 p-3 text-sm focus:border-brand outline-none bg-brand-soft/20 text-brand-darkest font-bold"
                  value={uploadForm.documentType}
                  onChange={e => setUploadForm({ ...uploadForm, documentType: e.target.value as DocumentType })}
                >
                  {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* CEO: Ziel-Mitarbeiter */}
              {isCEO && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/50 mb-2">Für Mitarbeiter</label>
                  <select
                    className="w-full border border-brand/10 p-3 text-sm focus:border-brand outline-none bg-brand-soft/20 text-brand-darkest font-bold"
                    value={uploadForm.targetUserId}
                    onChange={e => {
                      setUploadForm({ ...uploadForm, targetUserId: e.target.value });
                      fetchSickAbsences(e.target.value);
                    }}
                  >
                    {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}

              {/* Monat (bei Verdienstabrechnung) */}
              {uploadForm.documentType === 'Verdienstabrechnung' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/50 mb-2">Monat</label>
                  <select
                    className="w-full border border-brand/10 p-3 text-sm focus:border-brand outline-none bg-brand-soft/20 text-brand-darkest font-bold"
                    value={uploadForm.referenceMonth}
                    onChange={e => setUploadForm({ ...uploadForm, referenceMonth: e.target.value })}
                  >
                    {generateMonthOptions().map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Jahr (bei Jahressteuermeldung) */}
              {uploadForm.documentType === 'Jahressteuermeldung' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/50 mb-2">Jahr</label>
                  <select
                    className="w-full border border-brand/10 p-3 text-sm focus:border-brand outline-none bg-brand-soft/20 text-brand-darkest font-bold"
                    value={uploadForm.referenceYear}
                    onChange={e => setUploadForm({ ...uploadForm, referenceYear: e.target.value })}
                  >
                    {generateYearOptions().map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Verknüpfte Abwesenheit (bei Krankmeldung) */}
              {uploadForm.documentType === 'Krankmeldung' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/50 mb-2">Verknüpfte Abwesenheit</label>
                  <select
                    className="w-full border border-brand/10 p-3 text-sm focus:border-brand outline-none bg-brand-soft/20 text-brand-darkest font-bold"
                    value={uploadForm.absenceId}
                    onChange={e => setUploadForm({ ...uploadForm, absenceId: e.target.value })}
                  >
                    <option value="">Keine Verknüpfung</option>
                    {sickAbsences.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.startDate} – {a.endDate} ({a.days} Tage)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Datei */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand/50 mb-2">Datei</label>
                <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-brand/20 p-6 cursor-pointer hover:border-brand/40 hover:bg-brand-soft/20 transition-all">
                  <ICONS.Upload size={18} className="text-brand/40" />
                  <span className="text-xs font-bold text-brand/60">
                    {uploadForm.file ? uploadForm.file.name : 'Datei auswählen...'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={e => {
                      if (e.target.files?.[0]) {
                        setUploadForm({ ...uploadForm, file: e.target.files[0] });
                      }
                    }}
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse md:flex-row gap-3 pt-4 pb-2 md:pb-0">
                <button type="button" onClick={() => setIsUploadOpen(false)} className="flex-1 px-6 py-3 border border-brand-darkest text-brand-darkest font-bold uppercase tracking-widest text-xs hover:bg-brand-soft transition-colors">
                  Abbrechen
                </button>
                <button type="submit" disabled={!uploadForm.file || uploading} className="flex-1 px-6 py-3 bg-brand text-white font-bold uppercase tracking-widest text-xs hover:bg-brand-dark transition-all disabled:opacity-50 shadow-lg shadow-brand/10">
                  {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteDoc(null)}>
          <div className="bg-white border border-brand/20 w-full max-w-sm premium-shadow" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <ICONS.Trash size={20} className="text-red-600" />
                </div>
                <h3 className="text-sm font-bold text-brand-darkest">Dokument löschen?</h3>
              </div>
              <p className="text-sm text-brand/70">
                Möchten Sie <strong>{deleteDoc.name}</strong> wirklich löschen? Die Datei wird auch aus dem Speicher entfernt.
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeleteDoc(null)} className="flex-1 py-3 border border-brand/20 text-brand-darkest text-[10px] font-bold uppercase tracking-widest hover:bg-brand-soft transition-all">
                  Abbrechen
                </button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-40">
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

export default Documents;
