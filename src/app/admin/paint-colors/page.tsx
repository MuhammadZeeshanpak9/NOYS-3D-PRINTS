'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { useToast } from '@/lib/toast/ToastContext';
import { Loader2, Save } from 'lucide-react';

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

export default function AdminPaintColorsPage() {
  const [colors, setColors] = useState<PaintColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    apiClient.get('/paint-colors')
      .then(r => setColors(r.data as PaintColor[]))
      .catch(() => error('Failed to load paint colours'))
      .finally(() => setLoading(false));
  }, []);

  const update = (id: string, field: keyof PaintColor, value: string | boolean | number | null) => {
    setColors(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const save = async (color: PaintColor) => {
    setSaving(color.id);
    try {
      await apiClient.put(`/paint-colors/${color.id}`, {
        name: color.name,
        hex_code: color.hex_code,
        price: Number(color.price),
        sale_price: color.sale_price != null ? Number(color.sale_price) : null,
        is_on_sale: color.is_on_sale,
        is_active: color.is_active,
      });
      success(`${color.name} saved`);
    } catch {
      error('Failed to save');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[300px]">
      <Loader2 size={28} className="animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Paint Colours</h1>
        <p className="text-slate-500 mt-1">Manage available extra paint pot colours and pricing.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-slate-500 text-sm font-medium">Colour</th>
                <th className="px-5 py-3 text-slate-500 text-sm font-medium">Name</th>
                <th className="px-5 py-3 text-slate-500 text-sm font-medium">Hex</th>
                <th className="px-5 py-3 text-slate-500 text-sm font-medium">Price (£)</th>
                <th className="px-5 py-3 text-slate-500 text-sm font-medium">Sale Price (£)</th>
                <th className="px-5 py-3 text-slate-500 text-sm font-medium">On Sale</th>
                <th className="px-5 py-3 text-slate-500 text-sm font-medium">Active</th>
                <th className="px-5 py-3 text-slate-500 text-sm font-medium text-right">Save</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {colors.map(color => (
                <tr key={color.id} className={`hover:bg-slate-50 ${!color.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-slate-200 shadow-sm shrink-0"
                        style={{ backgroundColor: color.hex_code }}
                      />
                      <input
                        type="color"
                        value={color.hex_code}
                        onChange={e => update(color.id, 'hex_code', e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent opacity-0 absolute"
                        title="Pick colour"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <input
                      value={color.name}
                      onChange={e => update(color.id, 'name', e.target.value)}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={color.hex_code}
                        onChange={e => update(color.id, 'hex_code', e.target.value)}
                        className={`${inputCls} w-24 font-mono`}
                        maxLength={7}
                      />
                      <div className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: color.hex_code }} />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="number" step="0.01" min="0"
                      value={color.price}
                      onChange={e => update(color.id, 'price', e.target.value)}
                      className={`${inputCls} w-20`}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="number" step="0.01" min="0"
                      value={color.sale_price ?? ''}
                      placeholder="—"
                      onChange={e => update(color.id, 'sale_price', e.target.value === '' ? null : e.target.value)}
                      className={`${inputCls} w-20`}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Toggle checked={color.is_on_sale} onChange={v => update(color.id, 'is_on_sale', v)} />
                  </td>
                  <td className="px-5 py-3">
                    <Toggle checked={color.is_active} onChange={v => update(color.id, 'is_active', v)} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => save(color)}
                      disabled={saving === color.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      {saving === color.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      Save
                    </button>
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

const inputCls = 'w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-slate-300'} relative`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}
