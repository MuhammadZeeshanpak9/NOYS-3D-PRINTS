'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { useToast } from '@/lib/toast/ToastContext';
import { Loader2, Save } from 'lucide-react';

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

export default function AdminFinishOptionsPage() {
  const [options, setOptions] = useState<FinishOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    apiClient.get('/finish-options')
      .then(r => setOptions(r.data as FinishOption[]))
      .catch(() => error('Failed to load finish options'))
      .finally(() => setLoading(false));
  }, []);

  const update = (id: string, field: keyof FinishOption, value: string | boolean | number | null) => {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const save = async (opt: FinishOption) => {
    setSaving(opt.id);
    try {
      await apiClient.put(`/finish-options/${opt.id}`, {
        name: opt.name,
        description: opt.description,
        base_price: Number(opt.base_price),
        sale_price: opt.sale_price != null ? Number(opt.sale_price) : null,
        is_on_sale: opt.is_on_sale,
        is_active: opt.is_active,
      });
      success(`${opt.name} saved`);
    } catch {
      error('Failed to save');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Finish Options</h1>
        <p className="text-slate-500 mt-1">Edit names, descriptions, and pricing for each finish type.</p>
      </div>

      <div className="space-y-4">
        {options.map(opt => (
          <div key={opt.id} className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 ${!opt.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{opt.slug}</span>
                <h3 className="text-lg font-bold text-slate-800 mt-0.5">{opt.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Toggle checked={opt.is_on_sale} onChange={v => update(opt.id, 'is_on_sale', v)} />
                  On Sale
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Toggle checked={opt.is_active} onChange={v => update(opt.id, 'is_active', v)} />
                  Active
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Name</label>
                <input
                  value={opt.name}
                  onChange={e => update(opt.id, 'name', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Base Price (£)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={opt.base_price}
                  onChange={e => update(opt.id, 'base_price', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Sale Price (£)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={opt.sale_price ?? ''}
                  placeholder="—"
                  onChange={e => update(opt.id, 'sale_price', e.target.value === '' ? null : e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                <input
                  value={opt.description ?? ''}
                  onChange={e => update(opt.id, 'description', e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => save(opt)}
                disabled={saving === opt.id}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {saving === opt.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-slate-300'} relative shrink-0`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
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
