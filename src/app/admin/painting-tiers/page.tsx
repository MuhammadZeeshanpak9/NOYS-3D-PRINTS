'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { useToast } from '@/lib/toast/ToastContext';
import { Loader2, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

interface PaintingTier {
  id: string;
  name: string;
  price: number;
  sort_order: number;
}

const blank = (): Omit<PaintingTier, 'id'> => ({ name: '', price: 0, sort_order: 0 });

export default function AdminPaintingTiersPage() {
  const [tiers, setTiers] = useState<PaintingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<PaintingTier>>({});
  const [adding, setAdding] = useState(false);
  const [addDraft, setAddDraft] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    apiClient.get('/painting-tiers')
      .then(r => setTiers(r.data as PaintingTier[]))
      .catch(() => error('Failed to load painting tiers'))
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (tier: PaintingTier) => {
    setEditingId(tier.id);
    setEditDraft({ ...tier });
    setAdding(false);
  };

  const cancelEdit = () => { setEditingId(null); setEditDraft({}); };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await apiClient.put(`/painting-tiers/${editingId}`, {
        name: editDraft.name,
        price: Number(editDraft.price),
        sort_order: Number(editDraft.sort_order ?? 0),
      });
      setTiers(prev => prev.map(t => t.id === editingId ? { ...t, ...res.data } : t));
      cancelEdit();
      success('Saved');
    } catch { error('Failed to save'); }
    finally { setSaving(false); }
  };

  const saveAdd = async () => {
    setSaving(true);
    try {
      const res = await apiClient.post('/painting-tiers', {
        ...addDraft,
        price: Number(addDraft.price),
        sort_order: Number(addDraft.sort_order ?? 0),
      });
      setTiers(prev => [...prev, res.data as PaintingTier]);
      setAdding(false);
      setAddDraft(blank());
      success('Painting tier added');
    } catch { error('Failed to add'); }
    finally { setSaving(false); }
  };

  const deleteTier = async (id: string) => {
    setDeletingId(id);
    try {
      await apiClient.delete(`/painting-tiers/${id}`);
      setTiers(prev => prev.filter(t => t.id !== id));
      success('Deleted');
    } catch { error('Failed to delete'); }
    finally { setDeletingId(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Painting Tiers</h1>
          <p className="text-sm text-slate-500 mt-1">{tiers.length} tier{tiers.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setAdding(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={16} /> Add Tier
        </button>
      </div>

      {/* Add Form */}
      {adding && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-blue-800">New Painting Tier</h3>
          <TierForm draft={addDraft} onChange={setAddDraft} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setAdding(false); setAddDraft(blank()); }} className={btnGhost}>
              <X size={14} /> Cancel
            </button>
            <button onClick={saveAdd} disabled={saving} className={btnPrimary}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Add
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {[...tiers].sort((a, b) => a.sort_order - b.sort_order).map(tier => (
          <div key={tier.id} className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden">
            {editingId === tier.id ? (
              <div className="p-6 space-y-4">
                <TierForm draft={editDraft as PaintingTier} onChange={d => setEditDraft(d)} />
                <div className="flex gap-2 justify-end">
                  <button onClick={cancelEdit} className={btnGhost}><X size={14} /> Cancel</button>
                  <button onClick={saveEdit} disabled={saving} className={btnPrimary}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 flex flex-wrap items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {tier.sort_order}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-800 text-lg">{tier.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Price</p>
                  <p className="font-bold text-slate-800 text-lg">£{Number(tier.price).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(tier)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => deleteTier(tier.id)}
                    disabled={deletingId === tier.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40"
                  >
                    {deletingId === tier.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TierForm({ draft, onChange }: { draft: Partial<PaintingTier>; onChange: (d: any) => void }) {
  const set = (field: string, value: any) => onChange({ ...draft, [field]: value });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Field label="Tier Name"><input value={draft.name ?? ''} onChange={e => set('name', e.target.value)} className={input} placeholder="e.g. Basic" /></Field>
      <Field label="Price (£)"><input type="number" step="0.01" min="0" value={draft.price ?? ''} onChange={e => set('price', e.target.value)} className={input} /></Field>
      <Field label="Sort Order"><input type="number" min="0" value={draft.sort_order ?? ''} onChange={e => set('sort_order', e.target.value)} className={input} placeholder="0" /></Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><label className="text-xs font-semibold text-slate-500 uppercase">{label}</label>{children}</div>;
}
function Spinner() {
  return <div className="flex justify-center items-center min-h-[300px]"><Loader2 size={28} className="animate-spin text-slate-400" /></div>;
}

const input = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white';
const btnPrimary = 'flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors';
const btnGhost = 'flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-lg transition-colors';
