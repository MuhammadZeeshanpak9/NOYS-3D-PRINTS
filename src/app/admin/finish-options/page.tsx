'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { useToast } from '@/lib/toast/ToastContext';
import { Loader2, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

interface FinishOption {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  is_active: boolean;
}

const blank = (): Omit<FinishOption, 'id'> => ({
  name: '', slug: '', description: '', base_price: 0,
  sale_price: null, is_on_sale: false, is_active: true,
});

export default function AdminFinishOptionsPage() {
  const [options, setOptions] = useState<FinishOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<FinishOption>>({});
  const [adding, setAdding] = useState(false);
  const [addDraft, setAddDraft] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    apiClient.get('/finish-options')
      .then(r => setOptions(r.data as FinishOption[]))
      .catch(() => error('Failed to load finish options'))
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (opt: FinishOption) => {
    setEditingId(opt.id);
    setEditDraft({ ...opt });
    setAdding(false);
  };

  const cancelEdit = () => { setEditingId(null); setEditDraft({}); };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await apiClient.put(`/finish-options/${editingId}`, {
        name: editDraft.name,
        description: editDraft.description,
        base_price: Number(editDraft.base_price),
        sale_price: editDraft.sale_price != null ? Number(editDraft.sale_price) : null,
        is_on_sale: editDraft.is_on_sale,
        is_active: editDraft.is_active,
      });
      setOptions(prev => prev.map(o => o.id === editingId ? { ...o, ...res.data } : o));
      cancelEdit();
      success('Saved');
    } catch { error('Failed to save'); }
    finally { setSaving(false); }
  };

  const saveAdd = async () => {
    setSaving(true);
    try {
      const res = await apiClient.post('/finish-options', {
        ...addDraft,
        base_price: Number(addDraft.base_price),
        sale_price: addDraft.sale_price != null ? Number(addDraft.sale_price) : null,
      });
      setOptions(prev => [...prev, res.data as FinishOption]);
      setAdding(false);
      setAddDraft(blank());
      success('Finish option added');
    } catch { error('Failed to add'); }
    finally { setSaving(false); }
  };

  const deleteOption = async (id: string) => {
    setDeletingId(id);
    try {
      await apiClient.delete(`/finish-options/${id}`);
      setOptions(prev => prev.filter(o => o.id !== id));
      success('Deleted');
    } catch { error('Failed to delete'); }
    finally { setDeletingId(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Finish Options</h1>
          <p className="text-sm text-slate-500 mt-1">{options.length} finish type{options.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setAdding(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={16} /> Add Finish
        </button>
      </div>

      {/* Add Form */}
      {adding && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-blue-800">New Finish Option</h3>
          <FinishForm draft={addDraft} onChange={setAddDraft} />
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
        {options.map(opt => (
          <div key={opt.id} className={`bg-white rounded-xl border-2 ${opt.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'} shadow-sm overflow-hidden`}>
            {editingId === opt.id ? (
              <div className="p-6 space-y-4">
                <FinishForm draft={editDraft as FinishOption} onChange={d => setEditDraft(d)} />
                <div className="flex gap-2 justify-end">
                  <button onClick={cancelEdit} className={btnGhost}><X size={14} /> Cancel</button>
                  <button onClick={saveEdit} disabled={saving} className={btnPrimary}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{opt.name}</span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{opt.slug}</span>
                    {opt.is_on_sale && <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">On Sale</span>}
                    {!opt.is_active && <span className="text-xs bg-slate-100 text-slate-400 font-semibold px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  {opt.description && <p className="text-sm text-slate-500 mt-0.5 truncate">{opt.description}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Base Price</p>
                    <p className="font-bold text-slate-800">£{Number(opt.base_price).toFixed(2)}</p>
                  </div>
                  {opt.sale_price != null && (
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Sale Price</p>
                      <p className="font-bold text-orange-600">£{Number(opt.sale_price).toFixed(2)}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(opt)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteOption(opt.id)}
                      disabled={deletingId === opt.id}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40"
                    >
                      {deletingId === opt.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FinishForm({ draft, onChange }: { draft: Partial<FinishOption>; onChange: (d: any) => void }) {
  const set = (field: string, value: any) => onChange({ ...draft, [field]: value });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Field label="Name"><input value={draft.name ?? ''} onChange={e => set('name', e.target.value)} className={input} placeholder="e.g. Matte" /></Field>
      <Field label="Slug"><input value={draft.slug ?? ''} onChange={e => set('slug', e.target.value)} className={input} placeholder="e.g. matte" /></Field>
      <Field label="Description"><input value={draft.description ?? ''} onChange={e => set('description', e.target.value)} className={input} placeholder="Short description" /></Field>
      <Field label="Base Price (£)"><input type="number" step="0.01" min="0" value={draft.base_price ?? ''} onChange={e => set('base_price', e.target.value)} className={input} /></Field>
      <Field label="Sale Price (£)"><input type="number" step="0.01" min="0" value={draft.sale_price ?? ''} placeholder="Leave blank for none" onChange={e => set('sale_price', e.target.value === '' ? null : e.target.value)} className={input} /></Field>
      <Field label="Flags">
        <div className="flex gap-4 pt-1">
          <Toggle label="On Sale" checked={!!draft.is_on_sale} onChange={v => set('is_on_sale', v)} />
          <Toggle label="Active" checked={draft.is_active !== false} onChange={v => set('is_active', v)} />
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><label className="text-xs font-semibold text-slate-500 uppercase">{label}</label>{children}</div>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2 text-sm text-slate-600">
      <span className={`w-9 h-5 rounded-full relative transition-colors ${checked ? 'bg-green-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
      {label}
    </button>
  );
}
function Spinner() {
  return <div className="flex justify-center items-center min-h-[300px]"><Loader2 size={28} className="animate-spin text-slate-400" /></div>;
}

const input = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white';
const btnPrimary = 'flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors';
const btnGhost = 'flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-lg transition-colors';
