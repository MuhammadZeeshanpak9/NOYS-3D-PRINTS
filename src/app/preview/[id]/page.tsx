'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { useToast } from '@/lib/toast/ToastContext';
import { useCart } from '@/lib/cart/CartContext';
import apiClient, { getGenerationModelUrl } from '@/lib/api/client';
import { ModelViewer3D } from '@/components/ui/ModelViewer3D';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft, ShoppingCart, RefreshCw, Save,
  CheckCircle, ZoomIn, ZoomOut, RotateCcw, Box, Image as ImageIcon,
  Calendar, Cpu,
} from 'lucide-react';

interface Generation {
  id: string;
  prompt: string;
  image_url: string | null;
  stl_url: string | null;
  is_saved: boolean;
  credits_used: number;
  created_at: string;
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { success, error: toastError } = useToast();
  const { addToCart } = useCart();

  const [generation, setGeneration] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [imgZoom, setImgZoom] = useState(1);
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=/preview/${id}`);
    }
  }, [authLoading, isAuthenticated, id, router]);

  useEffect(() => {
    if (isAuthenticated && id) fetchGeneration();
  }, [isAuthenticated, id]);

  const fetchGeneration = async () => {
    try {
      const res = await apiClient.get(`/generations/${id}`);
      setGeneration(res.data);
      setIsSaved(res.data.is_saved);
    } catch {
      toastError('Could not load this model. It may have been deleted.');
      router.replace('/profile/history');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generation) return;
    setIsSaving(true);
    try {
      await apiClient.post(`/generations/${generation.id}/save`);
      setIsSaved(true);
      success('Saved to your Gallery!');
    } catch {
      toastError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOrder = () => {
    if (!generation) return;
    sessionStorage.setItem('noys_builder_preselect', JSON.stringify({
      generationId: generation.id,
      imageUrl: generation.image_url,
    }));
    router.push('/builder?source=ai');
  };

  // Image pan handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (imgZoom <= 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX - imgPos.x, y: e.clientY - imgPos.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setImgPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const onMouseUp = () => { isDragging.current = false; };

  const resetView = () => { setImgZoom(1); setImgPos({ x: 0, y: 0 }); };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c1a2e]">
        <div className="w-14 h-14 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!generation) return null;

  const has3D = !!generation.stl_url;
  const hasImage = !!generation.image_url;

  return (
    <div className="min-h-screen bg-[#0c1a2e] flex flex-col">

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#0c1a2e]/90 backdrop-blur border-b border-white/10 z-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-semibold"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="flex items-center gap-2">
          {has3D && (
            <span className="flex items-center gap-1.5 bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-400/30">
              <Box size={12} /> 3D Model
            </span>
          )}
          {!has3D && hasImage && (
            <span className="flex items-center gap-1.5 bg-slate-500/20 text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-400/30">
              <ImageIcon size={12} /> Image Preview
            </span>
          )}
        </div>

        <div className="flex items-center gap-2" />
      </header>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row flex-1" style={{ minHeight: 0 }}>

        {/* Viewer — takes most of the screen */}
        <div className="flex-1 relative bg-[#111c2e] flex items-center justify-center" style={{ minHeight: 420 }}>

          {has3D ? (
            <div className="absolute inset-0">
              <ModelViewer3D
                src={getGenerationModelUrl(generation.id)}
                poster={generation.image_url ?? undefined}
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 text-white/80 text-xs px-4 py-2 rounded-full pointer-events-none select-none z-10">
                <Box size={12} />
                <span>Drag to rotate · Scroll to zoom · Two fingers to pan</span>
              </div>
            </div>
          ) : hasImage ? (
            <div
              className="w-full h-full flex items-center justify-center overflow-hidden select-none"
              style={{ minHeight: 400, cursor: imgZoom > 1 ? 'grab' : 'default' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <img
                src={generation.image_url!}
                alt={generation.prompt}
                draggable={false}
                style={{
                  transform: `translate(${imgPos.x}px, ${imgPos.y}px) scale(${imgZoom})`,
                  transformOrigin: 'center',
                  transition: isDragging.current ? 'none' : 'transform 0.2s',
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  filter: 'grayscale(100%)',
                }}
              />
              {/* Zoom controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 text-white/80 px-4 py-2 rounded-full">
                <button onClick={() => { setImgZoom(z => Math.max(1, z - 0.5)); if (imgZoom <= 1.5) resetView(); }} className="hover:text-white transition-colors disabled:opacity-40" disabled={imgZoom <= 1}>
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-semibold w-10 text-center">{Math.round(imgZoom * 100)}%</span>
                <button onClick={() => setImgZoom(z => Math.min(4, z + 0.5))} className="hover:text-white transition-colors disabled:opacity-40" disabled={imgZoom >= 4}>
                  <ZoomIn size={16} />
                </button>
                <div className="w-px h-4 bg-white/20 mx-1" />
                <button onClick={resetView} className="hover:text-white transition-colors" title="Reset view">
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-white/30 text-center">
              <Box size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No preview available</p>
            </div>
          )}
        </div>

        {/* Info panel */}
        <aside className="w-full lg:w-80 xl:w-96 bg-[#0f1f35] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Prompt */}
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Prompt</p>
              <p className="text-white font-semibold text-base leading-snug">"{generation.prompt}"</p>
            </div>

            <div className="h-px bg-white/10" />

            {/* Meta */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-white/50 text-sm">
                <Calendar size={14} className="shrink-0" />
                <span>{new Date(generation.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2.5 text-white/50 text-sm">
                <Cpu size={14} className="shrink-0" />
                <span>{generation.credits_used} credit{generation.credits_used !== 1 ? 's' : ''} used</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                {has3D
                  ? <span className="flex items-center gap-1.5 text-blue-300"><Box size={14} /> Full 3D model available</span>
                  : <span className="flex items-center gap-1.5 text-slate-400"><ImageIcon size={14} /> Image preview only</span>
                }
              </div>
            </div>

            <div className="h-px bg-white/10" />

            {/* Actions */}
            <div className="space-y-3">
              <Button
                variant="primary"
                className="w-full font-bold"
                onClick={handleOrder}
              >
                <ShoppingCart size={18} className="mr-2" /> Order This Print
              </Button>

              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
                onClick={() => router.push(`/ai-generator?prompt=${encodeURIComponent(generation.prompt)}`)}
              >
                <RefreshCw size={16} className="mr-2" /> Reuse This Prompt
              </Button>

              <Button
                variant="outline"
                className={`w-full border-white/20 hover:bg-white/10 ${isSaved ? 'text-green-400 border-green-400/40' : 'text-white'}`}
                onClick={handleSave}
                isLoading={isSaving}
                disabled={isSaved}
              >
                {isSaved
                  ? <><CheckCircle size={16} className="mr-2" /> Saved to Gallery</>
                  : <><Save size={16} className="mr-2" /> Save to Gallery</>
                }
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
