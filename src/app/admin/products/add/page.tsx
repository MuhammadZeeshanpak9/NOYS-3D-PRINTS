'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api/client';
import { useToast } from '@/lib/toast/ToastContext';
import { ProductMediaManager, MediaItem, uploadPendingMedia } from '@/components/admin/ProductMediaManager';

interface ColourEntry {
  name: string;
  hex_code: string;
}

interface ScaleEntry {
  label: string;
  price: number;
}

interface Category {
  id: string;
  name: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    status: 'active',
    category_ids: [] as string[]
  });

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [colours, setColours] = useState<ColourEntry[]>([]);
  const [colourPresets, setColourPresets] = useState<ColourEntry[]>([]);
  const [scaleEnabled, setScaleEnabled] = useState(false);
  const [scales, setScales] = useState<ScaleEntry[]>([
    { label: '1:12 Scale', price: 0 },
    { label: '1:24 Scale', price: 0 },
  ]);

  useEffect(() => {
    fetchCategories();
    fetchColourPresets();
  }, []);

  const fetchColourPresets = async () => {
    try {
      const res = await apiClient.get('/colour-presets');
      setColourPresets(res.data || []);
    } catch {
      // presets are optional — silently skip if unavailable
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      toastError('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.description) {
      toastError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const uploadedMedia = await uploadPendingMedia(media, apiClient);
      const primaryImage = uploadedMedia.find(m => m.media_type === 'image');

      await apiClient.post('/products', {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        status: formData.status,
        category_ids: formData.category_ids,
        image_url: primaryImage?.url ?? '',
        media: uploadedMedia,
        colours: colours.filter(c => c.name.trim() && c.hex_code),
        scale_variations: scaleEnabled && scales.filter(s => s.label.trim() && s.price > 0).length > 0
          ? { enabled: true, scales: scales.filter(s => s.label.trim() && s.price > 0) }
          : null,
      });

      success('Product created successfully!');
      router.push('/admin/products');
    } catch (err: any) {
      console.error('Failed to create product:', err);
      toastError(err.response?.data?.error || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Add New Product</h1>
          <p className="text-sm text-slate-500 mt-1">Create a new product listing for your shop.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Product Name</label>
                <input 
                  required 
                  type="text" 
                  name="name"
                  placeholder="E.g. Fantasy Castle Miniature" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Price (£)</label>
                <input 
                  required 
                  type="number" 
                  name="price"
                  step="0.01" 
                  placeholder="0.00" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                  value={formData.price}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <select 
                  name="status"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow bg-white text-slate-700"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-sm font-semibold text-slate-700 block mb-3">Categories</label>
                {loadingCategories ? (
                  <p className="text-sm text-slate-500">Loading categories...</p>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-slate-500">No categories available</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={formData.category_ids.includes(cat.id)}
                            onChange={() => toggleCategory(cat.id)}
                            className="peer sr-only"
                          />
                          <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors select-none">
                          {cat.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 flex flex-col">
              <div className="space-y-2 flex-1 flex flex-col">
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea 
                  required 
                  name="description"
                  placeholder="Describe the product details..." 
                  className="w-full flex-1 min-h-[160px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow resize-none"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <ProductMediaManager media={media} onChange={setMedia} />

          {/* ── Colour Options ──────────────────────────────────── */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Print Colours</h3>
                <p className="text-xs text-slate-400 mt-0.5">Customers will choose one before adding to cart</p>
              </div>
              <button
                type="button"
                onClick={() => setColours(prev => [...prev, { name: '', hex_code: '#3b82f6' }])}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus size={16} /> Add Colour
              </button>
            </div>
            {colourPresets.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-500 font-medium">Quick-add from saved presets:</p>
                <div className="flex flex-wrap gap-2">
                  {colourPresets.map(p => (
                    <button
                      key={p.hex_code + p.name}
                      type="button"
                      title={`Add ${p.name}`}
                      onClick={() => { if (!colours.some(c => c.name === p.name)) setColours(prev => [...prev, { name: p.name, hex_code: p.hex_code }]); }}
                      className="w-8 h-8 rounded-full border-2 border-slate-300 hover:border-blue-400 hover:scale-110 transition-all shadow-sm"
                      style={{ backgroundColor: p.hex_code }}
                      aria-label={`Add ${p.name}`}
                    />
                  ))}
                </div>
              </div>
            )}
            {colours.length === 0 && (
              <p className="text-sm text-slate-400 italic">No colours added — customers can add to cart without selecting a colour.</p>
            )}
            <div className="space-y-3">
              {colours.map((c, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={c.hex_code}
                    onChange={e => setColours(prev => prev.map((x, i) => i === idx ? { ...x, hex_code: e.target.value } : x))}
                    className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    placeholder="Colour name (e.g. Bone White)"
                    value={c.name}
                    onChange={e => setColours(prev => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <span className="text-xs text-slate-400 font-mono w-16">{c.hex_code}</span>
                  <button
                    type="button"
                    onClick={() => setColours(prev => prev.filter((_, i) => i !== idx))}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    aria-label="Remove colour"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Scale Variations ────────────────────────────────── */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Scale Variations</h3>
                <p className="text-xs text-slate-400 mt-0.5">Offer this product at different scales with individual prices</p>
              </div>
              <button
                type="button"
                onClick={() => setScaleEnabled(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${scaleEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                aria-label="Toggle scale variations"
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${scaleEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            {scaleEnabled && (
              <div className="space-y-3">
                {scales.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Scale label (e.g. 1:12 Scale)"
                      value={s.label}
                      onChange={e => setScales(prev => prev.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-slate-500">£</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={s.price || ''}
                        onChange={e => setScales(prev => prev.map((x, i) => i === idx ? { ...x, price: parseFloat(e.target.value) || 0 } : x))}
                        className="w-24 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setScales(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      aria-label="Remove scale"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setScales(prev => [...prev, { label: '', price: 0 }])}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Plus size={16} /> Add Scale
                </button>
              </div>
            )}
          </div>

        </div>

        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link href="/admin/products" className="px-5 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors">
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={loading} 
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-70"
          >
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
