'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/components/ui/Button';
import {
  Upload, Wand2, ChevronRight, ChevronLeft, Check,
  Minus, Plus, Info, ShoppingCart, Loader2, X, ImageIcon,
  AlertCircle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ModelSize {
  id: string;
  size_mm: number;
  price: number;
  is_on_sale: boolean;
  sale_price: number | null;
  is_active: boolean;
}

interface FinishOption {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  is_on_sale: boolean;
  sale_price: number | null;
  is_active: boolean;
}

interface PaintColor {
  id: string;
  name: string;
  hex_code: string;
  price: number;
  is_on_sale: boolean;
  sale_price: number | null;
  is_active: boolean;
}

interface PaintExtra {
  color: PaintColor;
  quantity: number;
}

interface Generation {
  id: string;
  prompt: string;
  image_url: string;
  is_saved: boolean;
  created_at: string;
}

interface PricingResult {
  size: { id: string; size_mm: number; price: number; is_on_sale: boolean };
  finish: { id: string; name: string; slug: string; price: number; is_on_sale: boolean };
  painting: { tier_id: string; tier_name: string; price: number } | null;
  extras: Array<{
    paint_color_id: string; color_name: string; hex_code: string;
    quantity: number; unit_price: number; line_total: number; is_on_sale: boolean;
  }>;
  extras_total: number;
  subtotal_before_discount: number;
  discount_eligible_amount: number;
  membership_tier: string | null;
  discount_percentage: number;
  discount_amount: number;
  delivery: { qualifies_free: boolean; price: number; free_threshold: number; amount_to_free: number };
  total: number;
}

type Step = 'image' | 'size' | 'finish' | 'extras' | 'summary';
const ALL_STEPS: Step[] = ['image', 'size', 'finish', 'extras', 'summary'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `£${n.toFixed(2)}`;
}

function effectivePrice(price: number, isOnSale: boolean, salePrice: number | null) {
  return isOnSale && salePrice != null ? salePrice : price;
}

function getBackendBase() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  return apiUrl.replace(/\/api\/v1\/?$/, '');
}

function resolveImageUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${getBackendBase()}${url}`;
}

// ─── Step labels ─────────────────────────────────────────────────────────────

const STEP_LABEL: Record<Step, string> = {
  image: 'Reference Image',
  size: 'Select Size',
  finish: 'Choose Finish',
  extras: 'Paint Extras',
  summary: 'Review Order',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BuilderPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('image');

  // Image
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loadingGenerations, setLoadingGenerations] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);

  // Product config
  const [modelSizes, setModelSizes] = useState<ModelSize[]>([]);
  const [finishOptions, setFinishOptions] = useState<FinishOption[]>([]);
  const [paintColors, setPaintColors] = useState<PaintColor[]>([]);
  const [selectedSize, setSelectedSize] = useState<ModelSize | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<FinishOption | null>(null);
  const [paintExtras, setPaintExtras] = useState<PaintExtra[]>([]);

  // Pricing
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);

  // ── Pick up pre-selected generation from AI generator ─────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem('noys_builder_preselect');
    if (!raw) return;
    try {
      const { generationId, imageUrl } = JSON.parse(raw) as { generationId: string; imageUrl: string };
      sessionStorage.removeItem('noys_builder_preselect');
      setImageSource('ai');
      setSelectedGeneration({ id: generationId, image_url: imageUrl, prompt: 'AI generation', is_saved: true, created_at: '' });
      setImagePreview(resolveImageUrl(imageUrl));
    } catch {
      // ignore malformed data
    }
  }, []);

  // ── Load reference data ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [sizesRes, finishRes, colorsRes] = await Promise.all([
          apiClient.get('/model-sizes'),
          apiClient.get('/finish-options'),
          apiClient.get('/paint-colors'),
        ]);
        setModelSizes((sizesRes.data as ModelSize[]).filter(s => s.is_active));
        setFinishOptions((finishRes.data as FinishOption[]).filter(f => f.is_active));
        setPaintColors((colorsRes.data as PaintColor[]).filter(c => c.is_active));
      } catch {
        // silently handle — UI already shows empty states
      }
    };
    load();
  }, []);

  // ── Load AI generations when that source is chosen ─────────────────────────
  useEffect(() => {
    if (imageSource !== 'ai' || generations.length > 0) return;
    const load = async () => {
      setLoadingGenerations(true);
      try {
        const res = await apiClient.get('/generations');
        setGenerations(res.data as Generation[]);
      } catch {
        setGenerations([]);
      } finally {
        setLoadingGenerations(false);
      }
    };
    load();
  }, [imageSource]);

  // ── Recalculate pricing whenever selections change ─────────────────────────
  useEffect(() => {
    if (!selectedSize || !selectedFinish) {
      setPricing(null);
      return;
    }
    let cancelled = false;
    const calculate = async () => {
      setLoadingPricing(true);
      try {
        const res = await apiClient.post('/pricing/calculate', {
          model_size_id: selectedSize.id,
          finish_option_id: selectedFinish.id,
          paint_extras: paintExtras.map(pe => ({
            paint_color_id: pe.color.id,
            quantity: pe.quantity,
          })),
        });
        if (!cancelled) setPricing(res.data as PricingResult);
      } catch {
        if (!cancelled) setPricing(null);
      } finally {
        if (!cancelled) setLoadingPricing(false);
      }
    };
    calculate();
    return () => { cancelled = true; };
  }, [selectedSize, selectedFinish, paintExtras]);

  // ── File upload handler ────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setImagePreview(URL.createObjectURL(file));
    setIsUploading(true);
    setUploadedImageUrl(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedImageUrl(res.data.url as string);
    } catch {
      setUploadError('Upload failed. Please try a JPG or PNG under 10 MB.');
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Paint extras ───────────────────────────────────────────────────────────
  const updateExtra = (color: PaintColor, delta: number) => {
    setPaintExtras(prev => {
      const existing = prev.find(pe => pe.color.id === color.id);
      if (existing) {
        const next = existing.quantity + delta;
        if (next <= 0) return prev.filter(pe => pe.color.id !== color.id);
        return prev.map(pe => pe.color.id === color.id ? { ...pe, quantity: next } : pe);
      }
      if (delta > 0) return [...prev, { color, quantity: 1 }];
      return prev;
    });
  };
  const extraQty = (colorId: string) =>
    paintExtras.find(pe => pe.color.id === colorId)?.quantity ?? 0;

  // ── Step navigation ────────────────────────────────────────────────────────
  const isDiyKit = selectedFinish?.slug === 'diy_kit';

  const visibleSteps = ALL_STEPS.filter(s => s !== 'extras' || isDiyKit);

  const canProceed: Record<Step, boolean> = {
    image: !!(uploadedImageUrl || selectedGeneration),
    size: !!selectedSize,
    finish: !!selectedFinish,
    extras: true,
    summary: !!pricing && !loadingPricing,
  };

  const goNext = () => {
    const idx = ALL_STEPS.indexOf(step);
    for (let i = idx + 1; i < ALL_STEPS.length; i++) {
      const s = ALL_STEPS[i];
      if (s === 'extras' && !isDiyKit) continue;
      setStep(s);
      return;
    }
  };

  const goBack = () => {
    const idx = ALL_STEPS.indexOf(step);
    for (let i = idx - 1; i >= 0; i--) {
      const s = ALL_STEPS[i];
      if (s === 'extras' && !isDiyKit) continue;
      setStep(s);
      return;
    }
  };

  // ── Proceed to checkout ────────────────────────────────────────────────────
  const handleCheckout = () => {
    if (!pricing || !selectedSize || !selectedFinish) return;
    const order = {
      referenceImageUrl: uploadedImageUrl ?? selectedGeneration?.image_url,
      imagePreview: imagePreview ?? resolveImageUrl(selectedGeneration?.image_url ?? ''),
      generationId: selectedGeneration?.id ?? null,
      imageSource: imageSource as 'upload' | 'ai',
      modelSizeId: selectedSize.id,
      finishOptionId: selectedFinish.id,
      finishSlug: selectedFinish.slug,
      paintExtras: paintExtras.map(pe => ({
        paintColorId: pe.color.id,
        quantity: pe.quantity,
        colorName: pe.color.name,
        hexCode: pe.color.hex_code,
        unitPrice: effectivePrice(pe.color.price, pe.color.is_on_sale, pe.color.sale_price),
      })),
      pricing,
      sizeMm: selectedSize.size_mm,
      finishName: selectedFinish.name,
    };
    sessionStorage.setItem('noys_pending_order', JSON.stringify(order));
    router.push('/builder/checkout');
  };

  // ── Step indicator helpers ─────────────────────────────────────────────────
  const currentVisibleIdx = visibleSteps.indexOf(step);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-64px)] bg-sky-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-[#0c2a50]">Build Your Custom 3D Model</h1>
          <p className="text-[#1a4073] mt-2 text-lg">
            Upload your image or use AI, then configure your model.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {visibleSteps.map((s, idx) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-9 h-9 rounded-full border-4 flex items-center justify-center font-black text-sm transition-all',
                idx < currentVisibleIdx
                  ? 'bg-green-500 border-green-700 text-white'
                  : idx === currentVisibleIdx
                    ? 'bg-[#ff7b00] border-[#cc6200] text-white'
                    : 'bg-white border-[#1a4073] text-[#1a4073]'
              )}>
                {idx < currentVisibleIdx ? <Check size={16} strokeWidth={3} /> : idx + 1}
              </div>
              <span className={cn(
                'text-sm font-bold hidden sm:block',
                idx === currentVisibleIdx ? 'text-[#ff7b00]' : 'text-[#1a4073]/60'
              )}>
                {STEP_LABEL[s]}
              </span>
              {idx < visibleSteps.length - 1 && (
                <div className={cn('w-8 h-1 rounded-full', idx < currentVisibleIdx ? 'bg-green-400' : 'bg-[#1a4073]/20')} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <Card className="mb-6">
          <CardContent className="p-6 sm:p-8">

            {/* ── STEP: IMAGE ─────────────────────────────────────────────── */}
            {step === 'image' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[#0c2a50] mb-1">Reference Image</h2>
                  <p className="text-gray-500">Choose how to provide your model reference.</p>
                </div>

                {/* Notice */}
                <div className="flex gap-3 items-start bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
                  <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-amber-800">
                    Images are reviewed before production. If unsuitable, we'll contact you to update it.
                  </p>
                </div>

                {/* Source picker */}
                {!imageSource && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setImageSource('upload')}
                      className="group border-4 border-[#1a4073] rounded-[2rem] p-8 bg-white hover:bg-blue-50 shadow-[6px_6px_0px_#1a4073] hover:-translate-y-1 transition-all text-center"
                    >
                      <Upload size={40} className="mx-auto text-[#1a4073] mb-3" />
                      <h3 className="text-xl font-black text-[#0c2a50]">Upload My Image</h3>
                      <p className="text-gray-500 text-sm mt-1">JPG or PNG, up to 10 MB</p>
                    </button>
                    <button
                      onClick={() => setImageSource('ai')}
                      className="group border-4 border-[#ff7b00] rounded-[2rem] p-8 bg-white hover:bg-orange-50 shadow-[6px_6px_0px_#cc6200] hover:-translate-y-1 transition-all text-center"
                    >
                      <Wand2 size={40} className="mx-auto text-[#ff7b00] mb-3" />
                      <h3 className="text-xl font-black text-[#0c2a50]">Use AI Generation</h3>
                      <p className="text-gray-500 text-sm mt-1">Pick from your saved AI models</p>
                    </button>
                  </div>
                )}

                {/* Upload flow */}
                {imageSource === 'upload' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setImageSource(null); setImagePreview(null); setUploadedImageUrl(null); setUploadError(null); }}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        ← Change method
                      </button>
                    </div>
                    {!imagePreview ? (
                      <label className="block border-4 border-dashed border-[#1a4073] rounded-[2rem] p-10 text-center cursor-pointer bg-white hover:bg-blue-50 transition-all shadow-[6px_6px_0px_rgba(26,64,115,0.2)] hover:shadow-[6px_6px_0px_#1a4073]">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Upload size={40} className="mx-auto text-[#1a4073] mb-3" />
                        <p className="font-bold text-[#1a4073]">Click to upload your image</p>
                        <p className="text-gray-400 text-sm mt-1">JPG, PNG, WebP accepted</p>
                      </label>
                    ) : (
                      <div className="relative rounded-[2rem] overflow-hidden border-4 border-[#1a4073] shadow-[6px_6px_0px_#1a4073] aspect-video flex items-center justify-center bg-gray-50">
                        <img src={imagePreview} alt="Preview" className="object-contain max-h-72 max-w-full" />
                        {isUploading && (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <Loader2 size={32} className="animate-spin text-[#ff7b00]" />
                            <span className="ml-2 font-bold text-[#1a4073]">Uploading…</span>
                          </div>
                        )}
                        {!isUploading && uploadedImageUrl && (
                          <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full px-3 py-1 text-xs font-black flex items-center gap-1 shadow">
                            <Check size={12} /> Uploaded
                          </div>
                        )}
                        <button
                          onClick={() => { setImagePreview(null); setUploadedImageUrl(null); setUploadError(null); }}
                          className="absolute top-3 left-3 bg-white border-2 border-[#1a4073] rounded-full p-1 shadow hover:bg-red-50"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    {uploadError && (
                      <p className="text-red-600 text-sm font-semibold flex items-center gap-2">
                        <AlertCircle size={16} /> {uploadError}
                      </p>
                    )}
                  </div>
                )}

                {/* AI generation flow */}
                {imageSource === 'ai' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setImageSource(null); setSelectedGeneration(null); }}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        ← Change method
                      </button>
                    </div>
                    {loadingGenerations ? (
                      <div className="flex justify-center py-12">
                        <Loader2 size={32} className="animate-spin text-[#1a4073]" />
                      </div>
                    ) : generations.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <ImageIcon size={48} className="mx-auto text-gray-300" />
                        <p className="text-gray-500 font-semibold">No AI generations yet.</p>
                        <Button variant="secondary" onClick={() => router.push('/ai-generator')}>
                          <Wand2 size={16} className="mr-2" /> Go to AI Generator
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-gray-500">Select a generation to use as your reference:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-80 overflow-y-auto pr-1">
                          {generations.map(gen => (
                            <button
                              key={gen.id}
                              onClick={() => setSelectedGeneration(gen)}
                              className={cn(
                                'rounded-2xl border-4 overflow-hidden transition-all hover:-translate-y-1',
                                selectedGeneration?.id === gen.id
                                  ? 'border-[#ff7b00] shadow-[4px_4px_0px_#cc6200]'
                                  : 'border-[#1a4073] shadow-[4px_4px_0px_#1a4073]'
                              )}
                            >
                              <div className="aspect-square bg-gray-100 relative">
                                <img
                                  src={resolveImageUrl(gen.image_url)}
                                  alt={gen.prompt}
                                  className="object-cover w-full h-full"
                                />
                                {selectedGeneration?.id === gen.id && (
                                  <div className="absolute top-2 right-2 bg-[#ff7b00] rounded-full p-1">
                                    <Check size={12} className="text-white" strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                              <div className="p-2 bg-white text-left">
                                <p className="text-xs text-gray-600 truncate font-medium">{gen.prompt}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                        {selectedGeneration && (
                          <p className="text-sm font-bold text-green-600 flex items-center gap-2">
                            <Check size={14} strokeWidth={3} /> Selected: {selectedGeneration.prompt.slice(0, 60)}…
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP: SIZE ──────────────────────────────────────────────── */}
            {step === 'size' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[#0c2a50] mb-1">Select Your Size</h2>
                  <p className="text-gray-500">Choose the height of your printed model.</p>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {modelSizes.map(size => {
                    const price = effectivePrice(size.price, size.is_on_sale, size.sale_price);
                    const selected = selectedSize?.id === size.id;
                    return (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          'rounded-2xl border-4 p-3 text-center transition-all hover:-translate-y-1 relative',
                          selected
                            ? 'bg-[#ff7b00] border-[#cc6200] shadow-[4px_4px_0px_#cc6200] text-white'
                            : 'bg-white border-[#1a4073] shadow-[4px_4px_0px_#1a4073] text-[#0c2a50] hover:bg-blue-50'
                        )}
                      >
                        {size.is_on_sale && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">SALE</span>
                        )}
                        <div className="text-xl font-black">{size.size_mm}mm</div>
                        <div className={cn('text-sm font-bold mt-1', selected ? 'text-orange-100' : 'text-gray-500')}>
                          {fmt(price)}
                        </div>
                        {selected && (
                          <div className="absolute -top-2 -left-2 bg-green-500 rounded-full p-0.5">
                            <Check size={12} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── STEP: FINISH ────────────────────────────────────────────── */}
            {step === 'finish' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[#0c2a50] mb-1">Choose Your Finish</h2>
                  <p className="text-gray-500">Select how you'd like your model delivered.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {finishOptions.map(finish => {
                    const price = effectivePrice(finish.base_price, finish.is_on_sale, finish.sale_price);
                    const selected = selectedFinish?.id === finish.id;
                    const icons: Record<string, string> = {
                      unpainted: '🖨️',
                      diy_kit: '🎨',
                      painted: '✨',
                    };
                    return (
                      <button
                        key={finish.id}
                        onClick={() => {
                          setSelectedFinish(finish);
                          if (finish.slug !== 'diy_kit') setPaintExtras([]);
                        }}
                        className={cn(
                          'rounded-[2rem] border-4 p-6 text-left transition-all hover:-translate-y-1 relative',
                          selected
                            ? 'bg-[#ff7b00] border-[#cc6200] shadow-[6px_6px_0px_#cc6200] text-white'
                            : 'bg-white border-[#1a4073] shadow-[6px_6px_0px_#1a4073] text-[#0c2a50] hover:bg-blue-50'
                        )}
                      >
                        {finish.is_on_sale && (
                          <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">SALE</span>
                        )}
                        {selected && (
                          <div className="absolute top-3 left-3 bg-green-500 rounded-full p-1">
                            <Check size={14} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                        <div className="text-3xl mb-3">{icons[finish.slug] ?? '📦'}</div>
                        <h3 className={cn('text-lg font-black', selected ? 'text-white' : 'text-[#0c2a50]')}>{finish.name}</h3>
                        <p className={cn('text-sm mt-1 leading-snug', selected ? 'text-orange-100' : 'text-gray-500')}>{finish.description}</p>
                        <div className={cn('mt-4 text-xl font-black', selected ? 'text-white' : 'text-[#ff7b00]')}>
                          {price === 0 ? 'Included' : `+${fmt(price)}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── STEP: EXTRAS ────────────────────────────────────────────── */}
            {step === 'extras' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[#0c2a50] mb-1">Extra Paint Pots</h2>
                  <p className="text-gray-500">Add extra 5ml paint pots to your DIY kit — optional.</p>
                </div>
                {paintColors.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No paint colours available.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {paintColors.map(color => {
                      const qty = extraQty(color.id);
                      const price = effectivePrice(color.price, color.is_on_sale, color.sale_price);
                      return (
                        <div
                          key={color.id}
                          className={cn(
                            'rounded-2xl border-4 p-3 transition-all',
                            qty > 0
                              ? 'border-[#ff7b00] shadow-[4px_4px_0px_#cc6200] bg-orange-50'
                              : 'border-[#1a4073] shadow-[4px_4px_0px_#1a4073] bg-white'
                          )}
                        >
                          <div
                            className="w-10 h-10 rounded-full border-4 border-white shadow-md mx-auto mb-2"
                            style={{ backgroundColor: color.hex_code }}
                          />
                          <p className="text-xs font-black text-center text-[#0c2a50] truncate">{color.name}</p>
                          <p className="text-xs text-center font-bold text-gray-500 mb-2">{fmt(price)}</p>
                          {color.is_on_sale && (
                            <p className="text-[10px] text-center font-bold text-red-500 mb-1">SALE</p>
                          )}
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => updateExtra(color, -1)}
                              disabled={qty === 0}
                              className="w-7 h-7 rounded-full border-2 border-[#1a4073] flex items-center justify-center disabled:opacity-30 hover:bg-blue-50"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="font-black text-[#0c2a50] w-4 text-center">{qty}</span>
                            <button
                              onClick={() => updateExtra(color, 1)}
                              className="w-7 h-7 rounded-full border-2 border-[#1a4073] flex items-center justify-center hover:bg-blue-50"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {paintExtras.length > 0 && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4">
                    <p className="font-black text-[#0c2a50] mb-2">Selected extras:</p>
                    <ul className="space-y-1">
                      {paintExtras.map(pe => (
                        <li key={pe.color.id} className="flex justify-between text-sm font-semibold text-gray-700">
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full inline-block border border-gray-300" style={{ backgroundColor: pe.color.hex_code }} />
                            {pe.color.name} × {pe.quantity}
                          </span>
                          <span>{fmt(effectivePrice(pe.color.price, pe.color.is_on_sale, pe.color.sale_price) * pe.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP: SUMMARY ───────────────────────────────────────────── */}
            {step === 'summary' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[#0c2a50] mb-1">Review Your Order</h2>
                  <p className="text-gray-500">Check your selections before proceeding to checkout.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: selections */}
                  <div className="space-y-4">
                    {/* Image preview */}
                    {(imagePreview || selectedGeneration?.image_url) && (
                      <div className="rounded-2xl overflow-hidden border-4 border-[#1a4073] shadow-[4px_4px_0px_#1a4073] aspect-video flex items-center justify-center bg-gray-50">
                        <img
                          src={imagePreview ?? resolveImageUrl(selectedGeneration!.image_url)}
                          alt="Reference"
                          className="object-contain max-h-48 max-w-full"
                        />
                      </div>
                    )}

                    {/* Config summary */}
                    <div className="border-4 border-[#1a4073] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#1a4073]">
                      <div className="bg-[#1a4073] px-4 py-2">
                        <p className="font-black text-white text-sm">Configuration</p>
                      </div>
                      <div className="divide-y divide-gray-100">
                        <Row label="Image source" value={imageSource === 'ai' ? 'AI Generation' : 'Uploaded image'} />
                        <Row label="Size" value={selectedSize ? `${selectedSize.size_mm}mm` : '—'} />
                        <Row label="Finish" value={selectedFinish?.name ?? '—'} />
                        {pricing?.painting && (
                          <Row label="Painting tier" value={pricing.painting.tier_name} />
                        )}
                        {paintExtras.length > 0 && (
                          <Row
                            label="Paint extras"
                            value={paintExtras.map(pe => `${pe.color.name} ×${pe.quantity}`).join(', ')}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: pricing */}
                  <div>
                    {loadingPricing ? (
                      <div className="flex justify-center py-16">
                        <Loader2 size={32} className="animate-spin text-[#1a4073]" />
                      </div>
                    ) : pricing ? (
                      <div className="border-4 border-[#1a4073] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#1a4073]">
                        <div className="bg-[#1a4073] px-4 py-2">
                          <p className="font-black text-white text-sm">Price Breakdown</p>
                        </div>
                        <div className="p-4 space-y-2">
                          <PriceRow label={`Size (${pricing.size.size_mm}mm)`} amount={pricing.size.price} sale={pricing.size.is_on_sale} />
                          <PriceRow label={pricing.finish.name} amount={pricing.finish.price} sale={pricing.finish.is_on_sale} />
                          {pricing.painting && (
                            <PriceRow label={`Painting — ${pricing.painting.tier_name}`} amount={pricing.painting.price} />
                          )}
                          {pricing.extras.map((ex, i) => (
                            <PriceRow key={i} label={`${ex.color_name} ×${ex.quantity}`} amount={ex.line_total} sale={ex.is_on_sale} />
                          ))}
                          <div className="border-t-2 border-dashed border-gray-200 pt-2 mt-2">
                            <PriceRow label="Subtotal" amount={pricing.subtotal_before_discount} />
                          </div>
                          {pricing.discount_amount > 0 && (
                            <PriceRow
                              label={`${pricing.membership_tier ? pricing.membership_tier.charAt(0).toUpperCase() + pricing.membership_tier.slice(1) : ''} discount (${pricing.discount_percentage}%)`}
                              amount={-pricing.discount_amount}
                              highlight="green"
                            />
                          )}
                          {pricing.delivery.qualifies_free ? (
                            <PriceRow label="Delivery" amount={0} freeLabel="FREE" highlight="green" />
                          ) : (
                            <div className="space-y-1">
                              <PriceRow label="Delivery" amount={pricing.delivery.price} />
                              <p className="text-xs text-orange-600 font-semibold pl-1">
                                Spend {fmt(pricing.delivery.amount_to_free)} more for free delivery
                              </p>
                            </div>
                          )}
                          <div className="border-t-4 border-[#1a4073] pt-3 mt-2 flex justify-between items-center">
                            <span className="font-black text-[#0c2a50] text-lg">Total</span>
                            <span className="font-black text-[#ff7b00] text-2xl">{fmt(pricing.total)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-8">Pricing unavailable</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div>
            {step !== 'image' && (
              <Button variant="outline" onClick={goBack}>
                <ChevronLeft size={18} className="mr-1" /> Back
              </Button>
            )}
          </div>
          <div>
            {step !== 'summary' ? (
              <Button
                variant="primary"
                onClick={goNext}
                disabled={!canProceed[step]}
              >
                Continue <ChevronRight size={18} className="ml-1" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={handleCheckout}
                disabled={!canProceed.summary}
              >
                <ShoppingCart size={18} className="mr-2" />
                Proceed to Checkout
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <span className="text-gray-500 font-semibold">{label}</span>
      <span className="font-bold text-[#0c2a50] text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function PriceRow({
  label, amount, sale, freeLabel, highlight,
}: {
  label: string;
  amount: number;
  sale?: boolean;
  freeLabel?: string;
  highlight?: 'green';
}) {
  return (
    <div className="flex justify-between text-sm items-center">
      <span className={cn('font-semibold', sale ? 'text-red-500' : 'text-gray-600')}>{label}</span>
      <span className={cn(
        'font-black',
        highlight === 'green' ? 'text-green-600' : sale ? 'text-red-500' : 'text-[#0c2a50]'
      )}>
        {freeLabel ?? (amount < 0 ? `-${fmt(Math.abs(amount))}` : fmt(amount))}
      </span>
    </div>
  );
}
