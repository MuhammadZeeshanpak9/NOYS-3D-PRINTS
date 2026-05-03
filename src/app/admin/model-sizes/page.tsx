'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { useToast } from '@/lib/toast/ToastContext';
import { Loader2, Save } from 'lucide-react';

interface ModelSize {
  id: string;
  size_mm: number;
  price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  is_active: boolean;
  sort_order: number;
}

export default function AdminModelSizesPage() {
  const [sizes, setSizes] = useState<ModelSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    apiClient.get('/model-sizes')
      .then(r => setSizes(r.data as ModelSize[]))
      .catch(() => error('Failed to load sizes'))
      .finally(() => setLoading(false));
  }, []);

  const update = (id: string, field: keyof ModelSize, value: string | boolean | number | null) => {
    setSizes(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const save = async (size: ModelSize) => {
    setSaving(size.id);
    try {
      await apiClient.put(`/model-sizes/${size.id}`, {
        price: Number(size.price),
        sale_price: size.sale_price != null ? Number(size.sale_price) : null,
        is_on_sale: size.is_on_sale,
        is_active: size.is_active,
      });
      success(`${size.size_mm}mm saved`);
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
        <h1 className="text-3xl font-bold text-slate-900">Model Sizes</h1>
        <p className="text-slate-500 mt-1">Edit individual pricing for each size. Changes apply immediately on save.</p>
      </div>

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
                <th className="px-5 py-3 text-slate-500 text-sm font-medium text-right">Save</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sizes.map(size => (
                <tr key={size.id} className={`hover:bg-slate-50 ${!size.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3 font-bold text-slate-800">{size.size_mm}mm</td>
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
                  <td className="px-5 py-3 text-right">
                    <SaveBtn loading={saving === size.id} onClick={() => save(size)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-24 px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300';

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
