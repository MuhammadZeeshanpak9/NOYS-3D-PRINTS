'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { useToast } from '@/lib/toast/ToastContext';
import { Loader2, Save, Plus, Trash2, Check, X } from 'lucide-react';

interface ModelSize {
  id: string;
  size_label: string;
  price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  is_active: boolean;
  sort_order: number;
}

const blankDraft = { size_label: '', price: '' };

export default function AdminModelSizesPage() {
  const [sizes, setSizes] = useState<ModelSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addDraft, setAddDraft] = useState(blankDraft);
  const [addSaving, setAddSaving] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    // active_only=false — admins need to see inactive sizes too, otherwise
    // switching a size off with the Active toggle below hides it forever
    // with no way to switch it back on.
    apiClient.get('/model-sizes?active_only=false')
      .then(r => setSizes(r.data as ModelSize[]))
      .catch(() => error('Failed to load sizes'))
      .finally(() => setLoading(false));
  }, []);

  const update = (id: string, field: keyof ModelSize, value: string | boolean | number | null) => {
    setSizes(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const save = async (size: ModelSize) => {
    if (!size.size_label.trim()) {
      error('Size label cannot be empty');
      return;
    }
    setSaving(size.id);
    try {
      await apiClient.put(`/model-sizes/${size.id}`, {
        size_label: size.size_label.trim(),
        price: Number(size.price),
        sale_price: size.sale_price != null ? Number(size.sale_price) : null,
        is_on_sale: size.is_on_sale,
        is_active: size.is_active,
      });
      success(`${size.size_label} saved`);
    } catch {
      error('Failed to save');
    } finally {
      setSaving(null);
    }
  };

  const saveAdd = async () => {
    if (!addDraft.size_label.trim() || !addDraft.price) {
      error('Size and price are required');
      return;
    }
    setAddSaving(true);
    try {
      const res = await apiClient.post('/model-sizes', {
        size_label: addDraft.size_label.trim(),
        price: Number(addDraft.price),
        sort_order: sizes.length,
      });
      setSizes(prev => [...prev, res.data as ModelSize]);
      setAdding(false);
      setAddDraft(blankDraft);
      success(`${addDraft.size_label} added`);
    } catch {
      error('Failed to add size');
    } finally {
      setAddSaving(false);
    }
  };

  const deleteSize = async (size: ModelSize) => {
    setDeletingId(size.id);
    try {
      await apiClient.delete(`/model-sizes/${size.id}`);
      setSizes(prev => prev.filter(s => s.id !== size.id));
      success(`${size.size_label} removed`);
    } catch {
      error('Failed to delete — it may be in use by an existing order or pricing tier');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Model Sizes</h1>
          <p className="text-slate-500 mt-1">Add new sizes or edit pricing for existing ones. Changes apply immediately on save.</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
        >
          <Plus size={16} /> Add Size
        </button>
      </div>

      {adding && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-blue-800">New Model Size</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            <Field label="Scale / Size">
              <input
                type="text"
                value={addDraft.size_label}
                onChange={e => setAddDraft(d => ({ ...d, size_label: e.target.value }))}
                className={labelInputCls}
                placeholder="e.g. 1:12 Scale"
              />
            </Field>
            <Field label="Price (£)">
              <input
                type="number" min="0" step="0.01"
                value={addDraft.price}
                onChange={e => setAddDraft(d => ({ ...d, price: e.target.value }))}
                className={inputCls}
                placeholder="0.00"
              />
            </Field>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setAdding(false); setAddDraft(blankDraft); }} className={btnGhost}>
              <X size={14} /> Cancel
            </button>
            <button onClick={saveAdd} disabled={addSaving} className={btnPrimary}>
              {addSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Add Size
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-slate-500 text-sm font-medium">Size</th>
                <th className="px-5 py-3 text-slate-500 text-sm font-medium">Price (£)</th>
                <th className="px-5 py-3 text-slate-500 text-sm font-medium">Sale Price (£)</th>
                <th className="px-5 py-3 text-slate-500 text-sm font-medium">On Sale</th>
                <th className="px-5 py-3 text-slate-500 text-sm font-medium">Active</th>
                <th className="px-5 py-3 text-slate-500 text-sm font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sizes.map(size => (
                <tr key={size.id} className={`hover:bg-slate-50 ${!size.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3">
                    <input
                      type="text"
                      value={size.size_label}
                      onChange={e => update(size.id, 'size_label', e.target.value)}
                      className={`${labelInputCls} font-bold`}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="number" step="0.01" min="0"
                      value={size.price}
                      onChange={e => update(size.id, 'price', e.target.value)}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="number" step="0.01" min="0"
                      value={size.sale_price ?? ''}
                      placeholder="—"
                      onChange={e => update(size.id, 'sale_price', e.target.value === '' ? null : e.target.value)}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Toggle checked={size.is_on_sale} onChange={v => update(size.id, 'is_on_sale', v)} />
                  </td>
                  <td className="px-5 py-3">
                    <Toggle checked={size.is_active} onChange={v => update(size.id, 'is_active', v)} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <SaveBtn loading={saving === size.id} onClick={() => save(size)} />
                      <button
                        onClick={() => deleteSize(size)}
                        disabled={deletingId === size.id}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40"
                        aria-label="Delete size"
                      >
                        {deletingId === size.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sizes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    No sizes yet — click "Add Size" to create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-24 px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300';
const labelInputCls = 'w-40 px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300';
const btnPrimary = 'flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors';
const btnGhost = 'flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-lg transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><label className="text-xs font-semibold text-slate-500 uppercase">{label}</label>{children}</div>;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-slate-300'} relative`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function SaveBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
      Save
    </button>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center items-center min-h-[300px]">
      <Loader2 size={28} className="animate-spin text-slate-400" />
    </div>
  );
}
