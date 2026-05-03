'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { useToast } from '@/lib/toast/ToastContext';
import { Loader2, Save, X } from 'lucide-react';

interface ModelSize {
  id: string;
  size_mm: number;
}

interface TierMapping {
  id: string;
  model_size_id: string;
  price_override: number | null;
}

interface PaintingTier {
  id: string;
  name: string;
  price: number;
  sort_order: number;
  mappings?: TierMapping[];
}

export default function AdminPaintingTiersPage() {
  const [tiers, setTiers] = useState<PaintingTier[]>([]);
  const [allSizes, setAllSizes] = useState<ModelSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    Promise.all([
      apiClient.get('/painting-tiers'),
      apiClient.get('/model-sizes'),
    ])
      .then(([tiersRes, sizesRes]) => {
        setTiers(tiersRes.data as PaintingTier[]);
        setAllSizes((sizesRes.data as ModelSize[]).sort((a, b) => a.size_mm - b.size_mm));
      })
      .catch(() => error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const updateTier = (id: string, field: 'name' | 'price', value: string) => {
    setTiers(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const saveTier = async (tier: PaintingTier) => {
    setSaving(tier.id);
    try {
      await apiClient.put(`/painting-tiers/${tier.id}`, {
        name: tier.name,
        price: Number(tier.price),
      });
      success(`${tier.name} saved`);
    } catch {
      error('Failed to save tier');
    } finally {
      setSaving(null);
    }
  };

  const saveOverride = async (tierId: string, sizeId: string, overrideVal: string) => {
    setSaving(`${tierId}-${sizeId}`);
    try {
      const price = overrideVal === '' ? null : Number(overrideVal);
      await apiClient.put(`/painting-tiers/${tierId}/sizes/${sizeId}/override`, { price_override: price });
      success('Override saved');
    } catch {
      error('Failed to save override');
    } finally {
      setSaving(null);
    }
  };

  const getSizeMm = (sizeId: string) =>
    allSizes.find(s => s.id === sizeId)?.size_mm ?? '?';

  const getMappedSizeIds = (tier: PaintingTier) =>
    (tier.mappings ?? []).map(m => m.model_size_id);

  const getMapping = (tier: PaintingTier, sizeId: string) =>
    (tier.mappings ?? []).find(m => m.model_size_id === sizeId);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Painting Tiers</h1>
        <p className="text-slate-500 mt-1">Edit tier names, base prices, and per-size price overrides.</p>
      </div>

      <div className="space-y-6">
        {tiers.map(tier => {
          const mappedIds = getMappedSizeIds(tier);
          return (
            <div key={tier.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    value={tier.name}
                    onChange={e => updateTier(tier.id, 'name', e.target.value)}
                    className="text-lg font-bold text-slate-800 border-b-2 border-transparent focus:border-blue-400 bg-transparent focus:outline-none w-32"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 font-medium">Base price £</span>
                    <input
                      type="number" step="0.01" min="0"
                      value={tier.price}
                      onChange={e => updateTier(tier.id, 'price', e.target.value)}
                      className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>
                <button
                  onClick={() => saveTier(tier)}
                  disabled={saving === tier.id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {saving === tier.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Tier
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm font-semibold text-slate-500 mb-3">
                  Sizes in this tier ({mappedIds.length})
                  <span className="text-slate-400 font-normal ml-2">— set a price override per size or leave blank to use the tier base price</span>
                </p>
                {mappedIds.length === 0 ? (
                  <p className="text-slate-400 text-sm">No sizes mapped to this tier yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {mappedIds.map(sizeId => {
                      const mapping = getMapping(tier, sizeId);
                      const key = `${tier.id}-${sizeId}`;
                      return (
                        <div key={sizeId} className="border border-slate-200 rounded-lg p-3 space-y-2">
                          <p className="font-bold text-slate-700 text-sm">{getSizeMm(sizeId)}mm</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400">Override £</span>
                            <input
                              type="number" step="0.01" min="0"
                              defaultValue={mapping?.price_override ?? ''}
                              placeholder="—"
                              id={`override-${key}`}
                              className="w-16 px-2 py-1 border border-slate-200 rounded text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const el = document.getElementById(`override-${key}`) as HTMLInputElement;
                              saveOverride(tier.id, sizeId, el?.value ?? '');
                            }}
                            disabled={saving === key}
                            className="w-full text-xs py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded font-semibold transition-colors flex items-center justify-center gap-1 disabled:opacity-40"
                          >
                            {saving === key ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                            Save
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center items-center min-h-[300px]">
      <Loader2 size={28} className="animate-spin text-slate-400" />
    </div>
  );
}
