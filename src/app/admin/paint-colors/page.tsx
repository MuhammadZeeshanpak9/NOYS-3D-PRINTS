'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { useToast } from '@/lib/toast/ToastContext';
import { Loader2, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

interface PaintColor {
  id: string;
  name: string;
  hex_code: string;
  price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  is_active: boolean;
  sort_order: number;
}

const blank = (): Omit<PaintColor, 'id'> => ({
  name: '', hex_code: '#000000', price: 0,
  sale_price: null, is_on_sale: false, is_active: true, sort_order: 0,
});

export default function AdminPaintColorsPage() {
  const [colors, setColors] = useState<PaintColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<PaintColor>>({});
  const [adding, setAdding] = useState(false);
  const [addDraft, setAddDraft] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    apiClient.get('/paint-colors')
      .then(r => setColors(r.data as PaintColor[]))
      .catch(() => error('Failed to load paint colours'))
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (c: PaintColor) => {
    setEditingId(c.id);
    setEditDraft({ ...c });
    setAdding(false);
  };

  const cancelEdit = () => { setEditingId(null); setEditDraft({}); };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await apiClient.put(`/paint-colors/${editingId}`, {
        name: editDraft.name,
        hex_code: editDraft.hex_code,
        price: Number(editDraft.price),
        sale_price: editDraft.sale_price != null ? Number(editDraft.sale_price) : null,
        is_on_sale: editDraft.is_on_sale,
        is_active: editDraft.is_active,
      });
      setColors(prev => prev.map(c => c.id === editingId ? { ...c, ...res.data } : c));
      cancelEdit();
      success('Saved');
    } catch { error('Failed to save'); }
    finally { setSaving(false); }
  };

  const saveAdd = async () => {
    setSaving(true);
    try {
      const res = await apiClient.post('/paint-colors', {
        ...addDraft,
        price: Number(addDraft.price),
        sale_price: addDraft.sale_price != null ? Number(addDraft.sale_price) : null,
      });
      setColors(prev => [...prev, res.data as PaintColor]);
      setAdding(false);
      setAddDraft(blank());
      success('Paint colour added');
    } catch { error('Failed to add'); }
    finally { setSaving(false); }
  };

  const deleteColor = async (id: string) => {
    setDeletingId(id);
    try {
      await apiClient.delete(`/paint-colors/${id}`);
      setColors(prev => prev.filter(c => c.id !== id));
      success('Deleted');
    } catch { error('Failed to delete'); }
    finally { setDeletingId(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Paint Colours</h1>
          <p className="text-sm text-slate-500 mt-1">{colors.length} colour{colors.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setAdding(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={16} /> Add Colour
        </button>
      </div>

      {/* Add Form */}
      {adding && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-blue-800">New Paint Colour</h3>
          <ColorForm draft={addDraft} onChange={setAddDraft} />
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

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {colors.map(c => (
          <div key={c.id} className={`bg-white rounded-xl border-2 ${c.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'} shadow-sm overflow-hidden`}>
            {editingId === c.id ? (
              <div className="p-4 space-y-4">
                <ColorForm draft={editDraft as PaintColor} onChange={d => setEditDraft(d)} />
                <div className="flex gap-2 justify-end">
                  <button onClick={cancelEdit} className={btnGhost}><X size={14} /> Cancel</button>
                  <button onClick={saveEdit} disabled={saving} className={btnPrimary}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="h-20 w-full" style={{ backgroundColor: c.hex_code }} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">{c.name}</p>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{c.hex_code}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteColor(c.id)}
                        disabled={deletingId === c.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40"
                      >
                        {deletingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-2">
                      {c.is_on_sale && <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">Sale</span>}
                      {!c.is_active && <span className="text-xs bg-slate-100 text-slate-400 font-semibold px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <div className="text-right">
                      {c.is_on_sale && c.sale_price != null
                        ? <><span className="text-xs line-through text-slate-400 mr-1">£{Number(c.price).toFixed(2)}</span><span className="font-bold text-orange-600">£{Number(c.sale_price).toFixed(2)}</span></>
                        : <span className="font-bold text-slate-800">£{Number(c.price).toFixed(2)}</span>
                      }
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ColorForm({ draft, onChange }: { draft: Partial<PaintColor>; onChange: (d: any) => void }) {
  const set = (field: string, value: any) => onChange({ ...draft, [field]: value });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Colour Name"><input value={draft.name ?? ''} onChange={e => set('name', e.target.value)} className={input} placeholder="e.g. Crimson Red" /></Field>
      <Field label="Hex Code">
        <div className="flex items-center gap-2">
          <input type="color" value={draft.hex_code ?? '#000000'} onChange={e => set('hex_code', e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
          <input value={draft.hex_code ?? ''} onChange={e => set('hex_code', e.target.value)} className={`${input} font-mono`} maxLength={7} placeholder="#000000" />
        </div>
      </Field>
      <Field label="Price (£)"><input type="number" step="0.01" min="0" value={draft.price ?? ''} onChange={e => set('price', e.target.value)} className={input} /></Field>
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
