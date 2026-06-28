'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Play, Image as ImageIcon, Film } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { useCart } from '@/lib/cart/CartContext';
import { useToast } from '@/lib/toast/ToastContext';
import { Button } from '@/components/ui/Button';

interface MediaRow {
  id: string;
  url: string;
  media_type: 'image' | 'video';
  sort_order: number;
}

interface ColourOption {
  id: string;
  name: string;
  hex_code: string;
  sort_order: number;
}

interface ScaleOption {
  label: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  media: MediaRow[];
  colours: ColourOption[];
  scale_variations?: { enabled: boolean; scales: ScaleOption[] } | null;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const { success, error: toastError } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedColour, setSelectedColour] = useState<ColourOption | null>(null);
  const [selectedScale, setSelectedScale] = useState<ScaleOption | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchProduct = async () => {
      try {
        const res = await apiClient.get(`/products/${id}`);
        if (!cancelled) {
          setProduct(res.data);
          setActiveIdx(0);
          setSelectedColour(null);
          setSelectedScale(null);
        }
      } catch (err) {
        if (!cancelled) {
          toastError('Could not load this product.');
          router.replace('/shop');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (id) fetchProduct();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const gallery: MediaRow[] = (() => {
    if (!product) return [];
    if (product.media && product.media.length > 0) return product.media;
    if (product.image_url) {
      return [{ id: 'legacy', url: product.image_url, media_type: 'image', sort_order: 0 }];
    }
    return [];
  })();

  const active = gallery[activeIdx];

  const hasColours = (product?.colours?.length ?? 0) > 0;
  const hasScales = !!(product?.scale_variations?.enabled && (product.scale_variations.scales?.length ?? 0) > 0);
  const canAddToCart = (!hasColours || selectedColour !== null) && (!hasScales || selectedScale !== null);
  // Before a scale is chosen, advertise the lowest scale price as the starting
  // ("From") price; once chosen, show that scale's exact price.
  const lowestScalePrice = hasScales
    ? Math.min(...product!.scale_variations!.scales.map(s => Number(s.price)))
    : (product?.price ?? 0);
  const displayPrice = selectedScale ? selectedScale.price : (hasScales ? lowestScalePrice : (product?.price ?? 0));
  const showFromPrefix = hasScales && !selectedScale;

  const handleAddToCart = () => {
    if (!product || !canAddToCart) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: displayPrice,
      quantity: 1,
      image: product.image_url || gallery.find(m => m.media_type === 'image')?.url || undefined,
      colour: selectedColour ? { name: selectedColour.name, hex_code: selectedColour.hex_code } : undefined,
      scale: selectedScale ? { label: selectedScale.label, price: selectedScale.price } : undefined,
    });
    success(`Added ${product.name}${selectedColour ? ` (${selectedColour.name})` : ''}${selectedScale ? ` — ${selectedScale.label}` : ''} to your cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center pt-24">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to shop
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

        {/* ── Gallery ───────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="relative bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden aspect-square flex items-center justify-center">
            {!active ? (
              <p className="text-slate-300 font-bold">No preview available</p>
            ) : active.media_type === 'video' ? (
              <video
                key={active.id}
                src={active.url}
                controls
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <img
                src={active.url}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
              {gallery.map((m, i) => (
                <button
                  key={m.id ?? `${m.media_type}-${i}`}
                  onClick={() => setActiveIdx(i)}
                  className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    i === activeIdx
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                  aria-label={m.media_type === 'video' ? 'Play turntable video' : `Photo ${i + 1}`}
                >
                  {m.media_type === 'video' ? (
                    <>
                      <video src={m.url} className="w-full h-full object-cover bg-black" muted />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play size={20} className="text-white drop-shadow" fill="currentColor" />
                      </div>
                    </>
                  ) : (
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}

          {gallery.some(m => m.media_type === 'video') && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Film size={12} /> 360° turntable video included
            </p>
          )}
        </div>

        {/* ── Info / actions ────────────────────────────────────────── */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#0c2a50] leading-tight">
              {product.name}
            </h1>
            <p className="text-3xl font-black text-orange-500 mt-3">
              {showFromPrefix && <span className="text-xl font-bold text-orange-400 mr-1.5">From</span>}
              £{Number(displayPrice).toFixed(2)}
            </p>
          </div>

          {product.description && (
            <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                Description
              </h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {hasColours && (
            <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                Print Colour
              </h2>
              <div className="flex flex-wrap gap-3">
                {product!.colours.map((c) => (
                  <button
                    key={c.id}
                    title={c.name}
                    onClick={() => setSelectedColour(c)}
                    className={`w-9 h-9 rounded-full border-2 transition-all ${
                      selectedColour?.id === c.id
                        ? 'border-blue-500 ring-2 ring-blue-300 scale-110'
                        : 'border-slate-300 hover:border-blue-400'
                    }`}
                    style={{ backgroundColor: c.hex_code }}
                    aria-label={c.name}
                    aria-pressed={selectedColour?.id === c.id}
                  />
                ))}
              </div>
              {selectedColour ? (
                <p className="mt-2 text-sm font-semibold text-blue-600">{selectedColour.name}</p>
              ) : (
                <p className="mt-2 text-sm text-slate-400">Please select a colour</p>
              )}
            </div>
          )}

          {hasScales && (
            <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                Scale
              </h2>
              <select
                value={selectedScale?.label ?? ''}
                onChange={e => {
                  const found = product!.scale_variations!.scales.find(s => s.label === e.target.value);
                  setSelectedScale(found ?? null);
                }}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-slate-700 font-semibold"
              >
                <option value="">Select a scale...</option>
                {product!.scale_variations!.scales.map(s => (
                  <option key={s.label} value={s.label}>
                    {s.label} — £{Number(s.price).toFixed(2)}
                  </option>
                ))}
              </select>
              {!selectedScale && (
                <p className="mt-2 text-sm text-slate-400">Please select a scale</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              className={`w-full font-black ${!canAddToCart ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleAddToCart}
              disabled={!canAddToCart}
            >
              <ShoppingCart size={20} className="mr-2" />
              Add to Cart
            </Button>
            <Link href="/shop">
              <Button variant="outline" className="w-full">
                Continue shopping
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
            <span className="inline-flex items-center gap-1.5">
              <ImageIcon size={14} /> {gallery.filter(m => m.media_type === 'image').length} photo{gallery.filter(m => m.media_type === 'image').length === 1 ? '' : 's'}
            </span>
            {gallery.some(m => m.media_type === 'video') && (
              <span className="inline-flex items-center gap-1.5">
                <Film size={14} /> 360° video
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
