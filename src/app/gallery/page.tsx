'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/useAuth';
import { useToast } from '@/lib/toast/ToastContext';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api/client';
import { ModelViewer3D } from '@/components/ui/ModelViewer3D';
import { Download, ShoppingCart, RefreshCw, X, Box, ZoomIn, ZoomOut, Expand } from 'lucide-react';

interface SavedGeneration {
  id: string;
  prompt: string;
  image_url: string;
  stl_url: string | null;
  created_at: string;
}

export default function GalleryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { success } = useToast();
  const [savedItems, setSavedItems] = useState<SavedGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewTarget, setViewTarget] = useState<SavedGeneration | null>(null);
  const [imgZoom, setImgZoom] = useState(1);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedGenerations();
    } else {
      loadLocalStorage();
    }
  }, [isAuthenticated]);

  // Reset zoom when modal changes
  useEffect(() => { setImgZoom(1); }, [viewTarget]);

  const loadLocalStorage = () => {
    const existingSaved = JSON.parse(localStorage.getItem('2dtoy_gallery') || '[]');
    const mapped = existingSaved.map((item: any) => ({
      id: item.id,
      prompt: item.prompt,
      image_url: item.imageUrl,
      stl_url: null,
      created_at: item.date,
    }));
    setSavedItems(mapped);
    setLoading(false);
  };

  const fetchSavedGenerations = async () => {
    try {
      const response = await apiClient.get('/generations/gallery');
      setSavedItems(response.data || []);
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
      loadLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center pt-24">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 sm:p-8 max-w-7xl mx-auto pt-24">
      <h1 className="text-4xl font-bold text-[#0c2a50] mb-8 text-center pt-8">Miniature Gallery</h1>
      <p className="text-center text-[#1a4073] mb-12 max-w-2xl mx-auto">
        Browse our collection of custom 3D printed models, tabletop terrain, and hobby pieces.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedItems.map((item) => (
          <Card
            key={item.id}
            className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-orange-300 shadow-[4px_4px_0px_#cc6200] cursor-pointer group"
            onClick={() => router.push(`/preview/${item.id}`)}
          >
            <div className="h-64 bg-gray-100 w-full flex items-center justify-center overflow-hidden relative">
              {item.image_url ? (
                <img src={item.image_url} alt={item.prompt} className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <span className="text-gray-400 font-semibold">No Image</span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 bg-white/95 text-[#0c2a50] text-xs font-black px-3 py-1.5 rounded-full shadow transition-opacity duration-200">
                  <Expand size={11} /> Full 3D Preview
                </span>
              </div>
              {item.stl_url && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-blue-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <Box size={9} /> 3D
                </div>
              )}
            </div>
            <CardContent className="p-4 bg-orange-50">
              <h3 className="font-bold text-base text-[#0c2a50] line-clamp-1">{item.prompt}</h3>
              <p className="text-xs text-orange-600 font-bold tracking-wide mt-0.5">MY SAVED GENERATION</p>
            </CardContent>
          </Card>
        ))}

        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={`static_${i}`} className="overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            <div className="h-64 bg-blue-100 w-full flex items-center justify-center">
              <p className="text-blue-400 font-semibold">Gallery Image {i}</p>
            </div>
            <CardContent className="p-4 bg-white/50 backdrop-blur-sm">
              <h3 className="font-bold text-lg text-gray-800">Custom Model {i}</h3>
              <p className="text-sm text-gray-500">High Detail Resin</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail modal */}
      {viewTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setViewTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-[#0c2a50] line-clamp-1">{viewTarget.prompt}</h2>
              <button onClick={() => setViewTarget(null)} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors shrink-0 ml-3">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Preview — kept outside scroll so touch events reach model-viewer */}
            <div className="relative bg-slate-50 flex items-center justify-center shrink-0">
              {viewTarget.stl_url ? (
                <div className="w-full" style={{ height: 360 }}>
                  <ModelViewer3D src={viewTarget.stl_url} poster={viewTarget.image_url ?? undefined} />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full pointer-events-none">
                    <Box size={12} />
                    <span>Drag to rotate · Pinch/scroll to zoom</span>
                  </div>
                </div>
              ) : viewTarget.image_url ? (
                <div className="w-full flex flex-col items-center">
                  <div className="w-full flex items-center justify-center" style={{ maxHeight: 360, overflow: 'hidden' }}>
                    <img
                      src={viewTarget.image_url}
                      alt={viewTarget.prompt}
                      style={{ transform: `scale(${imgZoom})`, transformOrigin: 'center', transition: 'transform 0.2s', maxWidth: '100%', cursor: imgZoom > 1 ? 'zoom-out' : 'zoom-in' }}
                      className="object-contain p-4"
                      onClick={() => setImgZoom(z => z >= 2.5 ? 1 : z + 0.5)}
                    />
                  </div>
                  <div className="flex items-center gap-3 py-2 bg-white/80 w-full justify-center border-t border-slate-100">
                    <button className="p-1.5 rounded-full hover:bg-slate-100 disabled:opacity-40" onClick={() => setImgZoom(z => Math.max(1, z - 0.5))} disabled={imgZoom <= 1}>
                      <ZoomOut size={16} className="text-slate-500" />
                    </button>
                    <span className="text-xs font-semibold text-slate-500 w-10 text-center">{Math.round(imgZoom * 100)}%</span>
                    <button className="p-1.5 rounded-full hover:bg-slate-100 disabled:opacity-40" onClick={() => setImgZoom(z => Math.min(3, z + 0.5))} disabled={imgZoom >= 3}>
                      <ZoomIn size={16} className="text-slate-500" />
                    </button>
                    <span className="text-xs text-slate-400 ml-1">or click image to zoom</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 font-bold py-20">No preview available</p>
              )}
            </div>

            {/* Scrollable bottom: actions only */}
            <div className="overflow-y-auto">
            {/* Actions */}
            <div className="px-6 py-5 flex flex-col gap-3">
              <Button
                variant="secondary"
                className="w-full font-bold bg-[#0c2a50] text-white hover:bg-[#1a4073]"
                onClick={() => { setViewTarget(null); router.push(`/preview/${viewTarget.id}`); }}
              >
                <Expand size={16} className="mr-2" /> Full 3D Preview
              </Button>
              <Button
                variant="primary"
                className="w-full font-bold"
                onClick={() => {
                  sessionStorage.setItem('noys_builder_preselect', JSON.stringify({ generationId: viewTarget.id, imageUrl: viewTarget.image_url }));
                  router.push('/builder?source=ai');
                  setViewTarget(null);
                }}
              >
                <ShoppingCart size={18} className="mr-2" /> Order This Print
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={!viewTarget.stl_url}
                  onClick={() => viewTarget.stl_url && window.open(viewTarget.stl_url, '_blank')}
                >
                  <Download size={16} className="mr-2" /> Download STL
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-blue-200"
                  onClick={() => {
                    router.push(`/ai-generator?prompt=${encodeURIComponent(viewTarget.prompt)}`);
                    setViewTarget(null);
                  }}
                >
                  <RefreshCw size={16} className="mr-2 text-blue-500" /> Reuse Prompt
                </Button>
              </div>
            </div>
            </div>{/* end scrollable section */}
          </div>
        </div>
      )}
    </div>
  );
}
